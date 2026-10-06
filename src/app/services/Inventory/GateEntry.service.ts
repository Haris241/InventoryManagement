import { inject, Injectable } from "@angular/core";
import { GateEntryDto, GateEntryLineDto, GateEntrySourceModule, GEFormLookupsDto } from "../../Models/Inventory/GateEntry.model";
import { DataLayerService } from "../data-layer.service";
import { Observable } from "rxjs";
import { toDateOnlyString } from "../../shared/Utility";
import { PaginationService } from "../pagination.service";
import { AutoDropdown } from "../../Models/Pagination.model";
import { SourceModuleConfig } from "../../Models/Inventory/SourceModuleConfig.model";

@Injectable({
    providedIn: 'root'
})
export class GateEntryService {
    private dataService = inject(DataLayerService);
    private pagination = inject(PaginationService);

    getSourceConfigs(): Partial<Record<GateEntrySourceModule, SourceModuleConfig<GateEntryLineDto>>> {
        return {
            [GateEntrySourceModule.PurchaseOrder]: {
                label: 'Search Purchase Order',
                search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseOrderListApproved'),
                fetchLines: (id) => this.getPOLines(id),
                duplicateError: 'The selected Purchase Order has already been added.'
            }
        };
    }

    createDefaultGE(): GateEntryDto {
        return {
            name: '',
            description: '',
            sourceModule: GateEntrySourceModule.General,
            entryDate: '',
            entryDateUI: new Date(),
            driverName: '',
            vehicleNumber: '',
            driverContact: '',
            supplierId: null,
            lines: [this.createGEline()]
        };
    }
    createGEline(): GateEntryLineDto {
        return {
            quantity: 0, wareHouseId: null, productVariantId: null, barcode: '', uom: '',
            productVariantName: '', warehouseName: '', sourceRowId: null, availableQuantity: null
        };
    }
    getFormLookups(): Observable<GEFormLookupsDto> {
        return this.dataService.getAll<GEFormLookupsDto>('Dropdowns/GEFormLookups');
    }
    getGEById(id: string): Observable<GateEntryDto> {
        return this.dataService.getById<GateEntryDto>('GateEntry', id);
    }
    getPOLines(id: string): Observable<GateEntryLineDto[]> {
        return this.dataService.getById<GateEntryLineDto[]>('GateEntry/getPurchaseOrder', id);
    }
    updateField<K extends keyof GateEntryDto>(ge: GateEntryDto, field: K, value: GateEntryDto[K]): GateEntryDto {
        return { ...ge, [field]: value };
    }

    updateLineField<K extends keyof GateEntryLineDto>(
        ge: GateEntryDto,
        index: number,
        field: K,
        value: GateEntryLineDto[K]
    ): GateEntryDto {
        const lines = [...ge.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...ge, lines };
    }
    createDefaultGEline(existingLines: GateEntryLineDto[]): GateEntryLineDto {
        const defaults = this.generateSmarLine(existingLines);
        return {
            ...this.createGEline(),
            ...defaults
        };
    }
    generateSmarLine(lines: GateEntryLineDto[]): Partial<GateEntryLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            quantity: lastLine.quantity,
            wareHouseId: lastLine.wareHouseId,
        };
    }
    deleteLine(ge: GateEntryDto, lineIndex: number): GateEntryDto {
        if (ge.lines.length === 1) {
            return { ...ge, lines: [{ ...this.createGEline() }] };
        }

        return {
            ...ge,
            lines: ge.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveGE(formValue: GateEntryDto, isEditMode: boolean): Observable<GateEntryDto> {
        const url = 'GateEntry';
        formValue.entryDate = toDateOnlyString(formValue.entryDateUI) ?? null;

        return isEditMode
            ? this.dataService.edit<GateEntryDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<GateEntryDto>(url, formValue);
    }

}