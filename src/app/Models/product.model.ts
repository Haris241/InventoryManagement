export interface ProductCreate {
  id?: string,
  name: string,
  price: number,
  quantity: number,
  supplierId?: string,
  productImage?: File,
  imageUrl?: string
}
export interface ProductList {
  id?: string,
  name: string,
  price: number,
  quantity: number,
  productNumber: number,
  productImageUrl: string,
  supplierName: string,
  supplierId?: string
}
export interface ProductSearch {
  productId?: string,
  supplierId?: string
}