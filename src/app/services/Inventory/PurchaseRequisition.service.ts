import { inject, Injectable } from "@angular/core";
import { PRFormLookupsDto, PurchaseRequisitionDto, PurchaseRequisitionLineDto, SourceModule } from "../../Models/Inventory/PurchaseRequisition.model";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { ProductVariantSearchDto } from "../../Models/Inventory/ProductSearch.model";

@Injectable({
    providedIn: 'root'
})
export class PurchaseRequisitionService {
    private dataService = inject(DataLayerService);

    createDefaultPR(): PurchaseRequisitionDto {
        return {
            name: '', description: '', departmentId: null, sourceModule: SourceModule.General,
            date: '', dateUI: new Date(), lines: [this.createPRLine()]
        };
    }
    createPRLine(): PurchaseRequisitionLineDto {
        return { quantity: 0, wareHouseId: null, productVariantId: null, barcode: '', uom: '' };
    }
    getFormLookups(): Observable<PRFormLookupsDto> {
        return this.dataService.getAll<PRFormLookupsDto>('Dropdowns/PRFormLookups');
    }
    getPRById(id: string): Observable<PurchaseRequisitionDto> {
        return this.dataService.getById<PurchaseRequisitionDto>('PurchaseRequisition', id);
    }
    updateField<K extends keyof PurchaseRequisitionDto>(pr: PurchaseRequisitionDto, field: K, value: PurchaseRequisitionDto[K]): PurchaseRequisitionDto {
        return { ...pr, [field]: value };
    }

    updateLineField<K extends keyof PurchaseRequisitionLineDto>(
        pr: PurchaseRequisitionDto,
        index: number,
        field: K,
        value: PurchaseRequisitionLineDto[K]
    ): PurchaseRequisitionDto {
        const lines = [...pr.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...pr, lines };
    }
    createDefaultPRLine(existingLines: PurchaseRequisitionLineDto[]): PurchaseRequisitionLineDto {
        const defaults = this.generateSmarLine(existingLines);
        return {
            ...this.createPRLine(),
            ...defaults
        };
    }
    generateSmarLine(lines: PurchaseRequisitionLineDto[]): Partial<PurchaseRequisitionLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            quantity: lastLine.quantity,
            wareHouseId: lastLine.wareHouseId,
        };
    }
    deleteLine(pr: PurchaseRequisitionDto, lineIndex: number): PurchaseRequisitionDto {
        if (pr.lines.length === 1) {
            return { ...pr, lines: [{ ...this.createPRLine() }] };
        }

        return {
            ...pr,
            lines: pr.lines.filter((_, i) => i !== lineIndex)
        };
    }

    savePr(formValue: PurchaseRequisitionDto, isEditMode: boolean): Observable<PurchaseRequisitionDto> {
        const url = 'PurchaseRequisition';
        formValue.date = toDateOnlyString(formValue.dateUI) ?? '';


        return isEditMode
            ? this.dataService.edit<PurchaseRequisitionDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<PurchaseRequisitionDto>(url, formValue);
    }

}