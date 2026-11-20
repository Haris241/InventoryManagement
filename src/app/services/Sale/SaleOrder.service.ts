import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DataLayerService } from "../data-layer.service";
import { toDateOnlyString } from "../../shared/Utility";
import { PaginationService } from "../pagination.service"; import { SaleOrderDto, SaleOrderLineDto, SOFormLookupsDto } from "../../Models/Sale/SaleOrder.model";
import { CustomerDetails } from "../../Models/Sale/Customer.model";

@Injectable({
    providedIn: 'root'
})
export class SaleOrderService {
    private dataService = inject(DataLayerService);
    private pagination = inject(PaginationService);

    createDefaultSO(): SaleOrderDto {
        return {
            name: '', description: '',
            orderDate: '', orderDateUI: new Date(), expectedDeliveryDate: '', expectedDeliveryDateUI: null,
            shippingAddress: '', customerName: '', customerReference: '',
            billingAddress: '', customerId: null, lines: [this.createSOline()]
        };
    }
    createSOline(): SaleOrderLineDto {
        return {
            quantity: 0, wareHouseId: null, productVariantId: null, barcode: '', uom: '',
            warehouseLocationId: null, warehouseLocationName: '', taxId: null, rate: 0, discountPercentage: 0, productName: '',
            availableQuantity: null,
        };
    }
    getFormLookups(): Observable<SOFormLookupsDto> {
        return this.dataService.getAll<SOFormLookupsDto>('SalesDropDown/SOFormLookups');
    }
    getSOById(id: string): Observable<SaleOrderDto> {
        return this.dataService.getById<SaleOrderDto>('SaleOrder', id);
    }

    updateField<K extends keyof SaleOrderDto>(pr: SaleOrderDto, field: K, value: SaleOrderDto[K]): SaleOrderDto {
        return { ...pr, [field]: value };
    }

    updateLineField<K extends keyof SaleOrderLineDto>(
        pr: SaleOrderDto,
        index: number,
        field: K,
        value: SaleOrderLineDto[K]
    ): SaleOrderDto {
        const lines = [...pr.lines];
        lines[index] = { ...lines[index], [field]: value };
        return { ...pr, lines };
    }
    createDefaultSOline(existingLines: SaleOrderLineDto[]): SaleOrderLineDto {
        const defaults = this.generateSmarLine(existingLines);
        return {
            ...this.createSOline(),
            ...defaults
        };
    }
    generateSmarLine(lines: SaleOrderLineDto[]): Partial<SaleOrderLineDto> {
        if (!lines.length) {
            return {};
        }

        const lastLine = lines[lines.length - 1];

        return {
            quantity: lastLine.quantity,
            wareHouseId: lastLine.wareHouseId,
            rate: lastLine.rate,
            discountPercentage: lastLine.discountPercentage,
            taxId: lastLine.taxId,

        };
    }
    deleteLine(pr: SaleOrderDto, lineIndex: number): SaleOrderDto {
        if (pr.lines.length === 1) {
            return { ...pr, lines: [{ ...this.createSOline() }] };
        }

        return {
            ...pr,
            lines: pr.lines.filter((_, i) => i !== lineIndex)
        };
    }

    saveSO(formValue: SaleOrderDto, isEditMode: boolean): Observable<SaleOrderDto> {
        const url = 'SaleOrder';
        formValue.orderDate = toDateOnlyString(formValue.orderDateUI) ?? null;
        formValue.expectedDeliveryDate = toDateOnlyString(formValue.expectedDeliveryDateUI) ?? null;


        return isEditMode
            ? this.dataService.edit<SaleOrderDto>(url, formValue.id?.toString() ?? '', formValue)
            : this.dataService.create<SaleOrderDto>(url, formValue);
    }
    getCustomerDetails(customerId: string): Observable<CustomerDetails> {
        let url = `SalesDropDown/CustomerDetails?customerId=${customerId}`;
        return this.dataService.getAll<CustomerDetails>(url);
    }

}