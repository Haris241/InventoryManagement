import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../services/data-layer.service';
import { BaseApiService } from '../../../services/base-api.service';
import { AccountDashBoardData, AccountsDashBoardSearch } from '../../../Models/Accouting/AccountDashboard.model';
import { form } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account-dashboard',
  imports: [],
  templateUrl: './account-dashboard.component.html',
  styleUrl: './account-dashboard.component.css',
})
export class AccountDashboardComponent {
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  dashboardData = signal<AccountDashBoardData | null>(null);
  formSubmitted = signal<boolean>(false);


  ngOnInit(): void {
    this.loadDasboardData();
  }
  //Model For FormData
  private readonly initialModel: AccountsDashBoardSearch = {
    refresh: false,
    filterType: null,

  };
  //Signal Model For FormData
  dashboardModel = signal<AccountsDashBoardSearch>({ ...this.initialModel });

  // Signal form with validation schema
  dashboardForm = form(this.dashboardModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof AccountsDashBoardSearch>(field: K, value: AccountsDashBoardSearch[K]) {
    this.dashboardModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  loadDasboardData() {
    //Making Api Call
    const formValue = this.dashboardForm().value();

    this.formSubmitted.set(true);

    this.dataService.getAllPost<AccountDashBoardData, AccountsDashBoardSearch>('Dashboard/AccountDashboard', formValue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
        this.formSubmitted.set(false);
      }
    });
  }
}
