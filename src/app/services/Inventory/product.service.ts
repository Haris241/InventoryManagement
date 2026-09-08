import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AutoDropdown } from '../../Models/Pagination.model';
import {
  AttributeDefinitionDropdown,
  ProductAttributeValueDto,
  ProductDTO,
  ProductFormLookups,
  ProductVariantDto,
  WareHouseStockDto
} from '../../Models/Inventory/Product.model';
import { DataLayerService } from '../data-layer.service';
import { FormDataService } from '../formData.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private dataService = inject(DataLayerService);
  private formDataService = inject(FormDataService);

  createDefaultAttributeValue(): ProductAttributeValueDto {
    return { attributeDefinitionId: null, attributeName: '', attributeValueId: null, value: '' };
  }

  createDefaultWarehouseStock(): WareHouseStockDto {
    return { warehouseId: null, warehouseLocationId: null, warehouseName: '', warehouseLocationName: '', quantity: 0, unitCost: 0 };
  }

  createDefaultVariant(): ProductVariantDto {
    return {
      sku: '', barcode: '', description: '',
      costPrice: 0, sellingPrice: 0,
      netWeight: 0, grossWeight: 0, length: 0, width: 0, height: 0,
      imageUrl: null, image: undefined, isActive: true, removedImage: false,
      attributeValues: [this.createDefaultAttributeValue()],
      initialStock: []
    };
  }

  createDefaultProduct(): ProductDTO {
    return {
      productName: '', productNumber: '', productDescription: '',
      uom: null, productType: null, taxRate: 0, isActive: true,
      productCategoryId: null, brandId: null,
      variants: [this.createDefaultVariant()]
    };
  }

  updateField<K extends keyof ProductDTO>(product: ProductDTO, field: K, value: ProductDTO[K]): ProductDTO {
    return { ...product, [field]: value };
  }

  updateLineField<K extends keyof ProductVariantDto>(
    product: ProductDTO,
    index: number,
    field: K,
    value: ProductVariantDto[K]
  ): ProductDTO {
    const variants = [...product.variants];
    variants[index] = { ...variants[index], [field]: value };
    return { ...product, variants };
  }

  updateVariantAttributeField<K extends keyof ProductAttributeValueDto>(
    product: ProductDTO,
    variantIndex: number,
    attrIndex: number,
    field: K,
    value: ProductAttributeValueDto[K]
  ): ProductDTO {
    const variants = [...product.variants];
    const attributeValues = [...variants[variantIndex].attributeValues];

    attributeValues[attrIndex] = {
      ...attributeValues[attrIndex],
      [field]: value
    };

    variants[variantIndex] = { ...variants[variantIndex], attributeValues };
    return { ...product, variants };
  }

  updateVariantStockField<K extends keyof WareHouseStockDto>(
    product: ProductDTO,
    variantIndex: number,
    stockIndex: number,
    field: K,
    value: WareHouseStockDto[K]
  ): ProductDTO {
    const variants = [...product.variants];
    const initialStock = [...variants[variantIndex].initialStock];

    initialStock[stockIndex] = {
      ...initialStock[stockIndex],
      [field]: value
    };

    variants[variantIndex] = { ...variants[variantIndex], initialStock };
    return { ...product, variants };
  }

  createNewVariant(existingVariants: ProductVariantDto[]): ProductVariantDto {
    const defaults = this.generateSmartVariant(existingVariants);

    return {
      ...this.createDefaultVariant(),
      ...defaults,
      attributeValues: [this.createDefaultAttributeValue()],
      initialStock: []
    };
  }

  deleteVariant(product: ProductDTO, variantIndex: number): ProductDTO {
    if (product.variants.length === 1) {
      return { ...product, variants: [{ ...this.createDefaultVariant() }] };
    }

    return {
      ...product,
      variants: product.variants.filter((_, i) => i !== variantIndex)
    };
  }

  addStockLine(product: ProductDTO, variantIndex: number): ProductDTO {
    const variants = [...product.variants];
    variants[variantIndex] = {
      ...variants[variantIndex],
      initialStock: [...variants[variantIndex].initialStock, { ...this.createDefaultWarehouseStock() }]
    };
    return { ...product, variants };
  }

  addFirstStockLine(product: ProductDTO, variantIndex: number): ProductDTO {
    const variants = [...product.variants];
    variants[variantIndex] = {
      ...variants[variantIndex],
      initialStock: [{ ...this.createDefaultWarehouseStock() }]
    };
    return { ...product, variants };
  }

  deleteStockLine(product: ProductDTO, variantIndex: number, stockIndex: number): ProductDTO {
    const variants = [...product.variants];
    variants[variantIndex] = {
      ...variants[variantIndex],
      initialStock: variants[variantIndex].initialStock.filter((_, i) => i !== stockIndex)
    };
    return { ...product, variants };
  }

  setVariantImage(product: ProductDTO, variantIndex: number, file: File): ProductDTO {
    const variants = [...product.variants];
    variants[variantIndex] = { ...variants[variantIndex], image: file, removedImage: false };
    return { ...product, variants };
  }

  removeVariantImage(product: ProductDTO, variantIndex: number, isEditMode: boolean): ProductDTO {
    const variants = [...product.variants];
    variants[variantIndex] = {
      ...variants[variantIndex],
      image: undefined,
      removedImage: isEditMode
    };
    return { ...product, variants };
  }

  generateSmartVariant(variants: ProductVariantDto[]): Partial<ProductVariantDto> {
    if (!variants.length) {
      return {};
    }

    const lastVariant = variants[variants.length - 1];

    return {
      costPrice: lastVariant.costPrice,
      sellingPrice: lastVariant.sellingPrice,
      netWeight: lastVariant.netWeight,
      grossWeight: lastVariant.grossWeight,
      length: lastVariant.length,
      width: lastVariant.width,
      height: lastVariant.height
    };
  }

  buildSkuFromAttributes(
    product: ProductDTO,
    variantIndex: number,
    attributeDefinitions: AttributeDefinitionDropdown[]
  ): string {
    const variant = product.variants[variantIndex];

    const productPart = (product.productNumber || 'PRD')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '-');

    const attrCodes = attributeDefinitions
      .map(def => {
        const entry = variant.attributeValues?.find(a => a.attributeDefinitionId === def.id);
        const option = def.values.find(v => v.id === entry?.attributeValueId);
        return option?.code?.toUpperCase();
      })
      .filter((code): code is string => !!code);

    return [productPart, ...attrCodes].join('-');
  }

  shouldAutoGenerateSku(
    variant: ProductVariantDto,
    isEditMode: boolean,
    existingVariantIds: string[],
    lastAutoSku: string | undefined
  ): boolean {
    if (isEditMode && variant.id && existingVariantIds.includes(variant.id)) {
      return false;
    }

    return !variant.sku || variant.sku === lastAutoSku;
  }

  findDuplicateVariantIndices(variants: ProductVariantDto[], attributeDefinitions: AttributeDefinitionDropdown[]): Set<number> {
    const seen = new Map<string, number[]>();

    if (attributeDefinitions.length === 0) {
      return new Set<number>();
    }

    variants.forEach((variant, variantIdx) => {
      const attrValues = variant.attributeValues ?? [];

      const key = attributeDefinitions
        .map(def => {
          const entry = attrValues.find(a => a.attributeDefinitionId === def.id);
          return `${def.id}:${entry?.attributeValueId ?? 'none'}`;
        }).join('|');

      const existing = seen.get(key) ?? [];
      seen.set(key, [...existing, variantIdx]);
    });

    const duplicates = new Set<number>();
    for (const indices of seen.values()) {
      if (indices.length > 1) {
        indices.forEach((idx) => duplicates.add(idx));
      }
    }

    return duplicates;
  }
  canDeleteVariant(
    isEditMode: boolean,
    variant: ProductVariantDto,
    existingVariantIds: string[]
  ): string | null {
    if (isEditMode && variant.id && existingVariantIds.includes(variant.id)) {
      return 'Persisted variants cannot be deleted directly. Deactivate them instead.';
    }

    return null;
  }

  canModifyInitialStock(
    isEditMode: boolean,
    variant: ProductVariantDto,
    existingVariantIds: string[]
  ): string | null {
    if (isEditMode && variant.id && existingVariantIds.includes(variant.id)) {
      return 'Initial stock for existing variants cannot be modified or deleted.';
    }

    return null;
  }

  extractExistingVariantIds(product: ProductDTO): string[] {
    return product.variants.map(v => v.id).filter((vId): vId is string => !!vId);
  }

  getFormLookups(): Observable<ProductFormLookups> {
    return this.dataService.getAll<ProductFormLookups>('Dropdowns/ProductFormLookups');
  }

  getProductById(id: string): Observable<ProductDTO> {
    return this.dataService.getById<ProductDTO>('Products', id);
  }

  getLocationsByWarehouse(warehouseId: number): Observable<AutoDropdown[]> {
    return this.dataService.getAllSimple<AutoDropdown>(`Dropdowns/LocationsByWarehouse/${warehouseId}`);
  }

  saveProduct(formValue: ProductDTO, isEditMode: boolean): Observable<ProductDTO> {
    const formdata = this.formDataService.buildFormData(formValue);
    const url = 'Products';

    return isEditMode
      ? this.dataService.edit<ProductDTO>(url, formValue.id?.toString() ?? '', formdata)
      : this.dataService.create<ProductDTO>(url, formdata);
  }
  setVariantAttributeValue(product: ProductDTO, variantIndex: number, attributeDefinitionId: number, attributeValueId: number | null, definitions: AttributeDefinitionDropdown[]): ProductDTO {
    const variants = [...product.variants];
    const variant = variants[variantIndex];
    const def = definitions.find(d => d.id === attributeDefinitionId);

    const attributeValues = [...(variant.attributeValues ?? [])];
    const existingIdx = attributeValues.findIndex(a => a.attributeDefinitionId === attributeDefinitionId);

    const entry: ProductAttributeValueDto = {
      attributeDefinitionId,
      attributeName: def?.name ?? '',
      attributeValueId,
      value: def?.values.find(v => v.id === attributeValueId)?.value ?? ''
    };

    if (existingIdx >= 0) {
      attributeValues[existingIdx] = entry;
    } else {
      attributeValues.push(entry);
    }

    variants[variantIndex] = { ...variant, attributeValues };
    return { ...product, variants };
  }
}
