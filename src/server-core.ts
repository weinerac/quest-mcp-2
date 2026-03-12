import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";

import { questHotels } from "./data.js";
import type { QuestHotel } from "./types.js";

const SEARCH_UI_URI = "ui://quest/search.html";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type SearchMode = "distance" | "metadata";

export interface QuestSearchResult extends Record<string, unknown> {
  searchMode: SearchMode;
  query?: string;
  latitude?: number;
  longitude?: number;
  appliedAmenities: string[];
  guests?: number;
  results: QuestHotel[];
}

const searchInputSchema = z
  .object({
    query: z.string().trim().min(1).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    amenities: z.array(z.string().trim().min(1)).optional(),
    guests: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(10).default(5),
  })
  .refine(
    (value) =>
      Boolean(value.query) ||
      (typeof value.latitude === "number" && typeof value.longitude === "number"),
    {
      message: "Provide either a query string or both latitude and longitude.",
    },
  );

const propertyIdSchema = z.object({
  propertyId: z.string().trim().min(1),
});

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function minimumRate(hotel: QuestHotel): number {
  return Math.min(...hotel.roomTypes.map((room) => room.baseRate));
}

function supportsGuests(hotel: QuestHotel, guests?: number): boolean {
  if (!guests) {
    return true;
  }

  return hotel.roomTypes.some((room) => room.available && room.maxGuests >= guests);
}

function supportsAmenities(hotel: QuestHotel, amenities: string[]): boolean {
  if (amenities.length === 0) {
    return true;
  }

  return amenities.every((requestedAmenity) => {
    const wanted = normalize(requestedAmenity);

    return hotel.amenities.some((hotelAmenity) => normalize(hotelAmenity).includes(wanted));
  });
}

function metadataScore(hotel: QuestHotel, query: string): number {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);
  const exactFields = [
    hotel.name,
    hotel.city,
    hotel.state,
    hotel.address,
    hotel.postcode,
  ].map(normalize);

  let score = 0;

  for (const field of exactFields) {
    if (field === normalizedQuery) {
      score += 120;
    } else if (field.includes(normalizedQuery)) {
      score += 80;
    }
  }

  const weightedFields = [
    { text: hotel.name, weight: 18 },
    { text: hotel.address, weight: 12 },
    { text: hotel.city, weight: 24 },
    { text: `${hotel.city} ${hotel.state}`, weight: 30 },
    { text: hotel.state, weight: 16 },
    { text: hotel.description, weight: 6 },
    { text: hotel.amenities.join(" "), weight: 4 },
  ];

  for (const token of tokens) {
    for (const field of weightedFields) {
      if (normalize(field.text).includes(token)) {
        score += field.weight;
      }
    }
  }

  return score;
}

function runQuestSearch(input: z.infer<typeof searchInputSchema>): QuestSearchResult {
  const appliedAmenities = input.amenities ?? [];
  let candidates = questHotels
    .filter((hotel) => supportsAmenities(hotel, appliedAmenities))
    .filter((hotel) => supportsGuests(hotel, input.guests));

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    const latitude = input.latitude;
    const longitude = input.longitude;
    const results = candidates
      .map((hotel) => ({
        ...hotel,
        distance: calculateDistance(latitude, longitude, hotel.latitude, hotel.longitude),
      }))
      .sort((left, right) => (left.distance ?? Number.MAX_SAFE_INTEGER) - (right.distance ?? Number.MAX_SAFE_INTEGER))
      .slice(0, input.limit);

    return {
      searchMode: "distance",
      query: input.query,
      latitude,
      longitude,
      appliedAmenities,
      guests: input.guests,
      results,
    };
  }

  const query = input.query ?? "";
  candidates = candidates
    .map((hotel) => ({
      hotel,
      score: metadataScore(hotel, query),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || right.hotel.rating - left.hotel.rating)
    .slice(0, input.limit)
    .map(({ hotel }) => hotel);

  return {
    searchMode: "metadata",
    query,
    appliedAmenities,
    guests: input.guests,
    results: candidates,
  };
}

function getPropertyDetails(propertyId: string): QuestHotel {
  const hotel = questHotels.find((candidate) => candidate.id === propertyId);

  if (!hotel) {
    throw new Error(`Unknown Quest property: ${propertyId}`);
  }

  return hotel;
}

function formatSearchSummary(result: QuestSearchResult): string {
  if (result.results.length === 0) {
    return `No Quest properties matched${result.query ? ` "${result.query}"` : " the request"}.`;
  }

  const lead =
    result.searchMode === "distance"
      ? `Found ${result.results.length} Quest properties closest to the requested coordinates.`
      : `Found ${result.results.length} Quest properties that best match "${result.query ?? ""}".`;

  const details = result.results
    .map((hotel, index) => {
      const distanceLine =
        result.searchMode === "distance" && typeof hotel.distance === "number"
          ? `Distance: ${hotel.distance.toFixed(1)} km`
          : `City: ${hotel.city}, ${hotel.state}`;

      return [
        `${index + 1}. ${hotel.name}`,
        hotel.address,
        distanceLine,
        `From $${minimumRate(hotel)}/night`,
        `Amenities: ${hotel.amenities.join(", ")}`,
      ].join("\n");
    })
    .join("\n\n");

  return `${lead}\n\n${details}`;
}

function formatPropertyDetails(hotel: QuestHotel): string {
  return [
    hotel.name,
    hotel.address,
    `Phone: ${hotel.phone}`,
    hotel.email ? `Email: ${hotel.email}` : undefined,
    `Rating: ${hotel.rating}/5`,
    `Amenities: ${hotel.amenities.join(", ")}`,
    "",
    hotel.description,
    "",
    "Room types:",
    ...hotel.roomTypes.map(
      (room) =>
        `- ${room.name}: sleeps ${room.maxGuests}, ${room.beds}, ${room.size}, from $${room.baseRate}/night`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

async function readBuiltUiHtml(): Promise<string> {
  const uiPath = path.resolve(__dirname, "../dist/ui/quest-app.html");
  return readFile(uiPath, "utf8");
}

export function createQuestServer(options?: { loadUiHtml?: () => Promise<string> }): McpServer {
  const server = new McpServer(
    {
      name: "quest-apartment-hotels-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  const loadUiHtml = options?.loadUiHtml ?? readBuiltUiHtml;

  registerAppTool(
    server,
    "quest_search_properties",
    {
      title: "Find Quest Properties",
      description:
        "Find Quest Apartment Hotels near a user-provided location. Prefer passing latitude and longitude when you know the exact place; otherwise pass a query string and the tool will rank Quest properties by metadata match.",
      inputSchema: searchInputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: SEARCH_UI_URI,
        },
      },
    },
    async (args: z.infer<typeof searchInputSchema>) => {
      const result = runQuestSearch(args);

      return {
        content: [
          {
            type: "text",
            text: formatSearchSummary(result),
          },
        ],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "quest_list_properties",
    {
      title: "List Quest Properties",
      description: "List all Quest properties with their cities, states, coordinates, and core details.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: questHotels
            .map(
              (hotel) =>
                `${hotel.name} | ${hotel.city}, ${hotel.state} | ${hotel.latitude}, ${hotel.longitude} | from $${minimumRate(hotel)}/night`,
            )
            .join("\n"),
        },
      ],
      structuredContent: {
        results: questHotels,
      },
    }),
  );

  registerAppTool(
    server,
    "quest_get_property_details",
    {
      title: "Get Property Details",
      description: "Get detailed information for a specific Quest property.",
      inputSchema: propertyIdSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: SEARCH_UI_URI,
        },
      },
    },
    async ({ propertyId }: z.infer<typeof propertyIdSchema>) => {
      const hotel = getPropertyDetails(propertyId);

      return {
        content: [
          {
            type: "text",
            text: formatPropertyDetails(hotel),
          },
        ],
        structuredContent: {
          hotel,
        },
      };
    },
  );

  registerAppTool(
    server,
    "quest_get_property_details_for_app",
    {
      title: "Get Property Details For App",
      description: "App-only helper that fetches Quest property details for the interactive view.",
      inputSchema: propertyIdSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: SEARCH_UI_URI,
          visibility: ["app"],
        },
      },
    },
    async ({ propertyId }: z.infer<typeof propertyIdSchema>) => {
      const hotel = getPropertyDetails(propertyId);

      return {
        content: [
          {
            type: "text",
            text: formatPropertyDetails(hotel),
          },
        ],
        structuredContent: {
          hotel,
        },
      };
    },
  );

  registerAppResource(
    server,
    "Quest Search App",
    SEARCH_UI_URI,
    {
      description: "Interactive Quest Apartment Hotels search results.",
    },
    async () => {
      const html = await loadUiHtml();

      return {
        contents: [
          {
            uri: SEARCH_UI_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  resourceDomains: ["https://images.unsplash.com"],
                  connectDomains: [],
                },
              },
            },
          },
        ],
      };
    },
  );

  return server;
}
