export interface Product{
  id?: string,
  name: string,
  price: number,
  quantity: number,
  supplierId?: string
}
export interface ProductList{
  id?: string,
  name: string,
  price: number,
  quantity: number,
  productNumber: number,
  supplierName: string,
  supplierId?: string
}