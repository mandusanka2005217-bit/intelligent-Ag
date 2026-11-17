// Buyer feature TypeScript type definitions

export interface Buyer {
  id: number;
  name: string;
  location: string;
  requiredCropType: string;
  requiredQuantityKg: number;
  maxPricePerKg: number;
  createdAt: string; // ISO 8601 date string
}

export interface CreateBuyerDto {
  name: string;
  location: string;
  requiredCropType: string;
  requiredQuantityKg: number;
  maxPricePerKg: number;
}

export interface UpdateBuyerDto {
  name?: string;
  location?: string;
  requiredCropType?: string;
  requiredQuantityKg?: number;
  maxPricePerKg?: number;
}

export interface BuyerFilters {
  search?: string;
  requiredCropType?: string;
  maxPricePerKg?: number;
}

export interface PaginatedBuyers {
  data: Buyer[];
  total: number;
  page: number;
  pageSize: number;
}
