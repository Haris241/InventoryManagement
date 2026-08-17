import { Component, computed, DestroyRef, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { DataLayerService } from '../../../services/data-layer.service';
import { BaseApiService } from '../../../services/base-api.service';
import { AccountDashBoardData, AccountDashboardFilterType, AccountsDashBoardSearch } from '../../../Models/Accouting/AccountDashboard.model';
import { form } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { enumToOptions } from '../../../shared/Utility';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import {
  Chart,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Tree-shakeable registration — only what we use
Chart.register(
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-account-dashboard',
  imports: [FloatLabelModule, SelectModule, FormsModule, DecimalPipe],
  templateUrl: './account-dashboard.component.html',
  styleUrl: './account-dashboard.component.css',
})
export class AccountDashboardComponent implements OnDestroy {
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  dashboardData = signal<AccountDashBoardData | null>(null);
  submit = signal<boolean>(true);
  dashboardFilter = signal(enumToOptions(AccountDashboardFilterType, true));

  // Canvas references
  trendCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendChart');
  breakdownCanvas = viewChild<ElementRef<HTMLCanvasElement>>('breakdownChart');

  // Chart instances
  private trendChart: Chart | null = null;
  private breakdownChart: Chart | null = null;

  // Computed: summary cards array
  summaryCards = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    return [
      { title: 'Total Cash', icon: 'payments', amount: data.totalCash.amount, balanceType: data.totalCash.balanceType, accent: 'accent-emerald' },
      { title: 'Total Bank', icon: 'account_balance', amount: data.totalBank.amount, balanceType: data.totalBank.balanceType, accent: 'accent-blue' },
      { title: 'Total Revenue', icon: 'trending_up', amount: data.totalRevenue.amount, balanceType: data.totalRevenue.balanceType, accent: 'accent-violet' },
      { title: 'Total Expenses', icon: 'receipt_long', amount: data.totalExpenses.amount, balanceType: data.totalExpenses.balanceType, accent: 'accent-rose' },
    ];
  });

  // Computed: is profit or loss
  isProfit = computed(() => this.dashboardData()?.netProfit.balanceType === 'Cr');

  constructor() {
    // Effect: rebuild charts whenever dashboardData changes
    effect(() => {
      const data = this.dashboardData();
      const trendEl = this.trendCanvas();
      const breakdownEl = this.breakdownCanvas();

      if (!data || !trendEl || !breakdownEl) return;

      this.buildTrendChart(trendEl.nativeElement, data);
      this.buildBreakdownChart(breakdownEl.nativeElement, data);
    });
  }


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

    this.submit.set(true);

    this.dataService.getAllPost<AccountDashBoardData, AccountsDashBoardSearch>('Dashboard/GetAccountsDashboardData', formValue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.submit.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
        this.submit.set(false);
      }
    });
  }

  //Search Method
  OnSearch(event: Event) {
    this.loadDasboardData();
  }

  //Refresh Method
  refreshData() {
    this.updateField("refresh", true);
    this.loadDasboardData();
  }

  // ── Chart Builders ──

  private buildTrendChart(canvas: HTMLCanvasElement, data: AccountDashBoardData): void {
    // Destroy previous instance
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }

    const trend = data.revenueExpenseTrend || [];
    const labels = trend.map(p => this.formatPeriod(p.period));
    const revenueData = trend.map(p => p.revenue);
    const expenseData = trend.map(p => p.expense);

    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#8b5cf6',
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Expense',
            data: expenseData,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f43f5e',
            tension: 0.35,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            labels: {
              color: '#a1a1aa',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              font: { size: 12 },
            }
          },
          tooltip: {
            backgroundColor: '#1e1e22',
            titleColor: '#fff',
            bodyColor: '#a1a1aa',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
          }
        },
        scales: {
          x: {
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: { color: '#71717a', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          }
        }
      }
    });
  }

  private buildBreakdownChart(canvas: HTMLCanvasElement, data: AccountDashBoardData): void {
    // Destroy previous instance
    if (this.breakdownChart) {
      this.breakdownChart.destroy();
      this.breakdownChart = null;
    }

    const breakdown = data.expenseBreakdown || [];
    const labels = breakdown.map(b => b.categoryName);
    const amounts = breakdown.map(b => b.amount);

    const palette = [
      '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e',
      '#6366f1', '#14b8a6', '#e879f9', '#fb923c', '#38bdf8',
    ];

    this.breakdownChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: amounts,
          backgroundColor: palette.slice(0, labels.length),
          borderColor: '#17171a',
          borderWidth: 2,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a1a1aa',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
              font: { size: 11 },
            }
          },
          tooltip: {
            backgroundColor: '#1e1e22',
            titleColor: '#fff',
            bodyColor: '#a1a1aa',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
          }
        }
      }
    });
  }

  private formatPeriod(date: Date): string {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.breakdownChart?.destroy();
  }
}
