import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Supplier, PurchaseOrder } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  
  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  public suppliers$ = this.suppliersSubject.asObservable();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    this.suppliers = [
      {
        id: '1',
        name: 'Tech Solutions Inc.',
        contactPerson: 'John Smith',
        email: 'john@techsolutions.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        website: 'www.techsolutions.com',
        paymentTerms: 'Net 30',
        creditLimit: 50000,
        status: 'active',
        rating: 4.5,
        createdDate: new Date('2024-01-01'),
        updatedDate: new Date()
      },
      {
        id: '2',
        name: 'Furniture Plus',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@furnitureplus.com',
        phone: '+1-555-0456',
        address: {
          street: '456 Furniture Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        paymentTerms: 'Net 15',
        creditLimit: 25000,
        status: 'active',
        rating: 4.2,
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date()
      },
      {
        id: '3',
        name: 'Office Depot',
        contactPerson: 'Mike Wilson',
        email: 'mike@officedepot.com',
        phone: '+1-555-0789',
        address: {
          street: '789 Office Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentTerms: 'Net 30',
        creditLimit: 15000,
        status: 'active',
        rating: 4.0,
        createdDate: new Date('2024-02-01'),
        updatedDate: new Date()
      }
    ];

    this.suppliersSubject.next(this.suppliers);
  }

  // Supplier CRUD operations
  getAllSuppliers(): Observable<Supplier[]> {
    return of(this.suppliers);
  }

  getSupplierById(id: string): Observable<Supplier | undefined> {
    const supplier = this.suppliers.find(s => s.id === id);
    return of(supplier);
  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    supplier.id = Date.now().toString();
    supplier.createdDate = new Date();
    supplier.updatedDate = new Date();
    this.suppliers.push(supplier);
    this.suppliersSubject.next(this.suppliers);
    return of(supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier | null> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      this.suppliers[index] = { ...this.suppliers[index], ...supplier, updatedDate: new Date() };
      this.suppliersSubject.next(this.suppliers);
      return of(this.suppliers[index]);
    }
    return of(null);
  }

  deleteSupplier(id: string): Observable<boolean> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      this.suppliers.splice(index, 1);
      this.suppliersSubject.next(this.suppliers);
      return of(true);
    }
    return of(false);
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
      supplier.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
      supplier.email.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredSuppliers);
  }
}