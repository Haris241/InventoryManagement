import { Component, DestroyRef, inject, signal } from '@angular/core';
import { applyEach, form, FormField, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { DataLayerService } from '../../../../services/data-layer.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { enumToOptions } from '../../../../shared/Utility';
import { AttributeDefinitionDropdown, ProductAttributeValueDto, ProductDTO, ProductFormLookups, ProductType, ProductVariantDto, UOM, WareHouseStockDto } from '../../../../Models/Inventory/Product.model';
import { FormDataService } from '../../../../services/formData.service';
@Component({
  selector: 'app-add-product',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {

  //Initial Call
  wareHouses = signal<AutoDropdown[]>([]);
  productCategories = signal<AutoDropdown[]>([]);
  brands = signal<AutoDropdown[]>([]);
  attributeDefinitions = signal<AttributeDefinitionDropdown[]>([]);


  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private formservice = inject(FormDataService);


  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  uomList = signal(enumToOptions(UOM, true));
  productTypes = signal(enumToOptions(ProductType, true));
  isEditMode = signal<boolean>(false);
  existingVariantIds = signal<string[]>([]);
  existingStockWarehouseIds = signal<Record<number, number[]>>({});
  variantImagePreviews = signal<Record<number, string>>({});
  warehouseLocations = signal<Record<number, AutoDropdown[]>>({});

  //Load Voucher for Edit Mode
  ngOnInit() {
    this.wareHouses();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadProduct(id);
        }
      });
  }


  // Initial template for Attribute Values
  private readonly defaultAttributeValue: ProductAttributeValueDto = {
    attributeDefinitionId: null,
    attributeName: '',
    attributeValueId: null,
    value: ''
  };

  // Initial template for Warehouse Stock
  private readonly defaultWarehouseStock: WareHouseStockDto = {
    warehouseId: null,
    warehouseLocationId: null,
    warehouseName: '',
    warehouseLocationName: '',
    quantity: 0,
    unitCost: 0
  };

  // Initial template for a Variant
  private readonly defaultVariant: ProductVariantDto = {
    sku: '',
    barcode: null,
    description: null,
    costPrice: 0,
    sellingPrice: 0,
    netWeight: null,
    grossWeight: null,
    length: null,
    width: null,
    height: null,
    imageUrl: null,
    image: undefined,
    isActive: true,
    removedImage: false,
    attributeValues: [{ ...this.defaultAttributeValue }],
    initialStock: [{ ...this.defaultWarehouseStock }]
  };

  // Main Product Root Model Template
  private readonly defaultProduct: ProductDTO = {
    productName: '',
    productNumber: '',
    productDescription: '',
    uom: null,
    productType: null,
    taxRate: 0,
    isActive: true,
    productCategoryId: null,
    brandId: null,
    variants: [{ ...this.defaultVariant }]
  };

  // Initialize Main Signal
  productModel = signal<ProductDTO>(this.defaultProduct);

  // Validations
  productForm = form(this.productModel, (schema) => {
    // Root Product Validations
    required(schema.productName, { message: 'Product Name is required', });
    required(schema.productNumber, { message: 'Product Number is required' });
    required(schema.uom, { message: 'UOM is required' });
    required(schema.productType, { message: 'Product Type is required' });
    required(schema.productCategoryId, { message: 'Category is required' });

    // Level 1: Variants Collection Validation
    applyEach(schema.variants, (variant) => {
      required(variant.sku, { message: 'SKU is required', });

      // min(path, 0) allows exactly 0 through — doesn't match "must be > 0".
      // Use a strict validate() instead of min() for a true greater-than-zero rule.
      validate(variant.costPrice, ({ value }) => {
        const price = value();
        if (price == null || price <= 0) {
          return { kind: 'positiveCostPrice', message: 'Cost price must be greater than 0' };
        }
        return null;
      });

      validate(variant.sellingPrice, ({ value }) => {
        const price = value();
        if (price == null || price <= 0) {
          return { kind: 'positiveSellingPrice', message: 'Selling price must be greater than 0' };
        }
        return null;
      });

      // Level 2: Initial Stock inside Variant
      // Same warehouse + location cannot be selected more than once
      applyEach(variant.initialStock, (stock) => {
        required(stock.warehouseId, { message: 'Warehouse is required', });
        validate(stock.quantity, ({ value }) => {
          const qty = value();
          if (qty == null || qty <= 0) {
            return { kind: 'positiveQuantity', message: 'Quantity must be greater than 0' };
          }
          return null;
        });

        validate(stock.unitCost, ({ value }) => {
          const cost = value();
          if (cost == null || cost <= 0) {
            return { kind: 'positiveUnitCost', message: 'Unit cost must be greater than 0' };
          }
          return null;
        });

        validate(stock.warehouseLocationId, ({ value, valueOf }) => {
          const locationId = value();
          if (locationId == null) {
            return null;
          }

          const stockRows = valueOf(variant.initialStock) ?? [];

          const duplicateCount = stockRows.filter((s) => s.warehouseLocationId === locationId).length;

          if (duplicateCount > 1) {
            return { kind: 'uniqueWarehouseLocation', message: 'This warehouse location is already used in this variant\'s stock', };
          }
          return null;
        });
      });

      // Variant Attribute Combination Validation

      validate(variant.attributeValues, ({ value }) => {

        const attributes = value();

        if (!attributes || attributes.length === 0) {
          return null;
        }

        // Don't validate incomplete attribute rows (user still picking values)
        const validAttributes = attributes.filter(
          (attr) => attr.attributeDefinitionId != null && attr.attributeValueId != null
        );

        if (validAttributes.length !== attributes.length) {
          return null;
        }

        // Sorting makes Color=Red+Size=XL equal to Size=XL+Color=Red
        const currentCombination = validAttributes
          .map((attr) => `${attr.attributeDefinitionId}:${attr.attributeValueId}`).sort().join('|');

        const variants = this.productModel().variants;

        const duplicateCount = variants.filter((otherVariant) => {
          const otherAttributes = otherVariant.attributeValues ?? [];

          const validOtherAttributes = otherAttributes.filter((attr) => attr.attributeDefinitionId != null && attr.attributeValueId != null);

          if (validOtherAttributes.length !== otherAttributes.length) {
            return false;
          }

          const otherCombination = validOtherAttributes.map((attr) => `${attr.attributeDefinitionId}:${attr.attributeValueId}`).sort().join('|');

          return otherCombination === currentCombination;
        }).length;

        // The current variant is included in this count, so > 1 means
        // another variant shares the exact same combination.
        if (duplicateCount > 1) {
          return {
            kind: 'uniqueVariantAttributes',
            message: 'This attribute combination already exists in another variant',
          };
        }

        return null;
      });
    });
  });
  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductDTO>(field: K, value: ProductDTO[K]) {
    this.productModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof ProductVariantDto>(
    index: number,
    field: K,
    value: ProductVariantDto[K]
  ) {
    this.productModel.update(prev => {
      const variants = [...prev.variants];           // shallow copy the array
      variants[index] = { ...variants[index], [field]: value }; // copy the line, update field
      return { ...prev, variants };
    });
  }
  // Update field inside an attribute row of a variant
  updateVariantAttributeField<K extends keyof ProductAttributeValueDto>(
    variantIndex: number,
    attrIndex: number,
    field: K,
    value: ProductAttributeValueDto[K]
  ) {
    this.productModel.update(prev => {
      const variants = [...prev.variants];
      const attributeValues = [...variants[variantIndex].attributeValues];

      attributeValues[attrIndex] = {
        ...attributeValues[attrIndex],
        [field]: value
      };

      variants[variantIndex] = { ...variants[variantIndex], attributeValues };
      return { ...prev, variants };
    });
  }

  // Update field inside a stock row of a variant
  updateVariantStockField<K extends keyof WareHouseStockDto>(
    variantIndex: number,
    stockIndex: number,
    field: K,
    value: WareHouseStockDto[K]
  ) {
    this.productModel.update(prev => {
      const variants = [...prev.variants];
      const initialStock = [...variants[variantIndex].initialStock];

      initialStock[stockIndex] = {
        ...initialStock[stockIndex],
        [field]: value
      };

      variants[variantIndex] = { ...variants[variantIndex], initialStock };
      return { ...prev, variants };
    });
  }
  // --- VARIANT LEVEL ---
  addVariant(): void {
    this.productModel.update(prev => ({
      ...prev,
      variants: [...prev.variants, { ...this.defaultVariant }]
    }));
  }

  deleteVariant(variantIndex: number): void {
    const targetVariant = this.productModel().variants[variantIndex];

    // Block deletion if variant exists in the database
    if (this.isEditMode() && targetVariant.id && this.existingVariantIds().includes(targetVariant.id)) {
      this.errors.set(['Persisted variants cannot be deleted directly. Deactivate them instead.']);
      return;
    }

    this.errors.set([]); // Clear previous errors if valid

    this.productModel.update(prev => {
      if (prev.variants.length === 1) {
        return { ...prev, variants: [{ ...this.defaultVariant }] };
      }
      return { ...prev, variants: prev.variants.filter((_, i) => i !== variantIndex) };
    });
  }

  addStockLine(variantIndex: number): void {
    const stockArray = this.productForm.variants[variantIndex].initialStock;
    const lastIndex = stockArray.length - 1;
    const currentStockRow = stockArray[lastIndex];

    // Validate the current row's controls before adding a new line
    const isInvalid =
      currentStockRow.warehouseId().invalid() ||
      currentStockRow.quantity().invalid() ||
      currentStockRow.unitCost().invalid();

    if (isInvalid) {
      currentStockRow.warehouseId().markAsTouched();
      currentStockRow.quantity().markAsTouched();
      currentStockRow.unitCost().markAsTouched();
      return;
    }

    // Add new stock line safely
    this.productModel.update(prev => {
      const variants = [...prev.variants];
      variants[variantIndex] = {
        ...variants[variantIndex],
        initialStock: [
          ...variants[variantIndex].initialStock,
          { ...this.defaultWarehouseStock }
        ]
      };
      return { ...prev, variants };
    });
  }
  deleteStockLine(variantIndex: number, stockIndex: number): void {
    const targetVariant = this.productModel().variants[variantIndex];

    // If editing an EXISTING variant, initial stock is historical and should not be modified
    if (this.isEditMode() && targetVariant.id && this.existingVariantIds().includes(targetVariant.id)) {
      this.errors.set(['Initial stock for existing variants cannot be modified or deleted.']);
      return;
    }

    this.errors.set([]);

    this.productModel.update(prev => {
      const variants = [...prev.variants];
      const currentStock = variants[variantIndex].initialStock;

      const updatedStock = currentStock.length === 1
        ? [{ ...this.defaultWarehouseStock }]
        : currentStock.filter((_, i) => i !== stockIndex);

      variants[variantIndex] = { ...variants[variantIndex], initialStock: updatedStock };
      return { ...prev, variants };
    });
  }
  //Create method
  createProduct(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.productForm().invalid()) {
      this.productForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.productForm().value() as ProductDTO;
    const formdata = this.formservice.buildFormData(formvalue);



    //for update and create
    const url = `Products`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<ProductDTO>(url, formvalue.id?.toString() ?? '', formdata)
      : this.dataService.create<ProductDTO>(url, formdata);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'productlist']);
          this.base.globalMessage('success', 'Product Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Product Added Successfully', false);
        //Reset the form
        this.productForm().reset({ ...this.defaultProduct, variants: [{ ...this.defaultVariant }] });
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        if (err.error.errors) {
          this.backendErrors.set(err.error.errors);
        } else {
          this.base.handleError(err, err.error.message);
        }
        this.submit.set(false);
      }
    });

  }

  loadFormLookups(): void {
    this.dataService.getAll<ProductFormLookups>('Dropdowns/ProductFormLookups')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.productCategories.set(res.categories);
          this.brands.set(res.brands);
          this.attributeDefinitions.set(res.attributeDefinitions);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadProduct(id: string) {
    this.dataService.getById<ProductDTO>('Products', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.productModel.set(data);
        //Map variant ids
        const vIds = data.variants.map(v => v.id).filter((vId): vId is string => !!vId);
        this.existingVariantIds.set(vIds);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'productlist']);
      }
    });
  }
  onWarehouseChange(variantIndex: number, stockIndex: number, warehouseId: number | null): void {

    this.updateVariantStockField(variantIndex, stockIndex, 'warehouseId', warehouseId);

    // Location from previous warehouse is invalid
    this.updateVariantStockField(variantIndex, stockIndex, 'warehouseLocationId', null);

    if (warehouseId == null) {
      return;
    }

    // Use cached locations
    if (this.warehouseLocations()[warehouseId]) {
      return;
    }

    this.loadWarehouseLocations(warehouseId);
  }

  loadWarehouseLocations(warehouseId: number): void {

    this.dataService.getAllSimple<AutoDropdown>(`Dropdowns/LocationsByWarehouse/${warehouseId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locations) => {
          this.warehouseLocations.update(current => ({ ...current, [warehouseId]: locations }));
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  getWarehouseLocations(warehouseId: number | null): AutoDropdown[] {
    if (warehouseId == null) {
      return [];
    }

    return this.warehouseLocations()[warehouseId] ?? [];
  }
  onVariantImageSelected(event: Event, variantIndex: number) {
    const preview = signal(this.variantImagePreviews()[variantIndex] ?? '');
    const file = this.formservice.onImageSelected(event, preview);
    if (!file) return;
    this.variantImagePreviews.update(prev => ({ ...prev, [variantIndex]: preview() }));
    this.updateLineField(variantIndex, 'image', file);
  }
  removeVariantImage(variantIndex: number) {
    const preview = signal(this.variantImagePreviews()[variantIndex] ?? '');
    this.formservice.removeImage(preview, `variantImage_${variantIndex}`);
    this.variantImagePreviews.update(prev => ({ ...prev, [variantIndex]: '' }));
    this.updateLineField(variantIndex, 'image', undefined);
    if (this.isEditMode()) {
      this.updateLineField(variantIndex, 'removedImage', true);
    }
  }
}
