// Buyer feature types. The single source of truth is contracts/types.ts.
export type {
  Buyer,
  CreateBuyerDto,
  UpdateBuyerDto,
  BuyerFilters,
} from '@contracts/types';

export interface PaginatedBuyers {
  data: import('@contracts/types').Buyer[];
  total: number;
  page: number;
  pageSize: number;
}
