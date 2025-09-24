// category.interface.ts
export interface CategoryResponse {
    success: boolean;
    message: string;
    data:    Category[];
}

export interface Category {
    id:          number;
    name:        string;
    description: string;
    created_at:  Date | string;
    updated_at:  Date | string;
    deleted_at:  Date | null;
}
