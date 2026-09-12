export interface DepartmentDto {
    id?: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
}

export interface DepartmentSearch {
    id: string | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface DepartmentListDto {
    id: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
}