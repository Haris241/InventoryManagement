import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { StockTransferDto, StockTransferFormLookupsDto, StockTransferLineDto, StockTransferMode } from "../../Models/Inventory/StockTransfer.model";

@Injectable({
    providedIn: 'root'
})
export class StockTransferService {
    private dataService = inject(DataLayerService);

    createDefaultST(): StockTransferDto {
        return {
            name: '',
            remarks: '',
            mode: StockTransferMode.Direct,
            fromWarehouseId: null,
            toWarehouseId: null,
            transferDate: '',
            transferDateUI: new Date(),
            lines: [this.createSTline()]
        };
    }

    createSTline(): StockTransferLineDto {
        return {
            productVariantId: null,
            productName: '',
            barcode: '',
            uom: '',
            quantity: 0,
            receivedQuantity: 0,
            availableQuantity: 0,
            fromWarehouseLocationId: null,
            toWarehouseLocationId: null,
            remarks: ''
        };
    }

    getFormLookups(): Observable<StockTransferFormLookupsDto> {
        return this.dataService.getAll<StockTransferFormLookupsDto>('Dropdowns/StockTransferFormLookups');
    }

    getSTById(id: string, isReceived: boolean = false): Observable<StockTransferDto> {
        return isReceived
            ? this.dataService.getById<StockTransferDto>('StockTransfer/received', id)
            : this.dataService.getById<StockTransferDto>('StockTransfer', id);
    }

    updateField<K extends keyof StockTransferDto>(st: StockTransferDto, field: K, value: StockTransferDto[K]): StockTransferDto {
        return { ...st, [field]: value };
    }

    updateLineField<K extends keyof StockTransferLineDto>(
        st: StockTransferDto,
        index: number,
        field: K,
        value: StockTransferLineDto[K]
    ): StockTransferDto {
        const lines = [...st.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...st, lines };
    }

    createDefaultSTline(existingLines: StockTransferLineDto[]): StockTransferLineDto {
        const defaults = this.generateSmartLine(existingLines);
        return {
            ...this.createSTline(),
            ...defaults
        };
    }

    generateSmartLine(lines: StockTransferLineDto[]): Partial<StockTransferLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            fromWarehouseLocationId: lastLine.fromWarehouseLocationId,
            toWarehouseLocationId: lastLine.toWarehouseLocationId,
        };
    }

    deleteLine(st: StockTransferDto, lineIndex: number): StockTransferDto {
        if (st.lines.length === 1) {
            return { ...st, lines: [{ ...this.createSTline() }] };
        }

        return {
            ...st,
            lines: st.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveST(formValue: StockTransferDto, isEditMode: boolean): Observable<StockTransferDto> {
        const url = 'StockTransfer';
        formValue.transferDate = toDateOnlyString(formValue.transferDateUI) ?? '';

        return isEditMode
            ? this.dataService.edit<StockTransferDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<StockTransferDto>(url, formValue);
    }

    receiveST(formValue: StockTransferDto): Observable<StockTransferDto> {
        const url = 'StockTransfer/received';
        formValue.transferDate = toDateOnlyString(formValue.transferDateUI) ?? '';

        return this.dataService.edit<StockTransferDto>(url, formValue.id?.toString() ?? '', formValue);
    }
}

