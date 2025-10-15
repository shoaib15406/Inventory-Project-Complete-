import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-view-product',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './view-product.html',
  styleUrl: './view-product.scss'
})
export class ViewProductComponent implements OnInit {
  product = signal<Product | null>(null);
  loading = signal(true);
  productId = signal<string>('');

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.loadProduct(id);
    } else {
      this.snackBar.open('Product ID is required', 'Close', { duration: 3000 });
      this.router.navigate(['/products']);
    }
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          this.product.set(product);
        } else {
          this.snackBar.open('Product not found', 'Close', { duration: 3000 });
          this.router.navigate(['/products']);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Failed to load product', 'Close', { duration: 5000 });
        console.error('Error loading product:', error);
        this.loading.set(false);
        this.router.navigate(['/products']);
      }
    });
  }

  onEdit() {
    this.router.navigate(['/products/edit', this.productId()]);
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(this.productId()).subscribe({
        next: () => {
          this.snackBar.open('Product deleted successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/products']);
        },
        error: (error) => {
          this.snackBar.open('Failed to delete product', 'Close', { duration: 5000 });
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  onBack() {
    this.router.navigate(['/products']);
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

  getStockStatusColor(product: Product): string {
    const status = this.getStockStatus(product);
    switch (status) {
      case 'out-of-stock': return 'warn';
      case 'low-stock': return 'accent';
      default: return 'primary';
    }
  }

  getProfitMargin(product: Product): number {
    if (product.costPrice <= 0) return 0;
    return ((product.sellingPrice - product.costPrice) / product.costPrice) * 100;
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'inactive': return 'accent';
      case 'discontinued': return 'warn';
      default: return 'primary';
    }
  }
}