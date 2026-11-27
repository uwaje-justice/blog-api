export type PaginationInput = { page?: number; pageSize?: number };

const DEFAULT_PAGE_SIZE = 20;

export const getPageValues = ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginationInput = {}) => ({
  page,
  pageSize,
  skip: (page - 1) * pageSize,
});

export const makePagination = (page: number, pageSize: number, totalItems: number) => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.ceil(totalItems / pageSize),
});
