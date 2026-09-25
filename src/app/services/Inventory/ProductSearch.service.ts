import { inject, Injectable } from "@angular/core";
import { DataLayerService } from "../data-layer.service";
import { ProductVariantSearchDto } from "../../Models/Inventory/ProductSearch.model";
import { AutoDropdown } from "../../Models/Pagination.model";
import { Observable } from "rxjs";
@Injectable({
    providedIn: 'root'
})
export class ProductSearchService {
    private dataService = inject(DataLayerService);

    getProductVariantByBarcode(barcode: string): Observable<ProductVariantSearchDto> {
        return this.dataService.getById<ProductVariantSearchDto>('Dropdowns/ProductWithBarcode', barcode);
    }

    getLocationsByWarehouse(warehouseId: number): Observable<AutoDropdown[]> {
        return this.dataService.getAllSimple<AutoDropdown>(`Dropdowns/LocationsByWarehouse/${warehouseId}`);
    }



}