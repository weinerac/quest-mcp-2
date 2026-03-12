import { QuestHotel } from './types';

// Quest Apartment Hotels data - the MCP server provides this raw data
export const questHotels: QuestHotel[] = [
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
    email: 'sydneycbd@questapartments.com.au',
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
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '55 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 259,
        available: true
      }
    ],
    description: 'Modern apartments in the heart of Sydney CBD, perfect for business and leisure travelers.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    rating: 4.5
  },
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
    email: 'melbournebourne@questapartments.com.au',
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
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '60 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 245,
        available: true
      }
    ],
    description: 'Contemporary apartments located on Bourke Street in Melbourne\'s vibrant CBD.',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    rating: 4.4
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
    email: 'brisbanecbd@questapartments.com.au',
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
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '58 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 235,
        available: true
      }
    ],
    description: 'Modern serviced apartments in Brisbane\'s central business district.',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    rating: 4.6
  },
  {
    id: 'quest-perth-cbd',
    name: 'Quest Perth CBD',
    address: '371 Murray Street, Perth WA 6000',
    city: 'Perth',
    state: 'WA',
    postcode: '6000',
    latitude: -31.9505,
    longitude: 115.8605,
    phone: '+61 8 9321 1800',
    email: 'perthcbd@questapartments.com.au',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '37 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 155,
        available: true
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '59 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 225,
        available: true
      }
    ],
    description: 'Stylish apartments in the heart of Perth\'s business district.',
    imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800',
    rating: 4.3
  },
  {
    id: 'quest-adelaide-cbd',
    name: 'Quest Adelaide CBD',
    address: '88 Franklin Street, Adelaide SA 5000',
    city: 'Adelaide',
    state: 'SA',
    postcode: '5000',
    latitude: -34.9285,
    longitude: 138.6007,
    phone: '+61 8 8211 8800',
    email: 'adelaidecbd@questapartments.com.au',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '35 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 145,
        available: true
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '57 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 215,
        available: true
      }
    ],
    description: 'Comfortable apartments in Adelaide\'s central business district.',
    imageUrl: 'https://images.unsplash.com/photo-1551880047-c8284d30f977?w=800',
    rating: 4.4
  },
  {
    id: 'quest-canberra-civic',
    name: 'Quest Canberra Civic',
    address: '1 Constitution Avenue, Canberra ACT 2601',
    city: 'Canberra',
    state: 'ACT',
    postcode: '2601',
    latitude: -35.2809,
    longitude: 149.1300,
    phone: '+61 2 6100 0800',
    email: 'canberracivic@questapartments.com.au',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Laundry', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '36 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 155,
        available: true
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '58 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 225,
        available: true
      }
    ],
    description: 'Modern apartments in Canberra\'s civic center, close to government offices.',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
    rating: 4.5
  },
  {
    id: 'quest-hobart-cbd',
    name: 'Quest Hobart CBD',
    address: '61 Collins Street, Hobart TAS 7000',
    city: 'Hobart',
    state: 'TAS',
    postcode: '7000',
    latitude: -42.8821,
    longitude: 147.3248,
    phone: '+61 3 6210 1800',
    email: 'hobartcbd@questapartments.com.au',
    amenities: ['WiFi', 'Kitchen', 'Business Center'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '34 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 135,
        available: true
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '56 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 195,
        available: true
      }
    ],
    description: 'Charming apartments in Hobart\'s historic CBD area.',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    rating: 4.3
  },
  {
    id: 'quest-darwin-cbd',
    name: 'Quest Darwin CBD',
    address: '69 Smith Street, Darwin NT 0800',
    city: 'Darwin',
    state: 'NT',
    postcode: '0800',
    latitude: -12.4634,
    longitude: 130.8454,
    phone: '+61 8 8942 1800',
    email: 'darwincbd@questapartments.com.au',
    amenities: ['Gym', 'WiFi', 'Kitchen', 'Pool'],
    roomTypes: [
      {
        id: 'studio',
        name: 'Studio Apartment',
        maxGuests: 2,
        beds: '1 Queen Bed',
        size: '35 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Workspace'],
        baseRate: 145,
        available: true
      },
      {
        id: 'one-bedroom',
        name: 'One Bedroom Apartment',
        maxGuests: 3,
        beds: '1 Queen Bed + Sofa Bed',
        size: '57 sqm',
        amenities: ['Kitchen', 'WiFi', 'Air Conditioning', 'Living Room', 'Workspace'],
        baseRate: 205,
        available: true
      }
    ],
    description: 'Tropical apartments in Darwin\'s city center.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    rating: 4.2
  }
];
