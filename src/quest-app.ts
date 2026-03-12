import { App } from '@modelcontextprotocol/ext-apps';

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

class QuestHotelApp {
  private app: App;
  private currentResults: QuestHotel[] = [];

  constructor() {
    this.app = new App({ 
      name: 'Quest Apartment Hotels', 
      version: '1.0.0' 
    });

    this.setupEventHandlers();
    this.initializeUI();
  }

  private setupEventHandlers() {
    // Handle tool input from MCP
    this.app.ontoolinput = async (params: any) => {
      console.log('Tool input received:', params);
      
      if (params.name === 'quest_search_nearby') {
        const results = (params.arguments?.results as QuestHotel[]) || [];
        this.displaySearchResults(results);
      } else if (params.name === 'quest_get_property_details') {
        const hotel = params.arguments?.hotel as QuestHotel;
        if (hotel) {
          this.displayHotelDetails(hotel);
        }
      }
    };

    // Handle tool results
    this.app.ontoolresult = async (result: any) => {
      console.log('Tool result received:', result);
      
      if (result.content) {
        const resourceContent = result.content.find((c: any) => c.type === 'resource');
        if (resourceContent && resourceContent.resource) {
          try {
            // Handle both text and blob data
            let data: string;
            if ('text' in resourceContent.resource) {
              data = resourceContent.resource.text;
            } else if ('blob' in resourceContent.resource) {
              data = resourceContent.resource.blob;
            } else {
              throw new Error('Unknown resource data type');
            }
            
            const parsedData = JSON.parse(data) as QuestHotel[];
            this.displaySearchResults(parsedData);
          } catch (error) {
            console.error('Error parsing resource data:', error);
          }
        }
      }
    };

    // Handle host context changes
    this.app.onhostcontextchanged = async (ctx: any) => {
      console.log('Host context changed:', ctx);
      // Apply theme changes if needed
      this.applyTheme(ctx);
    };

    // Handle cleanup
    this.app.onteardown = async () => {
      console.log('App teardown');
      return {};
    };
  }

  private initializeUI() {
    // Set up form submission
    const form = document.getElementById('searchForm') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Set up hotel card clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const hotelCard = target.closest('.hotel-card');
      if (hotelCard) {
        const hotelId = hotelCard.getAttribute('data-hotel-id');
        if (hotelId) {
          this.handleHotelClick(hotelId);
        }
      }
    });
  }

  private async handleSearch() {
    const locationInput = document.getElementById('location') as HTMLInputElement;
    const amenitiesSelect = document.getElementById('amenities') as HTMLSelectElement;
    const guestsSelect = document.getElementById('guests') as HTMLSelectElement;
    const resultsDiv = document.getElementById('results');

    if (!locationInput?.value.trim()) {
      this.showError('Please enter a location or landmark');
      return;
    }

    // Show loading state
    if (resultsDiv) {
      resultsDiv.innerHTML = '<div class="loading">Searching for Quest Apartment Hotels...</div>';
    }

    try {
      // Collect selected amenities
      const selectedAmenities = Array.from(amenitiesSelect?.selectedOptions || [])
        .filter(option => option.selected)
        .map(option => option.value);

      // Collect guest count
      const guests = guestsSelect?.value ? parseInt(guestsSelect.value) : undefined;

      // Send search request to MCP tool
      await this.app.sendMessage({
        role: 'user',
        content: [{
          type: 'text',
          text: `Find Quest hotels near ${locationInput.value.trim()}${selectedAmenities.length > 0 ? ` with amenities: ${selectedAmenities.join(', ')}` : ''}${guests ? ` for ${guests} guests` : ''}`
        }]
      });

      // Send log to host
      await this.app.sendLog({
        level: 'info',
        data: `Searching for hotels near: ${locationInput.value}`
      });

    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to search for hotels. Please try again.');
    }
  }

  private async handleHotelClick(hotelId: string) {
    try {
      // Send request for hotel details
      await this.app.sendMessage({
        role: 'user',
        content: [{
          type: 'text',
          text: `Get details for Quest hotel with ID: ${hotelId}`
        }]
      });

      // Send log to host
      await this.app.sendLog({
        level: 'info',
        data: `Viewing details for hotel: ${hotelId}`
      });

    } catch (error) {
      console.error('Error getting hotel details:', error);
      this.showError('Failed to load hotel details. Please try again.');
    }
  }

  private displaySearchResults(hotels: QuestHotel[]) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    this.currentResults = hotels;

    if (hotels.length === 0) {
      resultsDiv.innerHTML = `
        <div class="no-results">
          <h3>No Quest Hotels Found</h3>
          <p>Try adjusting your search criteria or location.</p>
        </div>
      `;
      return;
    }

    const hotelsGrid = hotels.map(hotel => `
      <div class="hotel-card" data-hotel-id="${hotel.id}">
        <div class="hotel-image">
          ${hotel.imageUrl ? 
            `<img src="${hotel.imageUrl}" alt="${hotel.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
            `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0); background-size: 20px 20px; background-position: 0 0, 10px 10px; color: #999;">Quest Hotel</div>`
          }
        </div>
        <div class="hotel-content">
          <h3 class="hotel-name">${hotel.name}</h3>
          <p class="hotel-address">📍 ${hotel.address}</p>
          
          <div class="hotel-rating">
            <span class="stars">${'⭐'.repeat(Math.floor(hotel.rating))}</span>
            <span>${hotel.rating}/5</span>
            ${hotel.distance ? `<span class="distance">${hotel.distance.toFixed(1)} km away</span>` : ''}
          </div>
          
          <div class="hotel-amenities">
            ${hotel.amenities.slice(0, 4).map(amenity => 
              `<span class="amenity-tag">${amenity}</span>`
            ).join('')}
            ${hotel.amenities.length > 4 ? `<span class="amenity-tag">+${hotel.amenities.length - 4} more</span>` : ''}
          </div>
          
          <div class="hotel-price">
            From $${Math.min(...hotel.roomTypes.map(r => r.baseRate))}/night
          </div>
        </div>
      </div>
    `).join('');

    resultsDiv.innerHTML = `<div class="hotels-grid">${hotelsGrid}</div>`;

    // Send log to host
    this.app.sendLog({
      level: 'info',
      data: `Displayed ${hotels.length} search results`
    });
  }

  private displayHotelDetails(hotel: QuestHotel) {
    // Create a modal or expanded view for hotel details
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 16px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
        <h2 style="margin-bottom: 20px; color: #2c3e50;">${hotel.name}</h2>
        
        <p style="margin-bottom: 15px; color: #6c757d;">📍 ${hotel.address}</p>
        <p style="margin-bottom: 15px; color: #6c757d;">📞 ${hotel.phone}</p>
        ${hotel.email ? `<p style="margin-bottom: 15px; color: #6c757d;">✉️ ${hotel.email}</p>` : ''}
        
        <div style="margin-bottom: 20px;">
          <strong>Rating:</strong> ⭐ ${hotel.rating}/5
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Description:</strong>
          <p style="margin-top: 8px; line-height: 1.6;">${hotel.description}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Amenities:</strong>
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
            ${hotel.amenities.map(amenity => 
              `<span style="background: #f8f9fa; color: #6c757d; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">${amenity}</span>`
            ).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Room Types:</strong>
          ${hotel.roomTypes.map(room => `
            <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${room.name}</div>
              <div style="font-size: 0.9rem; color: #6c757d; margin-bottom: 4px;">
                ${room.maxGuests} guests • ${room.beds} • ${room.size}
              </div>
              <div style="font-size: 0.9rem; color: #6c757d; margin-bottom: 8px;">
                ${room.amenities.join(', ')}
              </div>
              <div style="font-weight: 600; color: #28a745;">
                $${room.baseRate}/night ${room.available ? '✅ Available' : '❌ Unavailable'}
              </div>
            </div>
          `).join('')}
        </div>
        
        <button onclick="this.closest('[style*=fixed]').remove()" 
                style="background: #0056b3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Send log to host
    this.app.sendLog({
      level: 'info',
      data: `Displayed details for hotel: ${hotel.name}`
    });
  }

  private showError(message: string) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }

  private applyTheme(ctx: any) {
    // Apply theme based on host context
    if (ctx.theme?.theme) {
      // Could apply dark/light theme here
      console.log('Applying theme:', ctx.theme.theme);
    }
  }

  async connect() {
    await this.app.connect();
    console.log('Quest Hotel App connected');
  }
}

// Initialize and connect the app
const questApp = new QuestHotelApp();
questApp.connect().catch(console.error);
