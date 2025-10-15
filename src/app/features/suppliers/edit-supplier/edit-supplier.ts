import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { finalize, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest, Address } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-edit-supplier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './edit-supplier.html',
  styleUrl: './edit-supplier.scss'
})
export class EditSupplierComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supplierService = inject(SupplierService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state management
  private _isLoading = signal(false);
  private _isSubmitting = signal(false);
  private _supplier = signal<Supplier | null>(null);
  private _selectedCategories = signal<readonly string[]>([]);
  private _selectedCertifications = signal<readonly string[]>([]);
  private _supplierTags = signal<readonly string[]>([]);
  private _shippingMethods = signal<readonly string[]>([]);

  // Computed properties
  isLoading = computed(() => this._isLoading());
  isSubmitting = computed(() => this._isSubmitting());
  supplier = computed(() => this._supplier());
  selectedCategories = computed(() => this._selectedCategories());
  selectedCertifications = computed(() => this._selectedCertifications());
  supplierTags = computed(() => this._supplierTags());
  shippingMethods = computed(() => this._shippingMethods());

  // Form groups
  supplierForm!: FormGroup;

  // Form control getters
  get basicInfo() { return this.supplierForm.get('basicInfo') as FormGroup; }
  get contactInfo() { return this.supplierForm.get('contactInfo') as FormGroup; }
  get addressInfo() { return this.supplierForm.get('addressInfo') as FormGroup; }
  get businessInfo() { return this.supplierForm.get('businessInfo') as FormGroup; }
  get additionalInfo() { return this.supplierForm.get('additionalInfo') as FormGroup; }

  // Options data
  readonly supplierTypes = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'service-provider', label: 'Service Provider' }
  ];

  readonly availableCategories = [
    'Electronics', 'Clothing', 'Food & Beverage', 'Automotive', 'Healthcare',
    'Construction', 'Technology', 'Textiles', 'Chemicals', 'Furniture',
    'Packaging', 'Raw Materials', 'Industrial Equipment', 'Office Supplies'
  ];

  readonly availableCertifications = [
    'ISO 9001', 'ISO 14001', 'ISO 45001', 'OHSAS 18001', 'FDA Approved',
    'CE Marking', 'UL Listed', 'REACH Compliance', 'RoHS Compliance',
    'Fair Trade', 'Organic', 'Halal', 'Kosher', 'GMP'
  ];

  readonly paymentTermsOptions = [
    'Net 10', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90',
    'COD', 'CIA', '2/10 Net 30', '1/10 Net 30', 'Due on Receipt'
  ];

  readonly currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadSupplier();
  }

  private initializeForm(): void {
    this.supplierForm = this.fb.group({
      basicInfo: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        type: ['', Validators.required],
        categories: [[]]
      }),
      contactInfo: this.fb.group({
        contactPerson: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
        alternatePhone: ['', Validators.pattern(/^\+?[\d\s\-\(\)]+$/)],
        fax: ['', Validators.pattern(/^\+?[\d\s\-\(\)]+$/)],
        website: ['', Validators.pattern(/^https?:\/\/.*$/)]
      }),
      addressInfo: this.fb.group({
        billingAddress: this.fb.group({
          street: ['', [Validators.required, Validators.maxLength(200)]],
          city: ['', [Validators.required, Validators.maxLength(50)]],
          state: ['', [Validators.required, Validators.maxLength(50)]],
          zipCode: ['', [Validators.required, Validators.pattern(/^[\w\s\-]{3,10}$/)]],
          country: ['', [Validators.required, Validators.maxLength(50)]]
        }),
        sameAsShipping: [false],
        shippingAddress: this.fb.group({
          street: ['', Validators.maxLength(200)],
          city: ['', Validators.maxLength(50)],
          state: ['', Validators.maxLength(50)],
          zipCode: ['', Validators.pattern(/^[\w\s\-]{3,10}$/)],
          country: ['', Validators.maxLength(50)]
        })
      }),
      businessInfo: this.fb.group({
        paymentTerms: ['', Validators.required],
        currency: ['USD', Validators.required],
        creditLimit: [0, [Validators.min(0), Validators.max(999999999)]],
        leadTime: [0, [Validators.min(0), Validators.max(365)]],
        minimumOrderValue: [0, [Validators.min(0), Validators.max(999999999)]],
        businessRegistrationNumber: ['', Validators.maxLength(50)],
        taxId: ['', Validators.maxLength(50)],
        vatNumber: ['', Validators.maxLength(50)],
        duns: ['', Validators.maxLength(13)]
      }),
      additionalInfo: this.fb.group({
        status: ['active'],
        priority: ['medium'],
        notes: ['', Validators.maxLength(1000)]
      })
    });

    // Watch for "same as shipping" changes
    this.addressInfo.get('sameAsShipping')?.valueChanges.subscribe(value => {
      this.onSameAsShippingChange();
    });
  }

  private loadSupplier(): void {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (!supplierId) {
      this.snackBar.open('Supplier ID not found', 'Close', { duration: 3000 });
      this.router.navigate(['/suppliers']);
      return;
    }

    this._isLoading.set(true);
    
    this.supplierService.getSupplierById(supplierId)
      .pipe(
        finalize(() => this._isLoading.set(false))
      )
      .subscribe({
        next: (supplier: Supplier | null) => {
          if (supplier) {
            this._supplier.set(supplier);
            this.populateForm(supplier);
          } else {
            this.snackBar.open('Supplier not found', 'Close', { duration: 3000 });
            this.router.navigate(['/suppliers']);
          }
        },
        error: (error: any) => {
          console.error('Error loading supplier:', error);
          this.snackBar.open('Failed to load supplier', 'Close', { duration: 3000 });
          this.router.navigate(['/suppliers']);
        }
      });
  }

  private populateForm(supplier: Supplier): void {
    // Basic Info
    this.basicInfo.patchValue({
      name: supplier.name,
      type: supplier.type
    });
    this._selectedCategories.set(supplier.category || []);

    // Contact Info
    this.contactInfo.patchValue({
      contactPerson: supplier.contact.contactPerson,
      email: supplier.contact.email,
      phone: supplier.contact.phone,
      alternatePhone: supplier.contact.alternatePhone || '',
      fax: supplier.contact.fax || '',
      website: supplier.contact.website || ''
    });

    // Address Info
    if (supplier.billingAddress) {
      this.addressInfo.get('billingAddress')?.patchValue(supplier.billingAddress);
    }
    
    const hasSameShipping = supplier.shippingAddress && 
      JSON.stringify(supplier.shippingAddress) === JSON.stringify(supplier.billingAddress);
    
    this.addressInfo.patchValue({ sameAsShipping: hasSameShipping });
    
    if (supplier.shippingAddress && !hasSameShipping) {
      this.addressInfo.get('shippingAddress')?.patchValue(supplier.shippingAddress);
    }

    // Business Info
    this.businessInfo.patchValue({
      paymentTerms: supplier.paymentTerms,
      currency: supplier.currency || 'USD',
      creditLimit: supplier.creditLimit || 0,
      leadTime: supplier.leadTime || 0,
      minimumOrderValue: supplier.minimumOrderValue || 0,
      businessRegistrationNumber: supplier.businessRegistrationNumber || '',
      taxId: supplier.taxId || '',
      vatNumber: supplier.vatNumber || '',
      duns: supplier.duns || ''
    });

    // Additional Info
    this.additionalInfo.patchValue({
      status: supplier.status,
      priority: supplier.priority || 'medium',
      notes: supplier.notes || ''
    });

    // Arrays
    this._selectedCertifications.set(supplier.certifications || []);
    this._supplierTags.set(supplier.tags || []);
    this._shippingMethods.set(supplier.shippingMethods || []);
  }

  onSameAsShippingChange(): void {
    const sameAsShipping = this.addressInfo.get('sameAsShipping')?.value;
    const shippingGroup = this.addressInfo.get('shippingAddress') as FormGroup;
    
    if (sameAsShipping) {
      // Clear shipping address when same as billing
      shippingGroup.reset();
      // Remove validators from shipping address
      Object.keys(shippingGroup.controls).forEach(key => {
        shippingGroup.get(key)?.clearValidators();
        shippingGroup.get(key)?.updateValueAndValidity();
      });
    } else {
      // Add validators back to shipping address when different
      shippingGroup.get('street')?.setValidators([Validators.required, Validators.maxLength(200)]);
      shippingGroup.get('city')?.setValidators([Validators.required, Validators.maxLength(50)]);
      shippingGroup.get('state')?.setValidators([Validators.required, Validators.maxLength(50)]);
      shippingGroup.get('zipCode')?.setValidators([Validators.required, Validators.pattern(/^[\w\s\-]{3,10}$/)]);
      shippingGroup.get('country')?.setValidators([Validators.required, Validators.maxLength(50)]);
      
      Object.keys(shippingGroup.controls).forEach(key => {
        shippingGroup.get(key)?.updateValueAndValidity();
      });
    }
  }

  addCategory(category: string): void {
    if (category && !this.selectedCategories().includes(category)) {
      this._selectedCategories.set([...this.selectedCategories(), category]);
      this.basicInfo.get('categories')?.setValue(this.selectedCategories());
    }
  }

  removeCategory(category: string): void {
    const filtered = this.selectedCategories().filter(c => c !== category);
    this._selectedCategories.set(filtered);
    this.basicInfo.get('categories')?.setValue(filtered);
  }

  addCertification(certification: string): void {
    if (certification && !this.selectedCertifications().includes(certification)) {
      this._selectedCertifications.set([...this.selectedCertifications(), certification]);
    }
  }

  removeCertification(certification: string): void {
    const filtered = this.selectedCertifications().filter(c => c !== certification);
    this._selectedCertifications.set(filtered);
  }

  addTag(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.supplierTags().includes(value)) {
      this._supplierTags.set([...this.supplierTags(), value]);
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const filtered = this.supplierTags().filter(t => t !== tag);
    this._supplierTags.set(filtered);
  }

  addShippingMethod(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.shippingMethods().includes(value)) {
      this._shippingMethods.set([...this.shippingMethods(), value]);
      input.value = '';
    }
  }

  removeShippingMethod(method: string): void {
    const filtered = this.shippingMethods().filter(m => m !== method);
    this._shippingMethods.set(filtered);
  }

  isFieldInvalid(groupName: string, fieldName: string): boolean {
    const field = this.supplierForm.get(`${groupName}.${fieldName}`);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(groupName: string, fieldName: string): string {
    const field = this.supplierForm.get(`${groupName}.${fieldName}`);
    
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength}`;
      if (field.errors['pattern']) return 'Please enter a valid format';
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    
    return '';
  }

  onSubmit(): void {
    if (this.supplierForm.valid && this.supplier()) {
      this._isSubmitting.set(true);

      const formValue = this.supplierForm.value;
      const supplierData: UpdateSupplierRequest = {
        id: this.supplier()!.id,
        name: formValue.basicInfo.name,
        type: formValue.basicInfo.type,
        category: [...this.selectedCategories()],
        contact: {
          contactPerson: formValue.contactInfo.contactPerson,
          email: formValue.contactInfo.email,
          phone: formValue.contactInfo.phone,
          alternatePhone: formValue.contactInfo.alternatePhone || undefined,
          fax: formValue.contactInfo.fax || undefined,
          website: formValue.contactInfo.website || undefined,
        },
        billingAddress: formValue.addressInfo.billingAddress,
        shippingAddress: formValue.addressInfo.sameAsShipping 
          ? formValue.addressInfo.billingAddress 
          : formValue.addressInfo.shippingAddress,
        paymentTerms: formValue.businessInfo.paymentTerms,
        currency: formValue.businessInfo.currency,
        status: formValue.additionalInfo.status,
        priority: formValue.additionalInfo.priority,
        tags: [...this.supplierTags()],
        notes: formValue.additionalInfo.notes || undefined
      };

      this.supplierService.updateSupplier(supplierData)
        .pipe(
          finalize(() => this._isSubmitting.set(false))
        )
        .subscribe({
          next: (updatedSupplier) => {
            this.snackBar.open('Supplier updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/suppliers']);
          },
          error: (error) => {
            console.error('Error updating supplier:', error);
            this.snackBar.open('Failed to update supplier. Please try again.', 'Close', { duration: 3000 });
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.supplierForm.markAllAsTouched();
      this.snackBar.open('Please correct the errors in the form', 'Close', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.router.navigate(['/suppliers']);
  }
}