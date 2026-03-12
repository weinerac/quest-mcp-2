export default async function handler(req, res) {
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
    const { method = 'tools/call', params } = req.body;
    
    if (method === 'tools/call' && params) {
      const { name, arguments: args } = params;
      
      if (name === 'quest_calculate_distance') {
        const { latitude, longitude, limit = 3 } = args;
        
        const hotels = [
          {
            id: 'quest-melbourne-bourke-st',
            name: 'Quest Melbourne on Bourke',
            address: '443 Bourke Street, Melbourne VIC 3000',
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
            latitude: -33.8776,
            longitude: 151.2044,
            phone: '+61 2 9261 8800',
            amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center', 'Pool'],
            rating: 4.5
          }
        ];

        // Calculate distances
        const hotelsWithDistance = hotels.map(hotel => {
          const distance = calculateDistance(latitude, longitude, hotel.latitude, hotel.longitude);
          return { ...hotel, distance };
        });

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
        });
        return;
      }
    }

    // List tools
    res.json({
      result: {
        tools: [
          {
            name: 'quest_calculate_distance',
            description: 'Calculate distance between coordinates and return hotels sorted by distance.',
            inputSchema: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                limit: { type: 'number' }
              },
              required: ['latitude', 'longitude']
            }
          }
        ]
      }
    });
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
