import type { PaginationQueryDto } from './dto/pagination-query.dto.js';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginationOptions(
  pagination: PaginationQueryDto,
): { skip: number; take: number } {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}

export function paginated<T>(
  [items, total]: [T[], number],
  pagination: PaginationQueryDto,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}
