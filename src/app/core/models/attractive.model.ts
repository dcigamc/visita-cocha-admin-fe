import { Timestamp } from '@angular/fire/firestore';

export interface AttractiveModel {
  id?: string;
  name: string;
  slug: string;
  description: string;
  type?: string; // Mantener por compatibilidad si es necesario, aunque no está en el nuevo objeto
  mainCategories: string[]; // IDs de la colección 'main-categories'
  categories: string[]; // IDs de la colección 'attractions-categories'
  available: boolean;
  schedule: string;
  rating: number;
  accessibility: string;
  contact: {
    mail: string;
    link: string;
    phone: string;
  };
  coverUrl: string;
  gallery?: string[]; // No está en el ejemplo de GEMINI.md pero es útil
  order: number;
  historyId?: string;
  isFeatured: boolean;
  location: {
    address: string;
    coords: {
      lng: string | number;
      lat: string | number;
    };
  };
  foods: string[]; // IDs de la colección 'foods'
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  isActive?: boolean;
}
