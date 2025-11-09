export interface AutoDropdown{
    id: string | number,
    name: string
}
export interface PaginationResult<T>{
    items: T[],
    pageNumber: number,
    pageSize: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
}