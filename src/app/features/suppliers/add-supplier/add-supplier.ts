import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SupplierService } from '../../../core/services/supplier.service';
import { CreateSupplierRequest, Supplier } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-add-supplier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './add-supplier.html',
  styleUrl: './add-supplier.scss'
})
export class AddSupplierComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form state
  supplierForm!: FormGroup;
  isSubmitting = signal<boolean>(false);
  isDuplicating = false;
  duplicateSupplier: Supplier | null = null;

  // Available options
  supplierTypes: readonly { value: string; label: string; }[] = [];
  paymentTermsOptions: readonly string[] = [];
  currencies: readonly { code: string; name: string; symbol: string; }[] = [];
  availableCategories: readonly string[] = [];
  availableCertifications: readonly string[] = [];

  // Dynamic arrays
  selectedCategories: string[] = [];
  selectedCertifications: string[] = [];
  supplierTags: string[] = [];
  shippingMethods: string[] = [];

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Initialize options from service
    this.supplierTypes = this.supplierService.supplierTypes;
    this.paymentTermsOptions = this.supplierService.paymentTermsOptions;
    this.currencies = this.supplierService.currencies;
    this.availableCategories = this.supplierService.categories;
    this.availableCertifications = this.supplierService.certifications;

    // Check if we're duplicating a supplier
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['duplicate']) {
        this.isDuplicating = true;
        this.loadSupplierForDuplication(params['duplicate']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.supplierForm = this.fb.group({
      // Basic Information
      basicInfo: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        type: ['', Validators.required],
        categories: [[], Validators.required]
      }),
      
      // Contact Information
      contactInfo: this.fb.group({
        contactPerson: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        alternatePhone: [''],
        fax: [''],
        website: ['']
      }),
      
      // Address Information
      addressInfo: this.fb.group({
        billingAddress: this.fb.group({
          street: ['', Validators.required],
          city: ['', Validators.required],
          state: ['', Validators.required],
          zipCode: ['', Validators.required],
          country: ['', Validators.required]
        }),
        sameAsShipping: [true],
        shippingAddress: this.fb.group({
          street: [''],
          city: [''],
          state: [''],
          zipCode: [''],
          country: ['']
        })
      }),
      
      // Business Information
      businessInfo: this.fb.group({
        paymentTerms: ['', Validators.required],
        currency: ['USD', Validators.required],
        creditLimit: [0, [Validators.min(0)]],
        leadTime: [0, [Validators.min(0)]],
        minimumOrderValue: [0, [Validators.min(0)]],
        businessRegistrationNumber: [''],
        taxId: [''],
        vatNumber: [''],
        duns: ['']
      }),
      
      // Additional Information
      additionalInfo: this.fb.group({
        status: ['active'],
        priority: ['medium'],
        certifications: [[]],
        tags: [[]],
        shippingMethods: [[]],
        notes: ['']
      })
    });

    // Watch for shipping address toggle
    this.addressInfo.get('sameAsShipping')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(sameAsShipping => {
      if (sameAsShipping) {
        this.copyBillingToShipping();
      }
    });
  }

  private loadSupplierForDuplication(supplierId: string) {
    this.supplierService.getSupplierById(supplierId).subscribe({
      next: (supplier) => {
        if (supplier) {
          this.duplicateSupplier = supplier;
          this.prefillFormFromSupplier(supplier);
        }
      },
      error: (error) => {
        this.showError('Failed to load supplier for duplication');
      }
    });
  }

  private prefillFormFromSupplier(supplier: Supplier) {
    // Pre-fill form with supplier data (excluding unique fields)
    this.supplierForm.patchValue({
      basicInfo: {
        name: `${supplier.name} (Copy)`,
        type: supplier.type,
        categories: supplier.category
      },
      contactInfo: {
        contactPerson: supplier.contact.contactPerson,
        email: '', // Don't copy email
        phone: '', // Don't copy phone
        alternatePhone: supplier.contact.alternatePhone,
        fax: supplier.contact.fax,
        website: supplier.contact.website
      },
      addressInfo: {
        billingAddress: supplier.billingAddress,
        sameAsShipping: !supplier.shippingAddress,
        shippingAddress: supplier.shippingAddress || {}
      },
      businessInfo: {
        paymentTerms: supplier.paymentTerms,
        currency: supplier.currency,
        creditLimit: supplier.creditLimit,
        leadTime: supplier.leadTime,
        minimumOrderValue: supplier.minimumOrderValue
      },
      additionalInfo: {
        status: 'active',
        priority: supplier.priority,
        certifications: supplier.certifications,
        tags: supplier.tags,
        shippingMethods: supplier.shippingMethods,
        notes: supplier.notes
      }
    });

    // Update dynamic arrays
    this.selectedCategories = [...supplier.category];
    this.selectedCertifications = [...supplier.certifications];
    this.supplierTags = [...supplier.tags];
    this.shippingMethods = [...(supplier.shippingMethods || [])];
  }

  // Form getters for easier access
  get basicInfo() { return this.supplierForm.get('basicInfo') as FormGroup; }
  get contactInfo() { return this.supplierForm.get('contactInfo') as FormGroup; }
  get addressInfo() { return this.supplierForm.get('addressInfo') as FormGroup; }
  get businessInfo() { return this.supplierForm.get('businessInfo') as FormGroup; }
  get additionalInfo() { return this.supplierForm.get('additionalInfo') as FormGroup; }

  // Category management
  addCategory(category: string) {
    if (category && !this.selectedCategories.includes(category)) {
      this.selectedCategories.push(category);
      this.basicInfo.get('categories')?.setValue(this.selectedCategories);
    }
  }

  removeCategory(category: string) {
    this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    this.basicInfo.get('categories')?.setValue(this.selectedCategories);
  }

  // Certification management
  addCertification(certification: string) {
    if (certification && !this.selectedCertifications.includes(certification)) {
      this.selectedCertifications.push(certification);
      this.additionalInfo.get('certifications')?.setValue(this.selectedCertifications);
    }
  }

  removeCertification(certification: string) {
    this.selectedCertifications = this.selectedCertifications.filter(c => c !== certification);
    this.additionalInfo.get('certifications')?.setValue(this.selectedCertifications);
  }

  // Tag management
  addTag(tagInput: any) {
    const tag = tagInput.value?.trim();
    if (tag && !this.supplierTags.includes(tag)) {
      this.supplierTags.push(tag);
      this.additionalInfo.get('tags')?.setValue(this.supplierTags);
      tagInput.value = '';
    }
  }

  removeTag(tag: string) {
    this.supplierTags = this.supplierTags.filter(t => t !== tag);
    this.additionalInfo.get('tags')?.setValue(this.supplierTags);
  }

  // Shipping method management
  addShippingMethod(methodInput: any) {
    const method = methodInput.value?.trim();
    if (method && !this.shippingMethods.includes(method)) {
      this.shippingMethods.push(method);
      this.additionalInfo.get('shippingMethods')?.setValue(this.shippingMethods);
      methodInput.value = '';
    }
  }

  removeShippingMethod(method: string) {
    this.shippingMethods = this.shippingMethods.filter(m => m !== method);
    this.additionalInfo.get('shippingMethods')?.setValue(this.shippingMethods);
  }

  // Address management
  private copyBillingToShipping() {
    const billingAddress = this.addressInfo.get('billingAddress')?.value;
    if (billingAddress) {
      this.addressInfo.get('shippingAddress')?.patchValue(billingAddress);
    }
  }

  onSameAsShippingChange() {
    if (this.addressInfo.get('sameAsShipping')?.value) {
      this.copyBillingToShipping();
    }
  }

  // Form submission
  onSubmit() {
    if (this.supplierForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      
      const formValue = this.supplierForm.value;
      
      const createRequest: CreateSupplierRequest = {
        name: formValue.basicInfo.name,
        type: formValue.basicInfo.type,
        category: this.selectedCategories,
        contact: {
          contactPerson: formValue.contactInfo.contactPerson,
          email: formValue.contactInfo.email,
          phone: formValue.contactInfo.phone,
          alternatePhone: formValue.contactInfo.alternatePhone,
          fax: formValue.contactInfo.fax,
          website: formValue.contactInfo.website
        },
        billingAddress: formValue.addressInfo.billingAddress,
        shippingAddress: formValue.addressInfo.sameAsShipping ? 
          undefined : formValue.addressInfo.shippingAddress,
        paymentTerms: formValue.businessInfo.paymentTerms,
        currency: formValue.businessInfo.currency,
        status: formValue.additionalInfo.status,
        priority: formValue.additionalInfo.priority,
        notes: formValue.additionalInfo.notes,
        tags: this.supplierTags
      };

      this.supplierService.createSupplier(createRequest).subscribe({
        next: (supplier) => {
          this.showSuccess(`Supplier "${supplier.name}" created successfully!`);
          this.router.navigate(['/suppliers']);
        },
        error: (error) => {
          this.showError(`Failed to create supplier: ${error.message}`);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.markFormGroupTouched(this.supplierForm);
      this.showError('Please fill in all required fields correctly');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched({ onlySelf: true });
      }
    });
  }

  // Navigation
  onCancel() {
    if (this.supplierForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/suppliers']);
      }
    } else {
      this.router.navigate(['/suppliers']);
    }
  }

  // Validation helpers
  isFieldInvalid(formGroupName: string, fieldName: string): boolean {
    const field = this.supplierForm.get(`${formGroupName}.${fieldName}`);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(formGroupName: string, fieldName: string): string {
    const field = this.supplierForm.get(`${formGroupName}.${fieldName}`);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minLength']) return `Minimum length is ${field.errors['minLength'].requiredLength}`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    }
    return '';
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
}