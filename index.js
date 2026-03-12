// Simple MCP server for ChatGPT compatibility
export default async function handler(req, res) {
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
      
      // Handle tools/list - ChatGPT calls this first
      if (method === 'tools/list') {
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
            ]
          }
        });
        return;
      }
      
      // Handle tools/call - ChatGPT calls this to execute tools
      if (method === 'tools/call' && params) {
        const { name, arguments: args } = params;
        
        if (name === 'quest_calculate_distance') {
          const { latitude, longitude, limit = 3 } = args;
          
          // Complete Quest hotel data
          const hotels = [
            {
              id: 'quest-melbourne-bourke-st',
              name: 'Quest Melbourne on Bourke',
              address: '443 Bourke Street, Melbourne VIC 3000',
              city: 'Melbourne',
              state: 'VIC',
              latitude: -37.8136,
              longitude: 144.9631,
              phone: '+61 3 9662 1800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center'],
              rating: 4.4,
              roomTypes: [
                {
                  id: 'studio',
                  name: 'Studio Apartment',
                  maxGuests: 2,
                  beds: '1 Queen Bed',
                  size: '38 sqm',
                  baseRate: 175,
                  available: true
                }
              ]
            },
            {
              id: 'quest-sydney-cbd',
              name: 'Quest Sydney CBD',
              address: '169-171 Thomas Street, Sydney NSW 2000',
              city: 'Sydney',
              state: 'NSW',
              latitude: -33.8776,
              longitude: 151.2044,
              phone: '+61 2 9261 8800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center', 'Pool'],
              rating: 4.5,
              roomTypes: [
                {
                  id: 'studio',
                  name: 'Studio Apartment',
                  maxGuests: 2,
                  beds: '1 Queen Bed',
                  size: '35 sqm',
                  baseRate: 189,
                  available: true
                }
              ]
            },
            {
              id: 'quest-brisbane-cbd',
              name: 'Quest Brisbane CBD',
              address: '233 George Street, Brisbane QLD 4000',
              city: 'Brisbane',
              state: 'QLD',
              latitude: -27.4705,
              longitude: 153.0260,
              phone: '+61 7 3210 0800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Pool', 'Business Center'],
              rating: 4.6,
              roomTypes: [
                {
                  id: 'studio',
                  name: 'Studio Apartment',
                  maxGuests: 2,
                  beds: '1 Queen Bed',
                  size: '36 sqm',
                  baseRate: 165,
                  available: true
                }
              ]
            },
            {
              id: 'quest-perth-cbd',
              name: 'Quest Perth',
              address: '200 Adelaide Terrace, Perth WA 6000',
              city: 'Perth',
              state: 'WA',
              latitude: -31.9545,
              longitude: 115.8618,
              phone: '+61 8 9321 8800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Business Center'],
              rating: 4.3,
              roomTypes: [
                {
                  id: 'studio',
                  name: 'Studio Apartment',
                  maxGuests: 2,
                  beds: '1 Queen Bed',
                  size: '34 sqm',
                  baseRate: 159,
                  available: true
                }
              ]
            },
            {
              id: 'quest-adelaide-cbd',
              name: 'Quest Adelaide',
              address: '233 King William Street, Adelaide SA 5000',
              city: 'Adelaide',
              state: 'SA',
              latitude: -34.9285,
              longitude: 138.6007,
              phone: '+61 8 8210 0800',
              amenities: ['WiFi', 'Kitchen', 'Business Center'],
              rating: 4.2,
              roomTypes: [
                {
                  id: 'studio',
                  name: 'Studio Apartment',
                  maxGuests: 2,
                  beds: '1 Queen Bed',
                  size: '33 sqm',
                  baseRate: 149,
                  available: true
                }
              ]
            }
          ];

          // Calculate distances
          const hotelsWithDistance = hotels.map(hotel => ({
            ...hotel,
            distance: calculateDistance(latitude, longitude, hotel.latitude, hotel.longitude)
          }));

          // Sort by distance
          hotelsWithDistance.sort((a, b) => a.distance - b.distance);

          // Limit results
          const results = hotelsWithDistance.slice(0, limit);

          res.json({
            result: {
              content: [
                {
                  type: 'text',
                  text: `Found ${results.length} Quest hotels within range:\n\n` +
                    results.map(hotel => 
                      `**${hotel.name}**\n` +
                      `📍 ${hotel.address}\n` +
                      `📏 ${hotel.distance.toFixed(1)} km away\n` +
                      `⭐ ${hotel.rating}/5\n` +
                      `🏨 Amenities: ${hotel.amenities.join(', ')}\n` +
                      `� From $${Math.min(...hotel.roomTypes.map(r => r.baseRate))}/night\n` +
                      `�📞 ${hotel.phone}`
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
          });
          return;
        }
        
        if (name === 'quest_get_all_hotels') {
          const { state, city } = args;
          
          // Complete Quest hotel data
          const hotels = [
            {
              id: 'quest-melbourne-bourke-st',
              name: 'Quest Melbourne on Bourke',
              address: '443 Bourke Street, Melbourne VIC 3000',
              city: 'Melbourne',
              state: 'VIC',
              latitude: -37.8136,
              longitude: 144.9631,
              phone: '+61 3 9662 1800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center'],
              rating: 4.4
            },
            {
              id: 'quest-sydney-cbd',
              name: 'Quest Sydney CBD',
              address: '169-171 Thomas Street, Sydney NSW 2000',
              city: 'Sydney',
              state: 'NSW',
              latitude: -33.8776,
              longitude: 151.2044,
              phone: '+61 2 9261 8800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center', 'Pool'],
              rating: 4.5
            },
            {
              id: 'quest-brisbane-cbd',
              name: 'Quest Brisbane CBD',
              address: '233 George Street, Brisbane QLD 4000',
              city: 'Brisbane',
              state: 'QLD',
              latitude: -27.4705,
              longitude: 153.0260,
              phone: '+61 7 3210 0800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Pool', 'Business Center'],
              rating: 4.6
            },
            {
              id: 'quest-perth-cbd',
              name: 'Quest Perth',
              address: '200 Adelaide Terrace, Perth WA 6000',
              city: 'Perth',
              state: 'WA',
              latitude: -31.9545,
              longitude: 115.8618,
              phone: '+61 8 9321 8800',
              amenities: ['Gym', 'WiFi', 'Kitchen', 'Business Center'],
              rating: 4.3
            },
            {
              id: 'quest-adelaide-cbd',
              name: 'Quest Adelaide',
              address: '233 King William Street, Adelaide SA 5000',
              city: 'Adelaide',
              state: 'SA',
              latitude: -34.9285,
              longitude: 138.6007,
              phone: '+61 8 8210 0800',
              amenities: ['WiFi', 'Kitchen', 'Business Center'],
              rating: 4.2
            }
          ];

          let results = [...hotels];
          
          // Filter by state
          if (state) {
            results = results.filter(hotel => 
              hotel.state.toLowerCase() === state.toLowerCase()
            );
          }
          
          // Filter by city
          if (city) {
            results = results.filter(hotel => 
              hotel.city.toLowerCase().includes(city.toLowerCase())
            );
          }

          res.json({
            result: {
              content: [
                {
                  type: 'text',
                  text: `Found ${results.length} Quest Apartment Hotels:\n\n` +
                    results.map(hotel => 
                      `**${hotel.name}**\n` +
                      `📍 ${hotel.address}\n` +
                      `📞 ${hotel.phone}\n` +
                      `⭐ ${hotel.rating}/5\n` +
                      `🏨 Amenities: ${hotel.amenities.join(', ')}\n` +
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
            }
          });
          return;
        }
      }
      
      // Default response
      res.json({ result: { tools: [] } });
    } catch (error) {
      console.error('MCP Error:', error);
      res.status(500).json({ 
        error: error.message || 'Unknown error'
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
