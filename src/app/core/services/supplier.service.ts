import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, delay, map } from 'rxjs';
import { 
  Supplier, 
  PurchaseOrder, 
  CreateSupplierRequest, 
  UpdateSupplierRequest,
  SupplierFilters,
  SupplierSortOptions,
  SupplierMetrics
} from '../models/supplier.model';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  
  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  public suppliers$ = this.suppliersSubject.asObservable();

  // Available options for dropdowns
  public readonly supplierTypes = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'service-provider', label: 'Service Provider' },
    { value: 'other', label: 'Other' }
  ] as const;

  public readonly paymentTermsOptions = [
    'COD (Cash on Delivery)',
    'Net 10',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Net 90',
    '2/10 Net 30',
    'EOM (End of Month)',
    'Prepayment Required'
  ];

  public readonly currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ];

  public readonly categories = [
    'Electronics',
    'Furniture',
    'Office Supplies',
    'Raw Materials',
    'Packaging',
    'Tools & Equipment',
    'Software',
    'Services',
    'Transportation',
    'Utilities'
  ];

  public readonly certifications = [
    'ISO 9001',
    'ISO 14001',
    'ISO 45001',
    'OHSAS 18001',
    'FSC Certified',
    'Fair Trade',
    'Organic Certified',
    'CE Marking',
    'FDA Approved',
    'Energy Star'
  ];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    this.suppliers = [
      {
        id: '1',
        name: 'Tech Solutions Inc.',
        supplierCode: 'TS001',
        type: 'manufacturer',
        category: ['Electronics', 'Software'],
        contact: {
          contactPerson: 'John Smith',
          email: 'john@techsolutions.com',
          phone: '+1-555-0123',
          website: 'www.techsolutions.com'
        },
        billingAddress: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        paymentTerms: 'Net 30',
        creditLimit: 50000,
        currency: 'USD',
        leadTime: 7,
        minimumOrderValue: 1000,
        shippingMethods: ['Ground', 'Express', 'Overnight'],
        certifications: ['ISO 9001', 'ISO 14001'],
        complianceStatus: 'compliant',
        status: 'active',
        priority: 'high',
        rating: 4.5,
        riskLevel: 'low',
        tags: ['preferred', 'reliable'],
        documents: [],
        metrics: {
          totalOrders: 150,
          totalValue: 750000,
          onTimeDeliveryRate: 95,
          qualityScore: 98,
          averageLeadTime: 6.5,
          defectRate: 0.02,
          lastOrderDate: new Date('2024-10-10')
        },
        createdDate: new Date('2024-01-01'),
        updatedDate: new Date()
      },
      {
        id: '2',
        name: 'Furniture Plus',
        supplierCode: 'FP002',
        type: 'wholesaler',
        category: ['Furniture', 'Office Supplies'],
        contact: {
          contactPerson: 'Sarah Johnson',
          email: 'sarah@furnitureplus.com',
          phone: '+1-555-0456'
        },
        billingAddress: {
          street: '456 Furniture Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        paymentTerms: 'Net 15',
        creditLimit: 25000,
        currency: 'USD',
        leadTime: 14,
        minimumOrderValue: 500,
        shippingMethods: ['Ground', 'Freight'],
        certifications: ['FSC Certified'],
        complianceStatus: 'compliant',
        status: 'active',
        priority: 'medium',
        rating: 4.2,
        riskLevel: 'low',
        tags: ['furniture', 'office'],
        documents: [],
        metrics: {
          totalOrders: 85,
          totalValue: 425000,
          onTimeDeliveryRate: 88,
          qualityScore: 92,
          averageLeadTime: 12,
          defectRate: 0.05,
          lastOrderDate: new Date('2024-10-05')
        },
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date()
      },
      {
        id: '3',
        name: 'Office Depot',
        supplierCode: 'OD003',
        type: 'distributor',
        category: ['Office Supplies', 'Electronics'],
        contact: {
          contactPerson: 'Mike Wilson',
          email: 'mike@officedepot.com',
          phone: '+1-555-0789'
        },
        billingAddress: {
          street: '789 Office Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentTerms: 'Net 30',
        creditLimit: 15000,
        currency: 'USD',
        leadTime: 3,
        minimumOrderValue: 100,
        shippingMethods: ['Ground', 'Express'],
        certifications: ['ISO 9001'],
        complianceStatus: 'compliant',
        status: 'active',
        priority: 'medium',
        rating: 4.0,
        riskLevel: 'low',
        tags: ['office', 'quick-delivery'],
        documents: [],
        metrics: {
          totalOrders: 200,
          totalValue: 300000,
          onTimeDeliveryRate: 92,
          qualityScore: 90,
          averageLeadTime: 2.8,
          defectRate: 0.03,
          lastOrderDate: new Date('2024-10-12')
        },
        createdDate: new Date('2024-02-01'),
        updatedDate: new Date()
      }
    ];

    this.suppliersSubject.next(this.suppliers);
  }

  // Enhanced Supplier CRUD operations
  getAllSuppliers(): Observable<Supplier[]> {
    return of([...this.suppliers]).pipe(delay(300));
  }

  getSuppliersWithPagination(
    pagination: PaginationParams,
    filters?: SupplierFilters,
    sort?: SupplierSortOptions
  ): Observable<PaginatedResponse<Supplier>> {
    return of(this.suppliers).pipe(
      map(suppliers => {
        // Apply filters
        let filteredSuppliers = this.applyFilters(suppliers, filters);
        
        // Apply sorting
        if (sort) {
          filteredSuppliers = this.applySorting(filteredSuppliers, sort);
        }
        
        // Calculate pagination
        const total = filteredSuppliers.length;
        const totalPages = Math.ceil(total / pagination.pageSize);
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        
        const data = filteredSuppliers.slice(startIndex, endIndex);
        
        return {
          data,
          total,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages
        };
      }),
      delay(300)
    );
  }

  getSupplierById(id: string): Observable<Supplier | null> {
    const supplier = this.suppliers.find(s => s.id === id);
    return of(supplier || null).pipe(delay(200));
  }

  createSupplier(request: CreateSupplierRequest): Observable<Supplier> {
    // Simulate validation
    if (!request.name.trim()) {
      return throwError(() => new Error('Supplier name is required'));
    }
    
    if (!request.contact.email) {
      return throwError(() => new Error('Email is required'));
    }

    // Check for duplicate name
    const existingSupplier = this.suppliers.find(s => 
      s.name.toLowerCase() === request.name.toLowerCase()
    );
    
    if (existingSupplier) {
      return throwError(() => new Error('Supplier with this name already exists'));
    }

    const newSupplier: Supplier = {
      id: this.generateId(),
      supplierCode: this.generateSupplierCode(request.name),
      name: request.name,
      type: request.type,
      category: request.category,
      contact: request.contact,
      billingAddress: request.billingAddress,
      shippingAddress: request.shippingAddress,
      paymentTerms: request.paymentTerms,
      currency: request.currency,
      creditLimit: 0,
      leadTime: 0,
      minimumOrderValue: 0,
      shippingMethods: [],
      incoterms: undefined,
      certifications: [],
      complianceStatus: 'pending',
      status: request.status || 'pending-approval',
      priority: request.priority || 'medium',
      rating: 0,
      riskLevel: 'medium',
      notes: request.notes,
      tags: request.tags || [],
      documents: [],
      createdDate: new Date(),
      updatedDate: new Date()
    };

    this.suppliers.push(newSupplier);
    this.suppliersSubject.next([...this.suppliers]);
    
    return of(newSupplier).pipe(delay(500));
  }

  updateSupplier(request: UpdateSupplierRequest): Observable<Supplier> {
    const index = this.suppliers.findIndex(s => s.id === request.id);
    
    if (index === -1) {
      return throwError(() => new Error('Supplier not found'));
    }

    // Validate name uniqueness if changed
    if (request.name) {
      const existingSupplier = this.suppliers.find(s => 
        s.id !== request.id && s.name.toLowerCase() === request.name!.toLowerCase()
      );
      
      if (existingSupplier) {
        return throwError(() => new Error('Supplier with this name already exists'));
      }
    }

    const updatedSupplier: Supplier = {
      ...this.suppliers[index],
      ...request,
      updatedDate: new Date(),
      updatedBy: 'current-user' // In real app, get from auth service
    };

    this.suppliers[index] = updatedSupplier;
    this.suppliersSubject.next([...this.suppliers]);
    
    return of(updatedSupplier).pipe(delay(500));
  }

  deleteSupplier(id: string): Observable<boolean> {
    const index = this.suppliers.findIndex(s => s.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Supplier not found'));
    }

    // Check if supplier has active orders (in real app)
    const hasActiveOrders = this.purchaseOrders.some(po => 
      po.supplierId === id && po.status === 'pending'
    );
    
    if (hasActiveOrders) {
      return throwError(() => new Error('Cannot delete supplier with active orders'));
    }

    this.suppliers.splice(index, 1);
    this.suppliersSubject.next([...this.suppliers]);
    
    return of(true).pipe(delay(300));
  }

  bulkDeleteSuppliers(ids: string[]): Observable<boolean> {
    const validIds = ids.filter(id => 
      this.suppliers.some(s => s.id === id)
    );
    
    if (validIds.length === 0) {
      return throwError(() => new Error('No valid suppliers found'));
    }

    this.suppliers = this.suppliers.filter(s => !validIds.includes(s.id));
    this.suppliersSubject.next([...this.suppliers]);
    
    return of(true).pipe(delay(500));
  }

  deactivateSupplier(id: string): Observable<Supplier> {
    return this.updateSupplierStatus(id, 'inactive');
  }

  activateSupplier(id: string): Observable<Supplier> {
    return this.updateSupplierStatus(id, 'active');
  }

  private updateSupplierStatus(id: string, status: Supplier['status']): Observable<Supplier> {
    const supplier = this.suppliers.find(s => s.id === id);
    
    if (!supplier) {
      return throwError(() => new Error('Supplier not found'));
    }

    supplier.status = status;
    supplier.updatedDate = new Date();
    
    this.suppliersSubject.next([...this.suppliers]);
    return of(supplier).pipe(delay(200));
  }

  // Purchase Order operations
  getAllPurchaseOrders(): Observable<PurchaseOrder[]> {
    return of(this.purchaseOrders);
  }

  getPurchaseOrderById(id: string): Observable<PurchaseOrder | undefined> {
    const order = this.purchaseOrders.find(po => po.id === id);
    return of(order);
  }

  createPurchaseOrder(order: PurchaseOrder): Observable<PurchaseOrder> {
    order.id = Date.now().toString();
    order.orderNumber = `PO-${Date.now()}`;
    order.createdDate = new Date();
    order.updatedDate = new Date();
    this.purchaseOrders.push(order);
    return of(order);
  }

  updatePurchaseOrder(id: string, order: Partial<PurchaseOrder>): Observable<PurchaseOrder | null> {
    const index = this.purchaseOrders.findIndex(po => po.id === id);
    if (index !== -1) {
      this.purchaseOrders[index] = { ...this.purchaseOrders[index], ...order, updatedDate: new Date() };
      return of(this.purchaseOrders[index]);
    }
    return of(null);
  }

  getSupplierPerformance(): Observable<any[]> {
    // Calculate supplier performance metrics
    const performance = this.suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      rating: supplier.rating,
      totalOrders: this.purchaseOrders.filter(po => po.supplierId === supplier.id).length,
      onTimeDelivery: Math.floor(Math.random() * 30) + 70, // Mock data
      qualityScore: Math.floor(Math.random() * 20) + 80 // Mock data
    }));
    
    return of(performance);
  }

  searchSuppliers(query: string): Observable<Supplier[]> {
    const filteredSuppliers = this.suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(query.toLowerCase()) ||
      supplier.contact.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
      supplier.contact.email.toLowerCase().includes(query.toLowerCase()) ||
      supplier.category.some(cat => cat.toLowerCase().includes(query.toLowerCase())) ||
      supplier.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    return of(filteredSuppliers).pipe(delay(200));
  }

  // Helper methods
  private generateId(): string {
    return 'sup_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
  }

  private generateSupplierCode(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return prefix + suffix;
  }

  private applyFilters(suppliers: Supplier[], filters?: SupplierFilters): Supplier[] {
    if (!filters) return suppliers;

    return suppliers.filter(supplier => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.contact.contactPerson.toLowerCase().includes(searchLower) ||
          supplier.contact.email.toLowerCase().includes(searchLower) ||
          supplier.category.some(cat => cat.toLowerCase().includes(searchLower)) ||
          supplier.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(supplier.status)) return false;
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(supplier.type)) return false;
      }

      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!supplier.category.some(cat => filters.category!.includes(cat))) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(supplier.priority)) return false;
      }

      // Risk level filter
      if (filters.riskLevel && filters.riskLevel.length > 0) {
        if (!filters.riskLevel.includes(supplier.riskLevel)) return false;
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        if (supplier.rating < filters.minRating) return false;
      }

      // Credit limit filter
      if (filters.maxCreditLimit !== undefined) {
        if (supplier.creditLimit && supplier.creditLimit > filters.maxCreditLimit) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!supplier.tags.some(tag => filters.tags!.includes(tag))) return false;
      }

      return true;
    });
  }

  private applySorting(suppliers: Supplier[], sort: SupplierSortOptions): Supplier[] {
    return [...suppliers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'createdDate':
          aValue = a.createdDate.getTime();
          bValue = b.createdDate.getTime();
          break;
        case 'lastContactDate':
          aValue = a.lastContactDate?.getTime() || 0;
          bValue = b.lastContactDate?.getTime() || 0;
          break;
        case 'totalOrders':
          aValue = a.metrics?.totalOrders || 0;
          bValue = b.metrics?.totalOrders || 0;
          break;
        case 'totalValue':
          aValue = a.metrics?.totalValue || 0;
          bValue = b.metrics?.totalValue || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Analytics and reporting methods
  getSupplierAnalytics(): Observable<any> {
    const analytics = {
      totalSuppliers: this.suppliers.length,
      activeSuppliers: this.suppliers.filter(s => s.status === 'active').length,
      inactiveSuppliers: this.suppliers.filter(s => s.status === 'inactive').length,
      pendingSuppliers: this.suppliers.filter(s => s.status === 'pending-approval').length,
      averageRating: this.suppliers.reduce((sum, s) => sum + s.rating, 0) / this.suppliers.length,
      topCategories: this.getTopCategories(),
      suppliersByType: this.getSuppliersByType(),
      riskDistribution: this.getRiskDistribution()
    };

    return of(analytics).pipe(delay(200));
  }

  private getTopCategories(): { category: string; count: number }[] {
    const categoryCount: { [key: string]: number } = {};
    
    this.suppliers.forEach(supplier => {
      supplier.category.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getSuppliersByType(): { type: string; count: number }[] {
    const typeCount: { [key: string]: number } = {};
    
    this.suppliers.forEach(supplier => {
      typeCount[supplier.type] = (typeCount[supplier.type] || 0) + 1;
    });

    return Object.entries(typeCount).map(([type, count]) => ({ type, count }));
  }

  private getRiskDistribution(): { risk: string; count: number }[] {
    const riskCount: { [key: string]: number } = {};
    
    this.suppliers.forEach(supplier => {
      riskCount[supplier.riskLevel] = (riskCount[supplier.riskLevel] || 0) + 1;
    });

    return Object.entries(riskCount).map(([risk, count]) => ({ risk, count }));
  }

  // Export functionality
  exportSuppliers(format: 'csv' | 'excel' | 'pdf'): Observable<string> {
    // In real implementation, this would generate the actual file
    const filename = `suppliers_export_${Date.now()}.${format}`;
    return of(filename).pipe(delay(1000));
  }
}