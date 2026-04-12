import { Timestamp } from '@angular/fire/firestore';

export interface FoodModel {
  id?: string;
  name: string;
  slug: string;
  description: string;
  available: boolean;
  isFeatured: boolean;
  order: number;
  rating: number;
  coverUrl: string;
  gallery?: string[];
  ingredients: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  isActive?: boolean;
}
