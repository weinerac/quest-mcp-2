// Simple API handler for Vercel
export default async function handler(req, res) {
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
      error: error.message || 'Unknown error',
      details: error
    });
  }
}

// Quest hotel data
const questHotels = [
  {
    id: 'quest-melbourne-bourke-st',
    name: 'Quest Melbourne on Bourke',
    address: '443 Bourke Street, Melbourne VIC 3000',
    city: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    latitude: -37.8136,
    longitude: 144.9631,
    phone: '+61 3 9662 1800',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '38 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 175,
        available: true
      }
    ],
    description: 'Contemporary apartments located on Bourke Street in Melbourne\'s vibrant CBD.',
    rating: 4.4
  },
  {
    id: 'quest-sydney-cbd',
    name: 'Quest Sydney CBD',
    address: '169-171 Thomas Street, Sydney NSW 2000',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    latitude: -33.8776,
    longitude: 151.2044,
    phone: '+61 2 9261 8800',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center', 'Pool'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '35 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 189,
        available: true
      }
    ],
    description: 'Modern apartments in the heart of Sydney CBD, perfect for business and leisure travelers.',
    rating: 4.5
  },
  {
    id: 'quest-brisbane-cbd',
    name: 'Quest Brisbane CBD',
    address: '233 George Street, Brisbane QLD 4000',
    city: 'Brisbane',
    state: 'QLD',
    postcode: '4000',
    latitude: -27.4705,
    longitude: 153.0260,
    phone: '+61 7 3210 0800',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Pool', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '36 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 165,
        available: true
      }
    ],
    description: 'Modern serviced apartments in Brisbane\'s central business district.',
    rating: 4.6
  }
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
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
async function handleToolCall(name, args) {
  try {
    if (name === 'quest_calculate_distance') {
      const { latitude, longitude, limit = 3 } = args;
      
      // Calculate distances from target coordinates
      const hotelsWithDistance = questHotels.map(hotel => ({
        ...hotel,
        distance: calculateDistance(latitude, longitude, hotel.latitude, hotel.longitude)
      }));
      
      // Sort by distance
      hotelsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Limit results
      const results = hotelsWithDistance.slice(0, limit);
      
      return {
        result: {
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
        }
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      result: {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message || 'Unknown error'}`
          }
        ]
      }
    };
  }
}
