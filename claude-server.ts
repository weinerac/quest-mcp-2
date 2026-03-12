import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { questHotels } from './src/data.js';
import { QuestHotel } from './src/types.js';

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

// Create proper MCP server for Claude Desktop
const server = new Server(
  {
    name: 'quest-apartment-hotels',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define tools with proper MCP structure
const tools: Tool[] = [
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
        limit: {
          type: 'number',
          description: 'Optional: Maximum number of hotels to return (default: 3)'
        }
      },
      required: ['latitude', 'longitude']
    }
  },
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
        }
      }
    }
  }
];

// Register tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'quest_calculate_distance': {
        const schema = z.object({
          latitude: z.number(),
          longitude: z.number(),
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
        
        // Limit results
        const results = hotelsWithDistance.slice(0, validated.limit);
        
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

      case 'quest_get_all_hotels': {
        const schema = z.object({
          state: z.string().optional(),
          city: z.string().optional()
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
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} Quest Apartment Hotels:\n\n` +
                results.map(hotel => 
                  `**${hotel.name}**\n` +
                  `📍 ${hotel.address}\n` +
                  `📞 ${hotel.phone}\n` +
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

// Start server with stdio transport for Claude Desktop
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quest Apartment Hotels MCP Server running on stdio');
}

main().catch(console.error);
