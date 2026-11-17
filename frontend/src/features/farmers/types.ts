// Farmer feature types. The single source of truth is contracts/types.ts.
export type {
  Farmer,
  CreateFarmerDto,
  UpdateFarmerDto,
  FarmerFilters,
} from '@contracts/types';

export interface PaginatedFarmers {
  data: import('@contracts/types').Farmer[];
  total: number;
  page: number;
  pageSize: number;
}
