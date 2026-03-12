import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext,
  type McpUiToolInputNotification,
  type McpUiToolResultNotification,
} from "@modelcontextprotocol/ext-apps";

type SearchMode = "distance" | "metadata";

interface RoomType {
  id: string;
  name: string;
  maxGuests: number;
  beds: string;
  size: string;
  amenities: string[];
  baseRate: number;
  available: boolean;
}

interface QuestHotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  amenities: string[];
  roomTypes: RoomType[];
  description: string;
  imageUrl?: string;
  rating: number;
  distance?: number;
}

interface SearchResultPayload {
  searchMode: SearchMode;
  query?: string;
  latitude?: number;
  longitude?: number;
  appliedAmenities: string[];
  guests?: number;
  results: QuestHotel[];
}

interface DetailPayload {
  hotel: QuestHotel;
}

class QuestAppView {
  private app = new App({ name: "Quest Apartment Hotels App", version: "1.0.0" });
  private searchPayload: SearchResultPayload | null = null;
  private currentToolName = "";

  private readonly summary = this.requireElement("summary");
  private readonly status = this.requireElement("status");
  private readonly results = this.requireElement("results");
  private readonly detail = this.requireElement("detail");
  private readonly detailContent = this.requireElement("detail-content");

  constructor() {
    this.app.ontoolinput = (params) => this.handleToolInput(params);
    this.app.ontoolresult = (params) => this.handleToolResult(params);
    this.app.onhostcontextchanged = (context) => this.handleHostContext(context);
    this.app.onteardown = async () => ({});

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>("[data-action]");

      if (!button) {
        return;
      }

      const action = button.dataset.action;

      if (action === "close-detail") {
        this.closeDetail();
        return;
      }

      if (action === "view-property" && button.dataset.propertyId) {
        void this.loadPropertyDetail(button.dataset.propertyId);
      }
    });
  }

  async connect(): Promise<void> {
    await this.app.connect(new PostMessageTransport(window.parent, window.parent));
    this.renderEmptyState();
  }

  private handleToolInput(params: McpUiToolInputNotification["params"]): void {
    const hostContext = this.app.getHostContext();
    this.currentToolName = hostContext?.toolInfo?.tool.name ?? "";

    if (this.currentToolName === "quest_search_properties") {
      const query = typeof params.arguments?.query === "string" ? params.arguments.query : "";
      const guests = typeof params.arguments?.guests === "number" ? params.arguments.guests : undefined;
      const amenities = Array.isArray(params.arguments?.amenities)
        ? params.arguments.amenities.filter((value): value is string => typeof value === "string")
        : [];

      this.status.textContent = query
        ? `Searching Quest properties for "${query}"...`
        : "Searching Quest properties...";
      this.summary.innerHTML = this.renderSummaryMarkup({
        searchMode: "metadata",
        query,
        guests,
        appliedAmenities: amenities,
        results: [],
      });
    }
  }

  private handleToolResult(params: McpUiToolResultNotification["params"]): void {
    const payload = params.structuredContent as Partial<SearchResultPayload & DetailPayload> | undefined;
    this.currentToolName = this.app.getHostContext()?.toolInfo?.tool.name ?? this.currentToolName;

    if (payload?.results) {
      this.searchPayload = payload as SearchResultPayload;
      this.closeDetail();
      this.renderSearchResults(this.searchPayload);
      return;
    }

    if (payload?.hotel) {
      this.renderPropertyDetail(payload.hotel);
    }
  }

  private handleHostContext(context: McpUiHostContext): void {
    if (context.theme) {
      applyDocumentTheme(context.theme);
    }

    if (context.styles?.variables) {
      applyHostStyleVariables(context.styles.variables);
    }

    if (context.styles?.css?.fonts) {
      applyHostFonts(context.styles.css.fonts);
    }

    const toolName = context.toolInfo?.tool.name;
    if (toolName) {
      this.currentToolName = toolName;
    }
  }

  private renderEmptyState(): void {
    this.status.textContent = "Run the Quest search tool from ChatGPT to see nearby properties here.";
    this.summary.innerHTML = this.renderSummaryMarkup({
      searchMode: "metadata",
      appliedAmenities: [],
      results: [],
    });
    this.results.innerHTML = `
      <section class="empty-state">
        <p>The app renders the live output of \`quest_search_properties\` and lets you open full property details without hardcoded cards.</p>
      </section>
    `;
  }

  private renderSearchResults(payload: SearchResultPayload): void {
    this.status.textContent =
      payload.results.length > 0
        ? `Showing ${payload.results.length} Quest properties.`
        : "No Quest properties matched the current request.";
    this.summary.innerHTML = this.renderSummaryMarkup(payload);

    if (payload.results.length === 0) {
      this.results.innerHTML = `
        <section class="empty-state">
          <p>Try a broader location, remove some amenity filters, or provide coordinates for true proximity ranking.</p>
        </section>
      `;
      return;
    }

    this.results.innerHTML = payload.results
      .map((hotel, index) => this.renderCardMarkup(hotel, index + 1, payload.searchMode))
      .join("");
  }

  private renderSummaryMarkup(payload: Pick<SearchResultPayload, "searchMode" | "query" | "appliedAmenities" | "guests" | "results">): string {
    const modeLabel =
      payload.searchMode === "distance" ? "Sorted by distance" : "Sorted by metadata match";
    const chips = [
      payload.query ? `Query: ${payload.query}` : "",
      payload.guests ? `Guests: ${payload.guests}` : "",
      ...payload.appliedAmenities.map((amenity) => `Amenity: ${amenity}`),
      modeLabel,
    ].filter(Boolean);

    return `
      <div class="summary-header">
        <p class="eyebrow">Quest Apartment Hotels</p>
        <h1>Closest stays, rendered from MCP tool output</h1>
      </div>
      <div class="chip-row">
        ${chips.map((chip) => `<span class="chip">${chip}</span>`).join("") || `<span class="chip">Waiting for search input</span>`}
      </div>
      <p class="summary-copy">
        ${payload.results.length > 0 ? `The cards below are generated from live structured MCP results.` : `The app stays empty until the server returns structured results.`}
      </p>
    `;
  }

  private renderCardMarkup(hotel: QuestHotel, rank: number, searchMode: SearchMode): string {
    const price = Math.min(...hotel.roomTypes.map((room) => room.baseRate));
    const distanceMarkup =
      searchMode === "distance" && typeof hotel.distance === "number"
        ? `<span class="metric">${hotel.distance.toFixed(1)} km away</span>`
        : `<span class="metric">${hotel.city}, ${hotel.state}</span>`;

    return `
      <article class="result-card">
        <div class="result-topline">
          <span class="rank">#${rank}</span>
          ${distanceMarkup}
        </div>
        <div class="result-body">
          <div class="result-copy">
            <h2>${hotel.name}</h2>
            <p class="address">${hotel.address}</p>
            <p class="description">${hotel.description}</p>
          </div>
          <div class="result-meta">
            <div class="stat">
              <span class="stat-label">Rating</span>
              <strong>${hotel.rating.toFixed(1)}</strong>
            </div>
            <div class="stat">
              <span class="stat-label">From</span>
              <strong>$${price}</strong>
            </div>
            <div class="stat">
              <span class="stat-label">Rooms</span>
              <strong>${hotel.roomTypes.length}</strong>
            </div>
          </div>
        </div>
        <div class="amenity-row">
          ${hotel.amenities.slice(0, 5).map((amenity) => `<span class="amenity">${amenity}</span>`).join("")}
        </div>
        <div class="result-actions">
          <button class="primary-button" data-action="view-property" data-property-id="${hotel.id}">View property</button>
        </div>
      </article>
    `;
  }

  private async loadPropertyDetail(propertyId: string): Promise<void> {
    this.detail.removeAttribute("hidden");
    this.detailContent.innerHTML = `<p class="detail-loading">Loading property details...</p>`;

    try {
      const result = await this.app.callServerTool({
        name: "quest_get_property_details_for_app",
        arguments: { propertyId },
      });

      const payload = result.structuredContent as DetailPayload | undefined;
      if (!payload?.hotel) {
        throw new Error("Property details were not returned by the server.");
      }

      this.renderPropertyDetail(payload.hotel);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.detailContent.innerHTML = `<p class="detail-error">${message}</p>`;
    }
  }

  private renderPropertyDetail(hotel: QuestHotel): void {
    const lowestRate = Math.min(...hotel.roomTypes.map((room) => room.baseRate));
    this.detail.removeAttribute("hidden");
    this.detailContent.innerHTML = `
      <div class="detail-header">
        <div>
          <p class="eyebrow">Property detail</p>
          <h3>${hotel.name}</h3>
        </div>
        <button class="ghost-button" data-action="close-detail">Close</button>
      </div>
      <p class="detail-address">${hotel.address}</p>
      <p class="detail-description">${hotel.description}</p>
      <div class="detail-grid">
        <div class="detail-stat">
          <span class="stat-label">Phone</span>
          <strong>${hotel.phone}</strong>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Email</span>
          <strong>${hotel.email ?? "Not listed"}</strong>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Rating</span>
          <strong>${hotel.rating.toFixed(1)}</strong>
        </div>
        <div class="detail-stat">
          <span class="stat-label">From</span>
          <strong>$${lowestRate}</strong>
        </div>
      </div>
      <div class="amenity-row">
        ${hotel.amenities.map((amenity) => `<span class="amenity">${amenity}</span>`).join("")}
      </div>
      <div class="room-list">
        ${hotel.roomTypes
          .map(
            (room) => `
              <article class="room-card">
                <div class="room-topline">
                  <h4>${room.name}</h4>
                  <span>${room.available ? "Available" : "Unavailable"}</span>
                </div>
                <p>${room.maxGuests} guests • ${room.beds} • ${room.size}</p>
                <p>${room.amenities.join(", ")}</p>
                <strong>$${room.baseRate}/night</strong>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  private closeDetail(): void {
    this.detail.setAttribute("hidden", "true");
    this.detailContent.innerHTML = "";
  }

  private requireElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element #${id}`);
    }

    return element;
  }
}

const app = new QuestAppView();
void app.connect();
