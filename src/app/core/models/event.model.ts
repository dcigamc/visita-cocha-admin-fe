import { Timestamp } from '@angular/fire/firestore';

export interface EventModel {
  id?: string;
  title: string;
  description: string;
  available: boolean;
  isFeatured: boolean;
  order: number;
  coverUrl?: string;
  gallery?: string[];
  color: 'green' | 'yellow' | 'blue' | 'red' | 'black-lighten';
  date: Timestamp;
  foods: string[]; // IDs from 'foods' collection
  restaurants: string[]; // IDs from 'restaurants' collection
  attractions: string[]; // IDs from 'attractions' collection
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  isActive?: boolean;
}
