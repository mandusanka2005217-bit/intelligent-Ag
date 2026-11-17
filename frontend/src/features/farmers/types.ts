// Farmer feature TypeScript type definitions

export interface Farmer {
  id: number;
  name: string;
  location: string;
  cropType: string;
  quantityKg: number;
  pricePerKg: number;
  createdAt: string; // ISO 8601 date string
}

export interface CreateFarmerDto {
  name: string;
  location: string;
  cropType: string;
  quantityKg: number;
  pricePerKg: number;
}

export interface UpdateFarmerDto {
  name?: string;
  location?: string;
  cropType?: string;
  quantityKg?: number;
  pricePerKg?: number;
}

export interface FarmerFilters {
  search?: string;
  cropType?: string;
  minPricePerKg?: number;
  maxPricePerKg?: number;
}

export interface PaginatedFarmers {
  data: Farmer[];
  total: number;
  page: number;
  pageSize: number;
}
