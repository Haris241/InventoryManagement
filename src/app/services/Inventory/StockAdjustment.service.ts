import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { StockAdjustmentDto, StockAdjustmentFormLookupsDto, StockAdjustmentLineDto, StockAdjustmentReason } from "../../Models/Inventory/StockAdjustment.model";

@Injectable({
    providedIn: 'root'
})
export class StockAdjustmentService {
    private dataService = inject(DataLayerService);

    createDefaultSA(): StockAdjustmentDto {
        return {
            name: '',
            remarks: '',
            reason: StockAdjustmentReason.PhysicalCount,
            warehouseId: null,
            adjustmentDate: '',
            adjustmentDateUI: new Date(),
            lines: [this.createSAline()]
        };
    }

    createSAline(): StockAdjustmentLineDto {
        return {
            productVariantId: null,
            productName: '',
            barcode: '',
            uom: '',
            countedQuantity: 0,
            availableQuantity: 0,
            warehouseLocationId: null,
            remarks: ''
        };
    }

    getFormLookups(): Observable<StockAdjustmentFormLookupsDto> {
        return this.dataService.getAll<StockAdjustmentFormLookupsDto>('Dropdowns/StockAdjustmentFormLookups');
    }

    getSAById(id: string): Observable<StockAdjustmentDto> {
        return this.dataService.getById<StockAdjustmentDto>('StockAdjustment', id);
    }

    updateField<K extends keyof StockAdjustmentDto>(sa: StockAdjustmentDto, field: K, value: StockAdjustmentDto[K]): StockAdjustmentDto {
        return { ...sa, [field]: value };
    }

    updateLineField<K extends keyof StockAdjustmentLineDto>(
        sa: StockAdjustmentDto,
        index: number,
        field: K,
        value: StockAdjustmentLineDto[K]
    ): StockAdjustmentDto {
        const lines = [...sa.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...sa, lines };
    }

    createDefaultSAline(existingLines: StockAdjustmentLineDto[]): StockAdjustmentLineDto {
        const defaults = this.generateSmartLine(existingLines);
        return {
            ...this.createSAline(),
            ...defaults
        };
    }

    generateSmartLine(lines: StockAdjustmentLineDto[]): Partial<StockAdjustmentLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            warehouseLocationId: lastLine.warehouseLocationId,
        };
    }

    deleteLine(sa: StockAdjustmentDto, lineIndex: number): StockAdjustmentDto {
        if (sa.lines.length === 1) {
            return { ...sa, lines: [{ ...this.createSAline() }] };
        }

        return {
            ...sa,
            lines: sa.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveSA(formValue: StockAdjustmentDto, isEditMode: boolean): Observable<StockAdjustmentDto> {
        const url = 'StockAdjustment';
        formValue.adjustmentDate = toDateOnlyString(formValue.adjustmentDateUI) ?? '';

        return isEditMode
            ? this.dataService.edit<StockAdjustmentDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<StockAdjustmentDto>(url, formValue);
    }
}
