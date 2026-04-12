import { Timestamp } from '@angular/fire/firestore';

export interface DeliveryUrl {
  type: 'yango' | 'pedidosya' | 'dinki' | 'other';
  name: string;
  url: string;
}

export interface RestaurantModel {
  id?: string;
  name: string;
  slug: string;
  description: string;
  mainCategories: string[]; // IDs from 'main-categories'
  categories: string[]; // IDs from 'restaurant-categories'
  available: boolean;
  schedule: string;
  rating: number;
  contact: {
    mail: string;
    link: string;
    phone: string;
  };
  location: {
    address: string;
    coords: {
      lng: number;
      lat: number;
    };
  };
  foods: string[]; // IDs from 'foods'
  isFeatured: boolean;
  order: number;
  historyId?: string;
  accessibility?: string;
  deliveryUrls: DeliveryUrl[];
  coverUrl?: string;
  gallery?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  isActive?: boolean;
}
