export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    stock: number;
    categoryId: string;
    images: string[];
    isActive: boolean;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
}
//# sourceMappingURL=product.types.d.ts.map