import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../services/data-layer.service';
import { BaseApiService } from '../../../services/base-api.service';
import { PaginationService } from '../../../services/pagination.service';
import { AccountMappingBulkSaveDTO, AccountMappingDto, AccountMappingKey } from '../../../Models/ClientSetting.model';
import { AutoDropdown } from '../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { form, required } from '@angular/forms/signals';

@Component({
  selector: 'app-account-mapping',
  imports: [AutoCompleteModule, FloatLabelModule, FormsModule, CommonModule],
  templateUrl: './account-mapping.component.html',
  styleUrl: './account-mapping.component.css',
})
export class AccountMappingComponent {
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  AccountMappingKey = AccountMappingKey;

  // AutoComplete dropdown endpoints
  assetAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/AssestsAccounts');
  liabilityAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/LiabilityAccounts');
  revenueAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/RevenueAccounts');
  expenseAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/ExpenseAccounts');
  equityAccountSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/EquityAccounts');

  // Selected AutoComplete objects for PrimeNG component display
  selectedAccounts: Record<number, AutoDropdown | null> = {
    [AccountMappingKey.InventoryDefault]: null,
    [AccountMappingKey.GRNI]: null,
    [AccountMappingKey.Sales]: null,
    [AccountMappingKey.COGS]: null,
    [AccountMappingKey.OpeningStockOffset]: null,
    [AccountMappingKey.InputTaxAccount]: null,
    [AccountMappingKey.OutputTaxAccount]: null,
  };

  // Signal Model Initial State
  private readonly initialModel: Record<number, AccountMappingDto> = {
    [AccountMappingKey.InventoryDefault]: { key: AccountMappingKey.InventoryDefault, chartOfAccountId: 0 },
    [AccountMappingKey.GRNI]: { key: AccountMappingKey.GRNI, chartOfAccountId: 0 },
    [AccountMappingKey.Sales]: { key: AccountMappingKey.Sales, chartOfAccountId: 0 },
    [AccountMappingKey.COGS]: { key: AccountMappingKey.COGS, chartOfAccountId: 0 },
    [AccountMappingKey.OpeningStockOffset]: { key: AccountMappingKey.OpeningStockOffset, chartOfAccountId: 0 },
    [AccountMappingKey.InputTaxAccount]: { key: AccountMappingKey.InputTaxAccount, chartOfAccountId: 0 },
    [AccountMappingKey.OutputTaxAccount]: { key: AccountMappingKey.OutputTaxAccount, chartOfAccountId: 0 },
  };

  mappingsModel = signal<Record<number, AccountMappingDto>>({ ...this.initialModel });

  // Signal Form Definition with Schema Rules
  accountMappingsForm = form(this.mappingsModel, (schemaPath) => {
    // Example: Require essential mappings
    required(schemaPath[AccountMappingKey.InventoryDefault].chartOfAccountId, { message: 'Inventory Account is required' });
    required(schemaPath[AccountMappingKey.Sales].chartOfAccountId, { message: 'Sales Account is required' });
    required(schemaPath[AccountMappingKey.COGS].chartOfAccountId, { message: 'COGS Account is required' });
  });

  ngOnInit() {
    this.loadAccountMappings();
  }

  loadAccountMappings() {
    this.dataService.getAllSimple<AccountMappingDto>('ClientSetting/account-mappings')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          data.forEach(item => {
            if (item.key) {
              this.mappingsModel.update(prev => ({
                ...prev,
                [item.key]: { ...item }
              }));

              if (item.chartOfAccountId && item.chartOfAccountName) {
                this.selectedAccounts[item.key] = {
                  id: item.chartOfAccountId,
                  name: item.chartOfAccountName
                };
              }
            }
          });
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  onAccountSelect(key: AccountMappingKey, selected: AutoDropdown | null) {
    this.selectedAccounts[key] = selected;
    this.mappingsModel.update(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        key: key,
        chartOfAccountId: selected?.id ? Number(selected.id) : 0,
        chartOfAccountName: selected?.name ?? ''
      }
    }));
  }

  SearchDropDown(event: { query: string }, searchtermSignal: any) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermSignal.set(search);
    }
  }

  saveAccountMappings(event: Event) {
    event.preventDefault();

    if (this.submit()) {
      return;
    }

    this.submit.set(true);
    this.formSubmitted.set(true);

    // Form Validation Check
    if (this.accountMappingsForm().invalid()) {
      this.accountMappingsForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});

    const mappingsList = Object.values(this.mappingsModel()).filter(x => x.chartOfAccountId > 0);

    const payload: AccountMappingBulkSaveDTO = {
      mappings: mappingsList
    };

    this.dataService.create<AccountMappingBulkSaveDTO>('ClientSetting/account-mappings', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.base.globalMessage('success', 'Account Mappings Updated Successfully', false);
          this.submit.set(false);
          this.formSubmitted.set(false);
        },
        error: (err) => {
          if (err.error?.errors) {
            this.backendErrors.set(err.error.errors);
          } else {
            this.base.handleError(err, err.error?.message);
          }
          this.submit.set(false);
        }
      });
  }
}
