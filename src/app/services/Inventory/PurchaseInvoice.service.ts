import { inject, Injectable } from "@angular/core";
import { DataLayerService } from "../data-layer.service";

@Injectable({
    providedIn: 'root'
})
export class PurchaseInvoiceService {
    private dataService = inject(DataLayerService);
}