import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LineController,
  PointElement,
  PieController,
  ArcElement,
  DoughnutController,
  RadarController,
  RadialLinearScale
} from 'chart.js';

import { DashboardService } from '../../../core/services/dashboard.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
  DoughnutController,
  RadarController,
  RadialLinearScale
);

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private dashboardService = inject(DashboardService);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);

  // Signals for state management
  private _loading = signal(false);
  private _inventoryData = signal<any[]>([]);
  private _salesData = signal<any[]>([]);
  private _supplierData = signal<any[]>([]);
  private _stockMovementData = signal<any[]>([]);

  // Computed properties
  loading = computed(() => this._loading());
  inventoryData = computed(() => this._inventoryData());
  salesData = computed(() => this._salesData());
  supplierData = computed(() => this._supplierData());
  stockMovementData = computed(() => this._stockMovementData());

  // Form for date range selection
  dateRangeForm!: FormGroup;

  // Chart configurations
  // Inventory Overview Chart
  inventoryChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  inventoryChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Inventory Status Overview' }
    }
  };

  // Stock Movement Trend Chart
  stockTrendChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Stock In',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      },
      {
        label: 'Stock Out',
        data: [],
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      }
    ]
  };

  stockTrendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Stock Movement Trends (Last 12 Months)' }
    }
  };

  // Top Products Chart
  topProductsChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Quantity Sold',
      data: [],
      backgroundColor: [
        '#3F51B5', '#9C27B0', '#2196F3', '#00BCD4', '#009688',
        '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'
      ]
    }]
  };

  topProductsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 10 Best Selling Products' }
    },
    scales: {
      x: { beginAtZero: true }
    }
  };

  // Category Distribution Chart
  categoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB'
      ]
    }]
  };

  categoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Products by Category' }
    }
  };

  // Supplier Performance Chart
  supplierChartData: ChartConfiguration<'radar'>['data'] = {
    labels: ['Delivery Time', 'Quality', 'Price', 'Reliability', 'Communication'],
    datasets: []
  };

  supplierChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Top Suppliers Performance Comparison' }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5
      }
    }
  };

  // Revenue Trend Chart
  revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Revenue',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Cost',
        data: [],
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Revenue vs Cost Analysis' }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  ngOnInit() {
    this.initializeDateForm();
    this.loadAllReportsData();
  }

  private initializeDateForm(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Default to last 12 months

    this.dateRangeForm = this.fb.group({
      dateRange: this.fb.group({
        start: [startDate],
        end: [endDate]
      }),
      reportType: ['overview']
    });

    // Watch for date changes with validation
    this.dateRangeForm.valueChanges.subscribe((value) => {
      if (value.dateRange?.start && value.dateRange?.end) {
        // Validate date range (end date should be after start date)
        const startDate = new Date(value.dateRange.start);
        const endDate = new Date(value.dateRange.end);
        
        if (endDate > startDate) {
          this.loadAllReportsData();
        } else {
          console.warn('Invalid date range: End date must be after start date');
        }
      }
    });
  }

  private loadAllReportsData(): void {
    this._loading.set(true);
    
    Promise.all([
      this.loadInventoryOverview(),
      this.loadStockMovementTrends(),
      this.loadTopProducts(),
      this.loadCategoryDistribution(),
      this.loadSupplierPerformance(),
      this.loadRevenueAnalysis()
    ]).then(() => {
      this._loading.set(false);
      // Force change detection to update charts
      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error loading reports data:', error);
      this._loading.set(false);
    });
  }

  private async loadInventoryOverview(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate API call - replace with actual service call
      setTimeout(() => {
        const data = [150, 25, 8]; // In Stock, Low Stock, Out of Stock
        
        // Create new data object to trigger change detection
        this.inventoryChartData = {
          ...this.inventoryChartData,
          datasets: [{
            ...this.inventoryChartData.datasets[0],
            data: [...data]
          }]
        };
        resolve();
      }, 500);
    });
  }

  private async loadStockMovementTrends(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const stockIn = [120, 135, 110, 145, 160, 140, 155, 165, 145, 170, 180, 160];
        const stockOut = [100, 115, 125, 130, 140, 135, 145, 150, 155, 160, 165, 170];
        
        // Create new data object to trigger change detection
        this.stockTrendChartData = {
          ...this.stockTrendChartData,
          labels: [...months],
          datasets: [
            {
              ...this.stockTrendChartData.datasets[0],
              data: [...stockIn]
            },
            {
              ...this.stockTrendChartData.datasets[1],
              data: [...stockOut]
            }
          ]
        };
        resolve();
      }, 600);
    });
  }

  private async loadTopProducts(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const products = ['Laptop Pro', 'Wireless Mouse', 'USB Drive', 'Keyboard', 'Monitor', 'Webcam', 'Headphones', 'Tablet', 'Phone Case', 'Charger'];
        const sales = [45, 38, 35, 32, 28, 25, 22, 20, 18, 15];
        
        // Create new data object to trigger change detection
        this.topProductsChartData = {
          ...this.topProductsChartData,
          labels: [...products],
          datasets: [{
            ...this.topProductsChartData.datasets[0],
            data: [...sales]
          }]
        };
        this.cdr.markForCheck();
        resolve();
      }, 700);
    });
  }

  private async loadCategoryDistribution(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const categories = ['Electronics', 'Accessories', 'Software', 'Hardware', 'Peripherals'];
        const counts = [45, 30, 15, 25, 20];
        
        // Create new data object to trigger change detection
        this.categoryChartData = {
          ...this.categoryChartData,
          labels: [...categories],
          datasets: [{
            ...this.categoryChartData.datasets[0],
            data: [...counts]
          }]
        };
        resolve();
      }, 800);
    });
  }

  private async loadSupplierPerformance(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suppliers = [
          { name: 'TechCorp', data: [4.5, 4.8, 3.9, 4.6, 4.2], color: '#FF6384' },
          { name: 'GlobalSupply', data: [4.2, 4.5, 4.3, 4.4, 4.7], color: '#36A2EB' },
          { name: 'InnovateTech', data: [4.7, 4.3, 4.1, 4.8, 4.5], color: '#FFCE56' }
        ];
        
        // Create new data object to trigger change detection
        this.supplierChartData = {
          ...this.supplierChartData,
          datasets: suppliers.map(supplier => ({
            label: supplier.name,
            data: [...supplier.data],
            borderColor: supplier.color,
            backgroundColor: supplier.color + '40',
            pointBackgroundColor: supplier.color,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: supplier.color
          }))
        };
        resolve();
      }, 900);
    });
  }

  private async loadRevenueAnalysis(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenue = [25000, 28000, 26500, 31000, 29500, 33000, 35500, 34000, 37000, 39500, 42000, 45000];
        const cost = [18000, 20000, 19500, 22500, 21000, 24000, 26000, 25500, 28000, 29500, 31000, 33500];
        
        // Create new data object to trigger change detection
        this.revenueChartData = {
          ...this.revenueChartData,
          labels: [...months],
          datasets: [
            {
              ...this.revenueChartData.datasets[0],
              data: [...revenue]
            },
            {
              ...this.revenueChartData.datasets[1],
              data: [...cost]
            }
          ]
        };
        this.cdr.markForCheck();
        resolve();
      }, 1000);
    });
  }

  generateReport(type: string) {
    this._loading.set(true);
    
    // Simulate report generation
    setTimeout(() => {
      console.log(`Generating ${type} report...`);
      // Here you would typically call your service to generate/download the report
      this._loading.set(false);
    }, 2000);
  }

  exportChart(chartType: string) {
    console.log(`Exporting ${chartType} chart...`);
    // Implementation for chart export functionality
  }

  refreshData() {
    const dateRange = this.dateRangeForm.get('dateRange')?.value;
    console.log('Refreshing all chart data with date range:', dateRange);
    this.loadAllReportsData();
  }

  // Method to manually update chart data (for debugging)
  updateChartData() {
    // Force all charts to use new data objects
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Charts updated with new data');
      console.log('Date range:', this.dateRangeForm.get('dateRange')?.value);
      console.log('Bar chart data:', this.topProductsChartData);
      console.log('Line chart data:', this.revenueChartData);
    }, 100);
  }

  // Quick date range setters
  setQuickDateRange(months: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    this.dateRangeForm.patchValue({
      dateRange: {
        start: startDate,
        end: endDate
      }
    });
  }

  // Get formatted date range string for display
  getDateRangeText(): string {
    const dateRange = this.dateRangeForm.get('dateRange')?.value;
    if (dateRange?.start && dateRange?.end) {
      const start = new Date(dateRange.start).toLocaleDateString();
      const end = new Date(dateRange.end).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return 'Select date range';
  }
}