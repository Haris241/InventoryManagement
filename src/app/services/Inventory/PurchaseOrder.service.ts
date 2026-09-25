import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { ProductVariantSearchDto } from "../../Models/Inventory/ProductSearch.model";
import { POFormLookupsDto, PurchaseOrderDto, PurchaseOrderLineAllocationDto, PurchaseOrderLineDto, PurchaseOrderSourceModule } from "../../Models/Inventory/PurchaseOrder.model";

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    private dataService = inject(DataLayerService);

    createDefaultPO(): PurchaseOrderDto {
        return {
            name: '', description: '', sourceModule: PurchaseOrderSourceModule.General,
            purchaseDate: '', purchaseDateUI: new Date(), expectedDeliveryDate: '', expectedDeliveryDateUI: null,
            paymentTerms: '', deliveryTerms: '', supplierId: null, lines: [this.createPOline()]
        };
    }
    createPOline(): PurchaseOrderLineDto {
        return {
            quantity: 0, wareHouseId: null, productVariantId: null, barcode: '', uom: '',
            warehouseLocationId: null, warehouseLocationName: '', taxId: null, rate: 0, discountAmount: 0, productName: '',
            warehouseName: '', allocations: []
        };
    }
    createAllocations(): PurchaseOrderLineAllocationDto {
        return { purchaseRequisitionLineId: null, quantity: 0 };
    }
    getFormLookups(): Observable<POFormLookupsDto> {
        return this.dataService.getAll<POFormLookupsDto>('Dropdowns/POFormLookups');
    }
    getPOById(id: string): Observable<PurchaseOrderDto> {
        return this.dataService.getById<PurchaseOrderDto>('PurchaseOrder', id);
    }
    getPRLines(id: string): Observable<PurchaseOrderLineDto[]> {
        return this.dataService.getById<PurchaseOrderLineDto[]>('PurchaseOrder/getPurchaseRequisition', id);
    }
    updateField<K extends keyof PurchaseOrderDto>(pr: PurchaseOrderDto, field: K, value: PurchaseOrderDto[K]): PurchaseOrderDto {
        return { ...pr, [field]: value };
    }

    updateLineField<K extends keyof PurchaseOrderLineDto>(
        pr: PurchaseOrderDto,
        index: number,
        field: K,
        value: PurchaseOrderLineDto[K]
    ): PurchaseOrderDto {
        const lines = [...pr.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...pr, lines };
    }
    createDefaultPOline(existingLines: PurchaseOrderLineDto[]): PurchaseOrderLineDto {
        const defaults = this.generateSmarLine(existingLines);
        return {
            ...this.createPOline(),
            ...defaults
        };
    }
    generateSmarLine(lines: PurchaseOrderLineDto[]): Partial<PurchaseOrderLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            quantity: lastLine.quantity,
            wareHouseId: lastLine.wareHouseId,
            rate: lastLine.rate,
            discountAmount: lastLine.discountAmount,
            taxId: lastLine.taxId,

        };
    }
    deleteLine(pr: PurchaseOrderDto, lineIndex: number): PurchaseOrderDto {
        if (pr.lines.length === 1) {
            return { ...pr, lines: [{ ...this.createPOline() }] };
        }

        return {
            ...pr,
            lines: pr.lines.filter((_, i) => i !== lineIndex)
        };
    }

    savePO(formValue: PurchaseOrderDto, isEditMode: boolean): Observable<PurchaseOrderDto> {
        const url = 'PurchaseOrder';
        formValue.purchaseDate = toDateOnlyString(formValue.purchaseDateUI) ?? '';
        formValue.expectedDeliveryDate = toDateOnlyString(formValue.expectedDeliveryDateUI) ?? '';


        return isEditMode
            ? this.dataService.edit<PurchaseOrderDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<PurchaseOrderDto>(url, formValue);
    }

}