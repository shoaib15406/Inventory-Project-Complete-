import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-inventory-overview',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatBadgeModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './inventory-overview.html',
  styleUrl: './inventory-overview.scss'
})
export class InventoryOverviewComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(true);
  lowStockProducts = signal<Product[]>([]);
  outOfStockProducts = signal<Product[]>([]);
  
  totalProducts = signal(0);
  totalValue = signal(0);
  lowStockCount = signal(0);
  outOfStockCount = signal(0);

  displayedColumns: string[] = ['name', 'sku', 'category', 'currentStock', 'minLevel', 'status'];

  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadInventoryData();
  }

  loadInventoryData() {
    this.loading.set(true);
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.calculateInventoryStats(products);
        this.filterStockLevels(products);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading inventory data:', error);
        this.loading.set(false);
      }
    });
  }

  calculateInventoryStats(products: Product[]) {
    this.totalProducts.set(products.length);

    const totalValue = products.reduce((sum, product) => 
      sum + (product.currentStock * product.costPrice), 0);
    this.totalValue.set(totalValue);

    const lowStock = products.filter(p => 
      p.currentStock > 0 && p.currentStock <= p.minStockLevel);
    this.lowStockCount.set(lowStock.length);

    const outOfStock = products.filter(p => p.currentStock === 0);
    this.outOfStockCount.set(outOfStock.length);
  }

  filterStockLevels(products: Product[]) {
    const lowStock = products.filter(p => 
      p.currentStock > 0 && p.currentStock <= p.minStockLevel);
    this.lowStockProducts.set(lowStock);

    const outOfStock = products.filter(p => p.currentStock === 0);
    this.outOfStockProducts.set(outOfStock);
  }

  getStockStatus(product: Product): string {
    if (product.currentStock === 0) return 'out-of-stock';
    if (product.currentStock <= product.minStockLevel) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(product: Product): string {
    if (product.currentStock === 0) return 'Out of Stock';
    if (product.currentStock <= product.minStockLevel) return 'Low Stock';
    return 'In Stock';
  }

  onAdjustStock(product: Product) {
    this.snackBar.open('Stock adjustment functionality coming soon!', 'Close', { duration: 3000 });
  }

  onReorder(product: Product) {
    this.snackBar.open('Reorder functionality coming soon!', 'Close', { duration: 3000 });
  }
}