import { inject, Injectable } from "@angular/core";
import { DataLayerService } from "../data-layer.service";
import { Observable } from "rxjs";
import { toDateOnlyString } from "../../shared/Utility";
import { PaginationService } from "../pagination.service";
import { AutoDropdown } from "../../Models/Pagination.model";
import { SourceModuleConfig } from "../../Models/Inventory/SourceModuleConfig.model";
import { OGPFormLookupsDto, OutwardGatePassDto, OutwardGatePassLineDto, OutwardGatePassSourceModule } from "../../Models/Inventory/OGP.model";

@Injectable({
    providedIn: 'root'
})
export class OGPService {
    private dataService = inject(DataLayerService);
    private pagination = inject(PaginationService);

    getSourceConfigs(): Partial<Record<OutwardGatePassSourceModule, SourceModuleConfig<OutwardGatePassLineDto>>> {
        return {
            [OutwardGatePassSourceModule.PurchaseReturn]: {
                label: 'Search Purchase Return',
                search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseReturnListApproved'),
                fetchLines: (id) => this.getPurchaseReturnLines(id),
                duplicateError: 'The selected Purchase Return has already been added.'
            }
        };
    }

    createDefaultOGP(): OutwardGatePassDto {
        return {
            name: '',
            description: '',
            destinationAddress: '',
            recipientName: '',
            vehicleNumber: '',
            driverName: '',
            driverContact: '',
            transporterName: '',
            remarks: '',
            customerId: null,
            supplierId: null,
            sourceModule: OutwardGatePassSourceModule.General,
            isStockImpacting: false,
            exitDateTime: new Date(),
            lines: [this.createOGPline()]
        };
    }

    createOGPline(): OutwardGatePassLineDto {
        return {
            quantity: 0,
            wareHouseId: null,
            warehouseName: '',
            warehouseLocationId: null,
            warehouseLocationName: '',
            productVariantId: null,
            productName: '',
            barcode: '',
            uom: '',
            sourceRowId: null,
            availableQuantity: null,
            supplierId: null
        };
    }

    getFormLookups(): Observable<OGPFormLookupsDto> {
        return this.dataService.getAll<OGPFormLookupsDto>('Dropdowns/OGPFormLookups');
    }

    getOGPById(id: string): Observable<OutwardGatePassDto> {
        return this.dataService.getById<OutwardGatePassDto>('OutwardGatePass', id);
    }

    getPurchaseReturnLines(id: string): Observable<OutwardGatePassLineDto[]> {
        return this.dataService.getById<OutwardGatePassLineDto[]>('OutwardGatePass/getPurchaseReturn', id);
    }

    getSalesOrderLines(id: string): Observable<OutwardGatePassLineDto[]> {
        return this.dataService.getById<OutwardGatePassLineDto[]>('OutwardGatePass/getSalesOrder', id);
    }

    updateField<K extends keyof OutwardGatePassDto>(ogp: OutwardGatePassDto, field: K, value: OutwardGatePassDto[K]): OutwardGatePassDto {
        return { ...ogp, [field]: value };
    }

    updateLineField<K extends keyof OutwardGatePassLineDto>(
        ogp: OutwardGatePassDto,
        index: number,
        field: K,
        value: OutwardGatePassLineDto[K]
    ): OutwardGatePassDto {
        const lines = [...ogp.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...ogp, lines };
    }

    createDefaultOGPline(existingLines: OutwardGatePassLineDto[]): OutwardGatePassLineDto {
        const defaults = this.generateSmartLine(existingLines);
        return {
            ...this.createOGPline(),
            ...defaults
        };
    }

    generateSmartLine(lines: OutwardGatePassLineDto[]): Partial<OutwardGatePassLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            quantity: lastLine.quantity,
            wareHouseId: lastLine.wareHouseId,
            warehouseLocationId: lastLine.warehouseLocationId,
        };
    }

    deleteLine(ogp: OutwardGatePassDto, lineIndex: number): OutwardGatePassDto {
        if (ogp.lines.length === 1 && ogp.sourceModule === OutwardGatePassSourceModule.General) {
            return { ...ogp, lines: [{ ...this.createOGPline() }] };
        }

        return {
            ...ogp,
            lines: ogp.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveOGP(formValue: OutwardGatePassDto, isEditMode: boolean): Observable<OutwardGatePassDto> {
        const url = 'OutwardGatePass';

        return isEditMode
            ? this.dataService.edit<OutwardGatePassDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<OutwardGatePassDto>(url, formValue);
    }
}
