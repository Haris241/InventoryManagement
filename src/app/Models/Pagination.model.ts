export interface AutoDropdown {
    id: string | number,
    name: string
}
export interface PaginationResult<T> {
    items: T[],
    pageNumber: number,
    pageSize: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
}
export interface CursorPaginationResult<T> {
    items: T[];
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageSize: number;
}
export interface CursorResponse<T> {
    data: T[];
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}