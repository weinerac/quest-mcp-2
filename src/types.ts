export interface QuestHotel {
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
  distance?: number; // Calculated dynamically
}

export interface RoomType {
  id: string;
  name: string;
  maxGuests: number;
  beds: string;
  size: string;
  amenities: string[];
  baseRate: number;
  available: boolean;
}

export interface LocationQuery {
  location?: string;
  city?: string;
  state?: string;
  landmark?: string;
  amenities?: string[];
  maxGuests?: number;
}

export interface SearchParams {
  query: LocationQuery;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}
