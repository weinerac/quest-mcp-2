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

// Direct tool call handler
async function handleToolCall(name: string, args: any) {
  try {
    switch (name) {
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
          result: {
            content: [
              {
                type: 'text',
                text: `Found ${results.length} Quest hotels within range:\n\n` +
                  results.map(hotel => 
                    `**${hotel.name}**\n` +
                    `📍 ${hotel.address}\n` +
                    `� ${hotel.distance?.toFixed(1)} km away\n` +
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
          }
        };
      }

      case 'quest_get_all_hotels': {
        let results = [...questHotels];
        
        return {
          result: {
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
                    `� Coordinates: ${hotel.latitude}, ${hotel.longitude}`
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
          }
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      result: {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      }
    };
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Health check endpoint
      res.json({
        status: 'ok',
        service: 'Quest Apartment Hotels MCP Server',
        version: '1.0.0',
        endpoints: {
          mcp: '/api/mcp'
        }
      });
      return;
    }

    if (req.method === 'POST') {
      const { method = 'tools/call', params } = req.body;
      
      // Direct tool call handling
      if (method === 'tools/call' && params) {
        const { name, arguments: args } = params;
        
        // Handle tool calls directly
        const result = await handleToolCall(name, args);
        res.json(result);
      } else {
        // List tools
        res.json({
          result: {
            tools: [
              {
                name: 'quest_get_all_hotels',
                description: 'Get all Quest Apartment Hotels with their coordinates and details. The AI can then filter and select the best properties based on user location preferences.',
                inputSchema: {
                  type: 'object',
                  properties: {}
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
                    limit: {
                      type: 'number',
                      description: 'Optional: Maximum number of hotels to return (default: 3)'
                    }
                  },
                  required: ['latitude', 'longitude']
                }
              }
            ]
          }
        });
      }
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}
