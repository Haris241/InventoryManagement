import { inject, Injectable } from "@angular/core";
import { DataLayerService } from "../data-layer.service";
import { GRNDto, GRNFormLookupsDto, GRNLineDto, GRNSourceModule } from "../../Models/Inventory/GRN.model";
import { GateEntryLineDto } from "../../Models/Inventory/GateEntry.model";
import { Observable } from "rxjs";
import { toDateOnlyString } from "../../shared/Utility";

@Injectable({
    providedIn: 'root'
})
export class GrnService {
    private dataService = inject(DataLayerService);

    createDefaultGRN(): GRNDto {
        return {
            name: '',
            description: '',
            sourceModule: GRNSourceModule.General,
            date: '',
            dateUI: new Date(),
            supplierId: null,
            lines: [this.createGRNline()]
        };
    }
    createGRNline(): GRNLineDto {
        return {
            acceptedQuantity: 0, rejectedQuantity: 0, rejectedReason: '', rate: 0,
            discountPercentage: 0, taxId: null, wareHouseId: null, warehouseName: '', warehouseLocationId: null, isPOBasedGE: false,
            warehouseLocationName: '', productVariantId: null, productVariantName: '', barcode: '', uom: '', sourceRowId: null, availableQuantity: null
        };
    }
    getFormLookups(): Observable<GRNFormLookupsDto> {
        return this.dataService.getAll<GRNFormLookupsDto>('Dropdowns/GRNFormLookups');
    }
    getGRNById(id: string): Observable<GRNDto> {
        return this.dataService.getById<GRNDto>('GRN', id);
    }
    getPOLines(id: string): Observable<GateEntryLineDto[]> {
        return this.dataService.getById<GateEntryLineDto[]>('GRN/getPurchaseOrder', id);
    }
    getGELines(id: string): Observable<GateEntryLineDto[]> {
        return this.dataService.getById<GateEntryLineDto[]>('GRN/getGateEntry', id);
    }

    updateField<K extends keyof GRNDto>(grn: GRNDto, field: K, value: GRNDto[K]): GRNDto {
        return { ...grn, [field]: value };
    }

    updateLineField<K extends keyof GRNLineDto>(
        grn: GRNDto,
        index: number,
        field: K,
        value: GRNLineDto[K]
    ): GRNDto {
        const lines = [...grn.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...grn, lines };
    }
    createDefaultGRNline(existingLines: GRNLineDto[]): GRNLineDto {
        const defaults = this.generateSmarLine(existingLines);
        return {
            ...this.createGRNline(),
            ...defaults
        };
    }
    generateSmarLine(lines: GRNLineDto[]): Partial<GRNLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            acceptedQuantity: lastLine.acceptedQuantity,
            wareHouseId: lastLine.wareHouseId,
            discountPercentage: lastLine.discountPercentage,
            taxId: lastLine.taxId,
            rate: lastLine.rate,
        };
    }
    deleteLine(grn: GRNDto, lineIndex: number): GRNDto {
        if (grn.lines.length === 1) {
            return { ...grn, lines: [{ ...this.createGRNline() }] };
        }

        return {
            ...grn,
            lines: grn.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveGRN(formValue: GRNDto, isEditMode: boolean): Observable<GRNDto> {
        const url = 'GRN';
        formValue.date = toDateOnlyString(formValue.dateUI) ?? null;

        return isEditMode
            ? this.dataService.edit<GRNDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<GRNDto>(url, formValue);
    }
}