# Quest Apartment Hotels MCP Server & App

A Model Context Protocol (MCP) server and interactive web app for Quest Apartment Hotels that enables AI assistants (ChatGPT, Claude, Gemini) to search properties near specific locations and landmarks across Australia.

## Features

- **AI-Powered Location Matching**: Intelligently interprets any location input (cities, suburbs, landmarks, hotel names)
- **Dynamic Distance Calculation**: Returns the closest 3 properties with exact distances from any point
- **Flexible Search**: Works with "Sydney", "North Sydney", "Quest Melbourne", or any location description
- **Interactive UI**: Beautiful, minimal web interface for browsing hotel results
- **Cross-platform**: Works with both ChatGPT and Claude
- **Rich Data**: Includes amenities, pricing, ratings, and room details

## Available Tools

### `quest_search_nearby`
Find Quest Apartment Hotels near a specific location or landmark. Returns the closest 3 properties.

**Parameters:**
- `location` (required): Any location description - city name, suburb, landmark, or hotel name (e.g., "Sydney", "North Sydney", "Quest Melbourne", "169 Thomas Street")
- `amenities` (optional): Array of required amenities (e.g., ["Gym", "Pool"])
- `maxGuests` (optional): Maximum number of guests needed

**Example:**
```json
{
  "location": "North Sydney",
  "amenities": ["Gym", "Pool"],
  "maxGuests": 2
}
```

### `quest_get_property_details`
Get detailed information about a specific Quest property.

**Parameters:**
- `propertyId` (required): The ID of the Quest property

**Example:**
```json
{
  "propertyId": "quest-sydney-cbd"
}
```

### `quest_list_all_properties`
List all Quest Apartment Hotels with basic information.

**Parameters:**
- `state` (optional): Filter by state (e.g., "NSW", "VIC", "QLD")

**Example:**
```json
{
  "state": "NSW"
}
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and install dependencies:**
```bash
cd quest-apartment-hotels-mcp
npm install
```

2. **Build the project:**
```bash
npm run build
npm run build-app  # Build the web app
```

3. **Run the MCP server:**
```bash
npm run serve
```

### Testing with MCP Inspector

1. Install MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
```

2. Run the inspector:
```bash
mcp-inspector tsx main.ts
```

3. Open your browser to `http://localhost:3000` to test the tools.

### Testing in ChatGPT

1. Open [chatgpt.com](https://chatgpt.com) and start a new conversation
2. Click the Tools (plug) icon → Add a tool → MCP Server
3. Enter your server URL (if running with HTTP transport)
4. Set approval to No approval required (for testing)
5. Click Connect

Try prompts like:
- "Find Quest hotels in Sydney with a gym"
- "What Quest properties are near North Sydney?"
- "Show me hotels near Quest Melbourne for 2 guests"
- "Find apartments with a pool in Brisbane CBD"
- "Hotels near 169 Thomas Street Sydney"

### Testing in Claude Desktop

1. Open Claude Desktop settings
2. Add MCP server configuration
3. Point to your server executable
4. Restart Claude

## Project Structure

```
quest-apartment-hotels-mcp/
├── src/
│   ├── types.ts           # TypeScript interfaces
│   ├── data.ts            # Hotel data and landmarks
│   ├── mcp-server.ts      # Core MCP server logic
│   ├── quest-app.html     # Web app HTML
│   └── quest-app.ts       # Web app TypeScript
├── dist/
│   └── quest-app.html     # Built web app
├── main.ts                # Main server entry point
├── package.json
├── tsconfig.json
├── vite.config.ts         # Vite build config
└── README.md
```

## Data Structure

The server includes 9 real Quest Apartment Hotels across major Australian cities:

- **Sydney**: Quest Sydney CBD
- **Melbourne**: Quest Melbourne on Bourke  
- **Brisbane**: Quest Brisbane CBD
- **Perth**: Quest Perth CBD
- **Adelaide**: Quest Adelaide CBD
- **Canberra**: Quest Canberra Civic
- **Hobart**: Quest Hobart CBD
- **Darwin**: Quest Darwin CBD

Each property includes:
- Full address and coordinates
- Amenities (Gym, Pool, WiFi, Kitchen, etc.)
- Room types with pricing
- Ratings and descriptions
- Contact information

## Intelligent Location Matching

The system uses AI-driven location matching that can handle:

### **City & Suburb Names**
- "Sydney", "Melbourne", "Brisbane"
- "North Sydney", "South Yarra", "Fortitude Valley"
- "CBD", " Civic", "Kingston"

### **Hotel Names & Addresses**
- "Quest Sydney", "Quest Melbourne on Bourke"
- "169 Thomas Street", "443 Bourke Street"
- Partial matches work too: "Quest Syd", "Melbourne Bourke"

### **Flexible Input**
The AI intelligently parses and matches:
- **Exact matches**: "sydney cbd" → Sydney CBD coordinates
- **Partial matches**: "north sydney" → North Sydney coordinates  
- **Hotel names**: "Quest Melbourne" → Melbourne hotel
- **Addresses**: "169 Thomas" → Sydney hotel
- **City names**: "Brisbane" → Brisbane center

### **Distance Calculation**
Once a location is identified, the system:
1. Calculates distances from that point to all Quest hotels
2. Returns the closest 3 properties
3. Shows exact distances in kilometers
4. Provides full hotel details and pricing

## Web App Features

The included web app provides:
- **Modern UI**: Clean, minimal design with smooth animations
- **Search Interface**: Easy-to-use form with location, amenities, and guest filters
- **Hotel Cards**: Beautiful cards showing images, ratings, amenities, and pricing
- **Distance Display**: Shows exact distance from search location
- **Detailed Views**: Click any hotel to see full details including room types
- **Responsive Design**: Works on desktop and mobile devices

## API Response Format

The tools return both human-readable text and structured JSON data:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Human-readable summary..."
    },
    {
      "type": "resource", 
      "resource": {
        "uri": "quest-app://search-results",
        "mimeType": "application/json",
        "text": "JSON data..."
      }
    }
  ]
}
```

## Development

### Adding New Hotels
Edit `src/data.ts` to add new Quest properties:

```typescript
{
  id: 'quest-new-hotel',
  name: 'Quest New Hotel',
  address: '123 Street, City State 2000',
  // ... other properties
}
```

### Adding New Landmarks
Add to the `landmarks` object in `src/data.ts`:

```typescript
'New Landmark': { latitude: -xx.xxxx, longitude: xxx.xxxx }
```

### Customizing the UI
Edit `src/quest-app.html` for styling and `src/quest-app.ts` for functionality.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build && npm run build-app`
4. Set output directory: `dist`
5. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the MCP specification documentation
