export interface CategoryModel {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  photoUrl?: string;
  available: boolean;
  order: number;
}
