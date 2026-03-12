import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import { questHotels } from './src/data.js';
import { QuestHotel } from './src/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = new Server(
  {
    name: 'quest-apartment-hotels-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define tools - simplified for AI-driven approach
const tools: Tool[] = [
  {
    name: 'quest_get_all_hotels',
    description: 'Get all Quest Apartment Hotels with their coordinates and details. The AI can then filter and select the best properties based on user location preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          description: 'Optional: Filter by state (e.g., "NSW", "VIC", "QLD")'
        },
        city: {
          type: 'string', 
          description: 'Optional: Filter by city (e.g., "Sydney", "Melbourne")'
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Filter by required amenities (e.g., ["Gym", "Pool"])'
        }
      }
    },
    _meta: {
      ui: {
        resourceUri: 'quest-app://all-hotels'
      }
    }
  },
  {
    name: 'quest_get_property_details',
    description: 'Get detailed information about a specific Quest property',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The ID of the Quest property'
        }
      },
      required: ['propertyId']
    },
    _meta: {
      ui: {
        resourceUri: 'quest-app://property-details'
      }
    }
  },
  {
    name: 'quest_calculate_distance',
    description: 'Calculate distance between coordinates and return hotels sorted by distance. AI provides the target coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Target latitude (e.g., -37.8199 for MCG)'
        },
        longitude: {
          type: 'number', 
          description: 'Target longitude (e.g., 144.9834 for MCG)'
        },
        maxDistance: {
          type: 'number',
          description: 'Optional: Maximum distance in kilometers to return hotels'
        },
        limit: {
          type: 'number',
          description: 'Optional: Maximum number of hotels to return (default: 3)'
        }
      },
      required: ['latitude', 'longitude']
    },
    _meta: {
      ui: {
        resourceUri: 'quest-app://distance-results'
      }
    }
  }
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'quest_get_all_hotels': {
        const schema = z.object({
          state: z.string().optional(),
          city: z.string().optional(),
          amenities: z.array(z.string()).optional()
        });
        
        const validated = schema.parse(args);
        let results = [...questHotels];
        
        // Filter by state
        if (validated.state) {
          results = results.filter(hotel => 
            hotel.state.toLowerCase() === validated.state!.toLowerCase()
          );
        }
        
        // Filter by city
        if (validated.city) {
          results = results.filter(hotel => 
            hotel.city.toLowerCase().includes(validated.city!.toLowerCase())
          );
        }
        
        // Filter by amenities
        if (validated.amenities && validated.amenities.length > 0) {
          results = results.filter(hotel => 
            validated.amenities!.every(amenity => 
              hotel.amenities.some(hotelAmenity => 
                hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
              )
            )
          );
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} Quest Apartment Hotels:\n\n` +
                results.map(hotel => 
                  `**${hotel.name}**\n` +
                  `📍 ${hotel.address}\n` +
                  `� ${hotel.phone}\n` +
                  `⭐ ${hotel.rating}/5\n` +
                  `🏨 ${hotel.amenities.length} amenities\n` +
                  `💰 From $${Math.min(...hotel.roomTypes.map(r => r.baseRate))}/night\n` +
                  `🆔 ${hotel.id}\n` +
                  `📍 Coordinates: ${hotel.latitude}, ${hotel.longitude}`
                ).join('\n\n')
            },
            {
              type: 'resource',
              resource: {
                uri: 'quest-app://all-hotels',
                mimeType: 'application/json',
                name: 'All Quest Hotels',
                text: JSON.stringify(results)
              }
            }
          ]
        };
      }

      case 'quest_get_property_details': {
        const schema = z.object({
          propertyId: z.string()
        });
        
        const validated = schema.parse(args);
        const hotel = questHotels.find(h => h.id === validated.propertyId);
        
        if (!hotel) {
          return {
            content: [
              {
                type: 'text',
                text: `Quest property not found: ${validated.propertyId}`
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**${hotel.name}**\n\n` +
                `📍 ${hotel.address}\n` +
                `📞 ${hotel.phone}\n` +
                `${hotel.email ? `✉️ ${hotel.email}\n` : ''}` +
                `⭐ ${hotel.rating}/5\n\n` +
                `**Description:** ${hotel.description}\n\n` +
                `**Amenities:** ${hotel.amenities.join(', ')}\n\n` +
                `**Room Types:**\n` +
                hotel.roomTypes.map(room => 
                  `• ${room.name} - ${room.maxGuests} guests, ${room.beds}, ${room.size}\n` +
                  `  $${room.baseRate}/night ${room.available ? '✅ Available' : '❌ Unavailable'}\n` +
                  `  ${room.amenities.join(', ')}`
                ).join('\n\n')
            },
            {
              type: 'resource',
              resource: {
                uri: 'quest-app://property-details',
                mimeType: 'application/json',
                name: 'Quest Property Details',
                text: JSON.stringify(hotel)
              }
            }
          ]
        };
      }

      case 'quest_calculate_distance': {
        const schema = z.object({
          latitude: z.number(),
          longitude: z.number(),
          maxDistance: z.number().optional(),
          limit: z.number().optional().default(3)
        });
        
        const validated = schema.parse(args);
        
        // Calculate distances from target coordinates
        const hotelsWithDistance = questHotels.map(hotel => ({
          ...hotel,
          distance: calculateDistance(
            validated.latitude, 
            validated.longitude, 
            hotel.latitude, 
            hotel.longitude
          )
        }));
        
        // Sort by distance
        hotelsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        // Filter by max distance if specified
        let results = hotelsWithDistance;
        if (validated.maxDistance) {
          results = results.filter(hotel => (hotel.distance || 0) <= validated.maxDistance!);
        }
        
        // Limit results
        results = results.slice(0, validated.limit);
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} Quest hotels within range:\n\n` +
                results.map(hotel => 
                  `**${hotel.name}**\n` +
                  `📍 ${hotel.address}\n` +
                  `📏 ${hotel.distance?.toFixed(1)} km away\n` +
                  `⭐ ${hotel.rating}/5\n` +
                  `🏨 Amenities: ${hotel.amenities.join(', ')}\n` +
                  `💰 From $${Math.min(...hotel.roomTypes.map(r => r.baseRate))}/night\n` +
                  `📞 ${hotel.phone}`
                ).join('\n\n')
            },
            {
              type: 'resource',
              resource: {
                uri: 'quest-app://distance-results',
                mimeType: 'application/json',
                name: 'Hotels by Distance',
                text: JSON.stringify(results)
              }
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
});

// Register app resource for the HTML UI
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'quest-app://all-hotels' || uri === 'quest-app://property-details' || uri === 'quest-app://distance-results') {
    // This would be handled by the tool responses above
    throw new Error('Resource data should come from tool responses');
  }
  
  if (uri === 'quest-app://ui') {
    try {
      const htmlPath = join(__dirname, 'dist', 'quest-app.html');
      const htmlContent = readFileSync(htmlPath, 'utf-8');
      
      return {
        contents: [{
          uri,
          mimeType: 'text/html',
          text: htmlContent
        }]
      };
    } catch (error) {
      throw new Error(`Failed to read app HTML: ${error}`);
    }
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Start Express server for HTTP transport
async function startHttpServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // MCP endpoint
  app.post('/mcp', async (req, res) => {
    try {
      // Handle MCP requests here
      res.json({ status: 'ok' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Quest MCP Server listening on port ${port}`);
  });
}

async function main() {
  // Check if we should run HTTP server or stdio
  if (process.argv.includes('--http')) {
    await startHttpServer();
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Quest Apartment Hotels MCP Server running on stdio');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
