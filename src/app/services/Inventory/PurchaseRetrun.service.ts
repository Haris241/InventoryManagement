import { inject, Injectable } from "@angular/core";
import { DataLayerService } from "../data-layer.service";
import { Observable } from "rxjs";
import { toDateOnlyString } from "../../shared/Utility";
import { PaginationService } from "../pagination.service";
import { AutoDropdown } from "../../Models/Pagination.model";
import { SourceModuleConfig } from "../../Models/Inventory/SourceModuleConfig.model";
import { PurchaseReturnDto, PurchaseReturnFormLookupsDto, PurchaseReturnLineDto, PurchaseReturnSourceModule } from "../../Models/Inventory/PurchaseRetrun.model";

@Injectable({
    providedIn: 'root'
})
export class PurchaseReturnService {
    private dataService = inject(DataLayerService);
    private pagination = inject(PaginationService);

    getSourceConfigs(): Partial<Record<PurchaseReturnSourceModule, SourceModuleConfig<PurchaseReturnLineDto>>> {
        return {
            [PurchaseReturnSourceModule.PurchaseOrder]: {
                label: 'Search Purchase Order',
                search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/POPRListApproved'),
                fetchLines: (id) => this.getPOLines(id),
                duplicateError: 'The selected Purchase Order has already been added.',
                isPriceReadonly: () => true
            },
            [PurchaseReturnSourceModule.GRN]: {
                label: 'Search GRN',
                search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/GRNPRListApproved'),
                fetchLines: (id) => this.getGRNLines(id),
                duplicateError: 'The selected GRN has already been added.',
            },
            [PurchaseReturnSourceModule.PurchaseInvoice]: {
                label: 'Search Purchase Invoice',
                search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseInvoicePRListApproved'),
                fetchLines: (id) => this.getPurchaseInvoiceLines(id),
                duplicateError: 'The selected Purchase Invoice has already been added.',
            }
        };
    }
    createDefaultPR(): PurchaseReturnDto {
        return {
            name: '',
            description: '',
            sourceModule: null,
            date: '',
            dateUI: new Date(),
            supplierId: null,
            lines: []
        };
    }
    createPRline(): PurchaseReturnLineDto {
        return {
            quantity: 0, rate: 0, discountPercentage: 0, reason: '', reasonNote: '',
            taxId: null, wareHouseId: null, warehouseName: '', warehouseLocationId: null,
            warehouseLocationName: '', productVariantId: null, productName: '', barcode: '', uom: '', sourceRowId: null, availableQuantity: null,
            supplierId: null
        };
    }
    getFormLookups(): Observable<PurchaseReturnFormLookupsDto> {
        return this.dataService.getAll<PurchaseReturnFormLookupsDto>('Dropdowns/PurchaseReturnFormLookups');
    }
    getPRById(id: string): Observable<PurchaseReturnDto> {
        return this.dataService.getById<PurchaseReturnDto>('PurchaseReturn', id);
    }
    getPOLines(id: string): Observable<PurchaseReturnLineDto[]> {
        return this.dataService.getById<PurchaseReturnLineDto[]>('PurchaseReturn/getPurchaseOrder', id);
    }
    getGRNLines(id: string): Observable<PurchaseReturnLineDto[]> {
        return this.dataService.getById<PurchaseReturnLineDto[]>('PurchaseReturn/getGRN', id);
    }
    getPurchaseInvoiceLines(id: string): Observable<PurchaseReturnLineDto[]> {
        return this.dataService.getById<PurchaseReturnLineDto[]>('PurchaseReturn/getPurchaseInvoice', id);
    }


    updateField<K extends keyof PurchaseReturnDto>(pr: PurchaseReturnDto, field: K, value: PurchaseReturnDto[K]): PurchaseReturnDto {
        return { ...pr, [field]: value };
    }

    updateLineField<K extends keyof PurchaseReturnLineDto>(
        pr: PurchaseReturnDto,
        index: number,
        field: K,
        value: PurchaseReturnLineDto[K]
    ): PurchaseReturnDto {
        const lines = [...pr.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...pr, lines };
    }

    deleteLine(pr: PurchaseReturnDto, lineIndex: number): PurchaseReturnDto {
        return {
            ...pr,
            lines: pr.lines.filter((_, i) => i !== lineIndex)
        };
    }

    savePR(formValue: PurchaseReturnDto, isEditMode: boolean): Observable<PurchaseReturnDto> {
        const url = 'PurchaseReturn';
        formValue.date = toDateOnlyString(formValue.dateUI) ?? null;

        return isEditMode
            ? this.dataService.edit<PurchaseReturnDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<PurchaseReturnDto>(url, formValue);
    }
}