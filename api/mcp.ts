import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { questHotels } from '../src/data.js';
import { QuestHotel } from '../src/types.js';

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

// Create server instance
const server = new Server(
  {
    name: 'quest-apartment-hotels-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
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
  }
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
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

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.json({
      status: 'ok',
      service: 'Quest Apartment Hotels MCP Server',
      version: '1.0.0'
    });
    return;
  }

  if (req.method === 'POST') {
    try {
      const { method = 'tools/list', params } = req.body;
      
      if (method === 'tools/list') {
        const result = await server.request({ method: 'tools/list' }, {} as any);
        return res.json(result);
      }
      
      if (method === 'tools/call' && params) {
        const result = await server.request({ method: 'tools/call', params }, {} as any);
        return res.json(result);
      }
      
      res.json({ result: { tools } });
    } catch (error) {
      console.error('MCP Error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

// Local development
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quest Apartment Hotels MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
