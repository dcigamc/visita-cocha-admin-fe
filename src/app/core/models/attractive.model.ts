import { Timestamp } from '@angular/fire/firestore';

export interface AttractiveModel {
  id?: string;
  name: string;
  description: string;
  category: string; // Ej: Museo, Parque, Monumento
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  images: string[];
  foods: string[]; // IDs de comidas relacionadas
  openingHours?: string;
  contact?: {
    phone?: string;
    website?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}
