import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SupplierService, PaginationParams } from '../../../core/services/supplier.service';
import { Supplier, SupplierFilters, SupplierSortOptions } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data signals
  suppliers = signal<Supplier[]>([]);
  totalSuppliers = signal<number>(0);
  loading = signal<boolean>(true);
  analytics = signal<any>(null);

  // UI State
  viewMode: 'table' | 'grid' = 'table';
  searchQuery = '';
  selectedSuppliers: Supplier[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 25;

  // Filtering
  selectedFilters: SupplierFilters = {
    status: [],
    type: [],
    category: [],
    priority: []
  };

  // Sorting
  currentSort: SupplierSortOptions = {
    field: 'name',
    direction: 'asc'
  };

  // Table configuration
  displayedColumns: string[] = ['select', 'supplier', 'contact', 'type', 'status', 'performance', 'actions'];

  // Available options
  supplierTypes: readonly { value: string; label: string; }[] = [];
  availableCategories: readonly string[] = [];

  // Computed properties
  hasActiveFilters = computed(() => {
    return this.searchQuery !== '' ||
           (this.selectedFilters.status && this.selectedFilters.status.length > 0) ||
           (this.selectedFilters.type && this.selectedFilters.type.length > 0) ||
           (this.selectedFilters.category && this.selectedFilters.category.length > 0) ||
           (this.selectedFilters.priority && this.selectedFilters.priority.length > 0);
  });

  constructor(
    private supplierService: SupplierService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.setupSearch();
  }

  ngOnInit() {
    this.supplierTypes = this.supplierService.supplierTypes;
    this.availableCategories = this.supplierService.categories;
    this.loadSuppliers();
    this.loadAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadSuppliers();
    });
  }

  loadSuppliers() {
    this.loading.set(true);

    const filters: SupplierFilters = {
      ...this.selectedFilters,
      search: this.searchQuery || undefined
    };

    const pagination: PaginationParams = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.supplierService.getSuppliersWithPagination(pagination, filters, this.currentSort).subscribe({
      next: (response) => {
        this.suppliers.set(response.data);
        this.totalSuppliers.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.showError('Failed to load suppliers');
        this.loading.set(false);
      }
    });
  }

  loadAnalytics() {
    this.supplierService.getSupplierAnalytics().subscribe({
      next: (analytics) => {
        this.analytics.set(analytics);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
      }
    });
  }

  // Search and Filtering
  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearchChange();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadSuppliers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedFilters = {
      status: [],
      type: [],
      category: [],
      priority: []
    };
    this.currentPage = 1;
    this.loadSuppliers();
  }

  // Sorting
  onSort(sort: Sort) {
    this.currentSort = {
      field: sort.active as SupplierSortOptions['field'],
      direction: sort.direction as SupplierSortOptions['direction']
    };
    this.currentPage = 1;
    this.loadSuppliers();
  }

  // Pagination
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadSuppliers();
  }

  // View Mode
  onViewModeChange() {
    // Adjust page size for grid view
    if (this.viewMode === 'grid') {
      this.pageSize = 12;
    } else {
      this.pageSize = 25;
    }
    this.currentPage = 1;
    this.loadSuppliers();
  }

  // Selection Management
  toggleSelection(supplier: Supplier, event: any) {
    event.stopPropagation();
    
    if (this.isSelected(supplier)) {
      this.selectedSuppliers = this.selectedSuppliers.filter(s => s.id !== supplier.id);
    } else {
      this.selectedSuppliers.push(supplier);
    }
  }

  toggleAllSelection(event: any) {
    if (event.checked) {
      this.selectedSuppliers = [...this.suppliers()];
    } else {
      this.selectedSuppliers = [];
    }
  }

  isSelected(supplier: Supplier): boolean {
    return this.selectedSuppliers.some(s => s.id === supplier.id);
  }

  isAllSelected(): boolean {
    return this.suppliers().length > 0 && this.selectedSuppliers.length === this.suppliers().length;
  }

  isPartialSelection(): boolean {
    return this.selectedSuppliers.length > 0 && this.selectedSuppliers.length < this.suppliers().length;
  }

  // Row Actions
  onRowClick(supplier: Supplier) {
    this.onViewSupplier(supplier.id);
  }

  onAddSupplier() {
    this.router.navigate(['/suppliers/add']);
  }

  onViewSupplier(supplierId: string) {
    this.router.navigate(['/suppliers', supplierId]);
  }

  onEditSupplier(supplierId: string) {
    this.router.navigate(['/suppliers', supplierId, 'edit']);
  }

  onDeleteSupplier(supplier: Supplier) {
    const message = `Are you sure you want to delete ${supplier.name}? This action cannot be undone.`;
    
    if (confirm(message)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.showSuccess(`${supplier.name} has been deleted successfully`);
          this.loadSuppliers();
          this.loadAnalytics();
        },
        error: (error) => {
          this.showError(`Failed to delete ${supplier.name}: ${error.message}`);
        }
      });
    }
  }

  // Bulk Actions
  bulkActivate() {
    const ids = this.selectedSuppliers.map(s => s.id);
    // Implementation for bulk activate
    this.showInfo('Bulk activate functionality will be implemented');
  }

  bulkDeactivate() {
    const ids = this.selectedSuppliers.map(s => s.id);
    // Implementation for bulk deactivate
    this.showInfo('Bulk deactivate functionality will be implemented');
  }

  bulkDelete() {
    const count = this.selectedSuppliers.length;
    const message = `Are you sure you want to delete ${count} suppliers? This action cannot be undone.`;
    
    if (confirm(message)) {
      const ids = this.selectedSuppliers.map(s => s.id);
      this.supplierService.bulkDeleteSuppliers(ids).subscribe({
        next: () => {
          this.showSuccess(`${count} suppliers deleted successfully`);
          this.selectedSuppliers = [];
          this.loadSuppliers();
          this.loadAnalytics();
        },
        error: (error) => {
          this.showError(`Failed to delete suppliers: ${error.message}`);
        }
      });
    }
  }

  // Individual Supplier Actions
  activateSupplier(id: string) {
    this.supplierService.activateSupplier(id).subscribe({
      next: (supplier) => {
        this.showSuccess(`${supplier.name} has been activated`);
        this.loadSuppliers();
      },
      error: (error) => {
        this.showError(`Failed to activate supplier: ${error.message}`);
      }
    });
  }

  deactivateSupplier(id: string) {
    this.supplierService.deactivateSupplier(id).subscribe({
      next: (supplier) => {
        this.showSuccess(`${supplier.name} has been deactivated`);
        this.loadSuppliers();
      },
      error: (error) => {
        this.showError(`Failed to deactivate supplier: ${error.message}`);
      }
    });
  }

  duplicateSupplier(supplier: Supplier) {
    // Navigate to add supplier with pre-filled data
    this.router.navigate(['/suppliers/add'], { 
      queryParams: { duplicate: supplier.id } 
    });
  }

  // Export
  exportSuppliers() {
    this.supplierService.exportSuppliers('csv').subscribe({
      next: (filename) => {
        this.showSuccess(`Suppliers exported successfully: ${filename}`);
      },
      error: (error) => {
        this.showError(`Export failed: ${error.message}`);
      }
    });
  }

  // Helper Methods
  trackBySupplier(index: number, supplier: Supplier): string {
    return supplier.id;
  }

  getTypeLabel(type: string): string {
    const typeObj = this.supplierTypes.find(t => t.value === type);
    return typeObj?.label || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Active',
      'inactive': 'Inactive',
      'pending-approval': 'Pending',
      'suspended': 'Suspended'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'active': 'check_circle',
      'inactive': 'pause_circle',
      'pending-approval': 'schedule',
      'suspended': 'block'
    };
    return icons[status] || 'help';
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  // Notifications
  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }
}