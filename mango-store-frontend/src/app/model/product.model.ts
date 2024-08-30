import { Promotion } from './promotion.model';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  vendor_id: number;
  stock: number;
  is_available: boolean;
  images: ProductImage[];
  promotion: Promotion | null;
  selected?: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_data: string;
}

export { Promotion };
