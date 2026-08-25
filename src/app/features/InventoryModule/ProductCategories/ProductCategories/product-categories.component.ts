import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { ProductCategoriesDropdownDto, ProductCategoriesDto, ProductCategoriesGetDto } from '../../../../Models/Inventory/ProductCategories.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-product-categories',
  imports: [RouterLink, AutoCompleteModule, FieldErrorSComponent, FormField, FormsModule, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css',
})
export class ProductCategoriesComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  productCategoriesList = signal<ProductCategoriesDropdownDto[]>([]);
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  //for Global Search
  inventoryAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/AssestsAccounts');
  salesAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/RevenueAccounts');
  costOfGoodsSoldAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/ExpenseAccounts');

  inventoryAccountList = this.inventoryAccountSearch.result;
  salesAccountList = this.salesAccountSearch.result;
  costOfGoodsSoldAccountList = this.costOfGoodsSoldAccountSearch.result;


  ngOnInit() {
    this.GetDropDownList();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadProductCategories(id);
        }
      });
  }
  //Get DropDown List
  GetDropDownList() {
    this.dataService.getAllSimple<ProductCategoriesDropdownDto>('DropDowns/ProductCategoriesList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const formatted = res.map(acc => ({ ...acc, displayName: `${' - '.repeat(acc.level)}${acc.name}` }));
        this.productCategoriesList.set(formatted);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  private readonly initialModel: ProductCategoriesDto = {
    name: '',
    code: '',
    description: '',
    isActive: true,
    parentCategoryId: null,
    inventoryAccountId: null,
    salesAccountId: null,
    costOfGoodsSoldAccountId: null,
  };

  //Signal Model For FormData
  productCategoriesModel = signal<ProductCategoriesDto>({ ...this.initialModel });


  // Signal form with validation schema
  productCategoriesForm = form(this.productCategoriesModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.code, { message: 'Code is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductCategoriesDto>(field: K, value: ProductCategoriesDto[K]) {
    this.productCategoriesModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Product Categories
  createProductCategories(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.productCategoriesForm().invalid()) {
      this.productCategoriesForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.productCategoriesForm().value() as ProductCategoriesDto;

    //for update and create
    const url = `ProductCategories`;
    const request$ = this.isEditMode() ?
      this.dataService.editResponse<ProductCategoriesDto, ProductCategoriesDropdownDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.createResponse<ProductCategoriesDto, ProductCategoriesDropdownDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newProductCategories) => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'productcategorieslist']);
          this.base.globalMessage('success', 'Product Categories Updated Successfully', false);
          return;
        }


        this.base.globalMessage('success', 'Product Categories Added Successfully', false);

        //Append the list without hitting db for Groups
        this.productCategoriesList.update(list => {

          // 1. ROOT CATEGORY
          if (newProductCategories.parentCategoryId == null) {

            const formatted = { ...newProductCategories, level: 0, displayName: newProductCategories.name };
            return [...list, formatted];
          }

          // 2. FIND PARENT
          const parentIndex = list.findIndex(x => x.id === newProductCategories.parentCategoryId);

          if (parentIndex === -1) {
            return list;
          }

          // 3. CALCULATE LEVEL
          const parentLevel = list[parentIndex].level;
          const newLevel = parentLevel + 1;
          // 4. FORMAT NEW CATEGORY
          const formatted = {
            ...newProductCategories,
            level: newLevel,
            displayName:
              `${' - '.repeat(newLevel)}${newProductCategories.name}`
          };

          let insertAt = parentIndex + 1;

          // Skip all descendants of the parent
          while (
            insertAt < list.length &&
            list[insertAt].level > parentLevel
          ) {
            insertAt++;
          }

          // 5. INSERT
          const updated = [...list];

          updated.splice(insertAt, 0, formatted);

          return updated;
        });

        this.productCategoriesForm().reset(this.initialModel);
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

  loadProductCategories(id: string) {
    this.dataService.getById<ProductCategoriesGetDto>('ProductCategories', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        // Bind selected Account values with AutoComplete
        data.selectedInventoryAccount = data.inventoryAccountId ? {
          id: data.inventoryAccountId,
          name: data.inventoryAccountName ?? ''
        } : undefined;

        data.selectedSalesAccount = data.salesAccountId ? {
          id: data.salesAccountId,
          name: data.salesAccountName
        } : undefined;

        data.selectedCostOfGoodsSoldAccount = data.costOfGoodsSoldAccountId ? {
          id: data.costOfGoodsSoldAccountId,
          name: data.costOfGoodsSoldAccountName
        } : undefined;

        // Initialize Global Search / AutoComplete values
        this.inventoryAccountSearch.setInitialValue(
          data.selectedInventoryAccount ? [data.selectedInventoryAccount] : []
        );

        this.salesAccountSearch.setInitialValue(
          data.selectedSalesAccount ? [data.selectedSalesAccount] : []
        );

        this.costOfGoodsSoldAccountSearch.setInitialValue(
          data.selectedCostOfGoodsSoldAccount
            ? [data.selectedCostOfGoodsSoldAccount]
            : []
        );
        this.productCategoriesModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'productcategorieslist']);
      }
    });
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
}
