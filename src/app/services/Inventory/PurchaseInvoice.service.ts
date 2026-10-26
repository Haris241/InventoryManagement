import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { PurchaseInvoiceDto, PurchaseInvoiceFormLookupsDto, PurchaseInvoiceLineDto } from "../../Models/Inventory/PurchaseInvoice.model";

@Injectable({
    providedIn: 'root'
})
export class PurchaseInvoiceService {
    private dataService = inject(DataLayerService);

    createDefaultPI(): PurchaseInvoiceDto {
        return {
            name: '',
            description: '',
            supplierInvoiceNumber: '',
            date: '',
            dateUI: new Date(),
            dueDate: '',
            dueDateUI: null,
            supplierId: null,
            lines: []
        };
    }

    createPIline(): PurchaseInvoiceLineDto {
        return {
            quantity: 0,
            rate: 0,
            discountPercentage: 0,
            taxId: null,
            wareHouseId: null,
            warehouseName: '',
            productVariantId: null,
            productName: '',
            barcode: '',
            uom: '',
            grnLineId: null,
            availableQuantity: null,
            supplierId: null
        };
    }

    getFormLookups(): Observable<PurchaseInvoiceFormLookupsDto> {
        return this.dataService.getAll<PurchaseInvoiceFormLookupsDto>('Dropdowns/PurchaseInvoiceFormLookups');
    }

    getPIById(id: string): Observable<PurchaseInvoiceDto> {
        return this.dataService.getById<PurchaseInvoiceDto>('PurchaseInvoice', id);
    }

    getGRNLines(id: string): Observable<PurchaseInvoiceLineDto[]> {
        return this.dataService.getById<PurchaseInvoiceLineDto[]>('PurchaseInvoice/getGRN', id);
    }

    updateField<K extends keyof PurchaseInvoiceDto>(pi: PurchaseInvoiceDto, field: K, value: PurchaseInvoiceDto[K]): PurchaseInvoiceDto {
        return { ...pi, [field]: value };
    }

    updateLineField<K extends keyof PurchaseInvoiceLineDto>(
        pi: PurchaseInvoiceDto,
        index: number,
        field: K,
        value: PurchaseInvoiceLineDto[K]
    ): PurchaseInvoiceDto {
        const lines = [...pi.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...pi, lines };
    }

    deleteLine(pi: PurchaseInvoiceDto, lineIndex: number): PurchaseInvoiceDto {
        return {
            ...pi,
            lines: pi.lines.filter((_, i) => i !== lineIndex)
        };
    }

    savePI(formValue: PurchaseInvoiceDto, isEditMode: boolean): Observable<PurchaseInvoiceDto> {
        const url = 'PurchaseInvoice';
        formValue.date = toDateOnlyString(formValue.dateUI) ?? null;
        formValue.dueDate = toDateOnlyString(formValue.dueDateUI) ?? null;

        return isEditMode
            ? this.dataService.edit<PurchaseInvoiceDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<PurchaseInvoiceDto>(url, formValue);
    }
}