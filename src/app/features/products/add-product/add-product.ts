import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  selector: 'app-add-product',
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
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss'
})
export class AddProductComponent {
  productForm: FormGroup;
  saving = signal(false);
  
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
    
    // Generate SKU automatically based on name
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.productForm.get('sku')?.touched) {
        const sku = this.generateSKU(name);
        this.productForm.patchValue({ sku }, { emitEvent: false });
      }
    });
  }

  generateSKU(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleaned.slice(0, 6)}-${timestamp}`;
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.saving.set(true);
      
      const productData: Product = {
        ...this.productForm.value,
        id: '', // Will be set by the service
        createdDate: new Date(),
        updatedDate: new Date()
      };

      this.productService.createProduct(productData).subscribe({
        next: (product) => {
          this.snackBar.open('Product added successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/products']);
        },
        error: (error) => {
          this.snackBar.open('Failed to add product. Please try again.', 'Close', { duration: 5000 });
          console.error('Error adding product:', error);
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