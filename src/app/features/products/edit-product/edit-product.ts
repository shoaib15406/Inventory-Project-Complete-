import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-edit-product',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.scss'
})
export class EditProductComponent implements OnInit {
  productForm: FormGroup;
  saving = signal(false);
  loading = signal(true);
  productId = signal<string>('');
  
  categories = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Toys & Games',
    'Health & Beauty',
    'Automotive',
    'Office Supplies'
  ];

  units = [
    'pieces',
    'kg',
    'liters',
    'meters',
    'boxes',
    'pairs',
    'sets',
    'packs'
  ];

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' }
  ];

  suppliers = [
    { id: '1', name: 'Tech Supplier Co.' },
    { id: '2', name: 'Office Supplies Inc.' },
    { id: '3', name: 'Electronics World' },
    { id: '4', name: 'Furniture Direct' }
  ];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      category: ['', Validators.required],
      unit: ['', Validators.required],
      costPrice: [0, [Validators.required, Validators.min(0.01)]],
      sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [0, [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
      supplierId: ['', Validators.required]
    });
  }

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
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            sku: product.sku,
            category: product.category,
            unit: product.unit,
            costPrice: product.costPrice,
            sellingPrice: product.sellingPrice,
            currentStock: product.currentStock,
            minStockLevel: product.minStockLevel,
            maxStockLevel: product.maxStockLevel,
            status: product.status,
            supplierId: product.supplierId
          });
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

  onSubmit() {
    if (this.productForm.valid) {
      this.saving.set(true);
      
      const updatedData = {
        ...this.productForm.value,
        updatedDate: new Date()
      };

      this.productService.updateProduct(this.productId(), updatedData).subscribe({
        next: (product) => {
          if (product) {
            this.snackBar.open('Product updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/products']);
          } else {
            this.snackBar.open('Failed to update product', 'Close', { duration: 5000 });
            this.saving.set(false);
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to update product. Please try again.', 'Close', { duration: 5000 });
          console.error('Error updating product:', error);
          this.saving.set(false);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.router.navigate(['/products']);
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too short`;
    }
    if (control?.hasError('min')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be greater than 0`;
    }
    if (control?.hasError('pattern')) {
      return 'SKU must contain only letters, numbers, and hyphens';
    }
    return '';
  }
}