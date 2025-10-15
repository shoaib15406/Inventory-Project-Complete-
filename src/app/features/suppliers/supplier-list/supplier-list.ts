import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierListComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  displayedColumns: string[] = ['name', 'contact', 'email', 'phone', 'status', 'actions'];

  constructor(
    private supplierService: SupplierService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading.set(true);
    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.loading.set(false);
      }
    });
  }

  onAddSupplier() {
    this.snackBar.open('Add Supplier functionality coming soon!', 'Close', { duration: 3000 });
  }

  onViewSupplier(supplierId: string) {
    this.snackBar.open('View Supplier functionality coming soon!', 'Close', { duration: 3000 });
  }

  onEditSupplier(supplierId: string) {
    this.snackBar.open('Edit Supplier functionality coming soon!', 'Close', { duration: 3000 });
  }

  onDeleteSupplier(supplier: Supplier) {
    this.snackBar.open('Delete Supplier functionality coming soon!', 'Close', { duration: 3000 });
  }
}