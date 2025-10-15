import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Product, ProductCategory, StockMovement } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [];
  private categories: ProductCategory[] = [];
  private stockMovements: StockMovement[] = [];
  
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample categories
    this.categories = [
      {
        id: '1',
        name: 'Electronics',
        description: 'Electronic devices and components',
        isActive: true,
        createdDate: new Date()
      },
      {
        id: '2',
        name: 'Office Supplies',
        description: 'Office and stationery items',
        isActive: true,
        createdDate: new Date()
      },
      {
        id: '3',
        name: 'Furniture',
        description: 'Office and home furniture',
        isActive: true,
        createdDate: new Date()
      }
    ];

    // Sample products
    this.products = [
      {
        id: '1',
        name: 'Laptop Dell Inspiron 15',
        description: 'High-performance laptop for business use',
        sku: 'DELL-INS-15',
        category: 'Electronics',
        supplierId: '1',
        supplierName: 'Tech Solutions Inc.',
        costPrice: 800,
        sellingPrice: 1200,
        currentStock: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        unit: 'piece',
        status: 'active',
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date()
      },
      {
        id: '2',
        name: 'Office Chair Ergonomic',
        description: 'Comfortable ergonomic office chair',
        sku: 'CHAIR-ERG-001',
        category: 'Furniture',
        supplierId: '2',
        supplierName: 'Furniture Plus',
        costPrice: 150,
        sellingPrice: 250,
        currentStock: 3,
        minStockLevel: 5,
        maxStockLevel: 20,
        unit: 'piece',
        status: 'active',
        createdDate: new Date('2024-02-01'),
        updatedDate: new Date()
      },
      {
        id: '3',
        name: 'Printer Paper A4',
        description: 'High quality A4 printing paper',
        sku: 'PAPER-A4-500',
        category: 'Office Supplies',
        supplierId: '3',
        supplierName: 'Office Depot',
        costPrice: 5,
        sellingPrice: 8,
        currentStock: 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: 'ream',
        status: 'active',
        createdDate: new Date('2024-01-20'),
        updatedDate: new Date()
      },
      {
        id: '4',
        name: 'Wireless Mouse',
        description: 'Optical wireless mouse',
        sku: 'MOUSE-WL-001',
        category: 'Electronics',
        supplierId: '1',
        supplierName: 'Tech Solutions Inc.',
        costPrice: 15,
        sellingPrice: 25,
        currentStock: 45,
        minStockLevel: 10,
        maxStockLevel: 50,
        unit: 'piece',
        status: 'active',
        createdDate: new Date('2024-02-10'),
        updatedDate: new Date()
      }
    ];

    this.productsSubject.next(this.products);
  }

  // Product CRUD operations
  getAllProducts(): Observable<Product[]> {
    return of(this.products);
  }

  getProductById(id: string): Observable<Product | undefined> {
    const product = this.products.find(p => p.id === id);
    return of(product);
  }

  createProduct(product: Product): Observable<Product> {
    product.id = Date.now().toString();
    product.createdDate = new Date();
    product.updatedDate = new Date();
    this.products.push(product);
    this.productsSubject.next(this.products);
    return of(product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product | null> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...product, updatedDate: new Date() };
      this.productsSubject.next(this.products);
      return of(this.products[index]);
    }
    return of(null);
  }

  deleteProduct(id: string): Observable<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.productsSubject.next(this.products);
      return of(true);
    }
    return of(false);
  }

  // Category operations
  getAllCategories(): Observable<ProductCategory[]> {
    return of(this.categories);
  }

  // Stock operations
  getLowStockProducts(): Observable<Product[]> {
    const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStockLevel);
    return of(lowStockProducts);
  }

  getOutOfStockProducts(): Observable<Product[]> {
    const outOfStockProducts = this.products.filter(p => p.currentStock === 0);
    return of(outOfStockProducts);
  }

  updateStock(productId: string, quantity: number, movementType: 'in' | 'out' | 'adjustment', reason: string): Observable<boolean> {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      const previousStock = product.currentStock;
      
      if (movementType === 'adjustment') {
        product.currentStock = quantity;
      } else if (movementType === 'in') {
        product.currentStock += quantity;
      } else if (movementType === 'out') {
        product.currentStock = Math.max(0, product.currentStock - quantity);
      }

      // Create stock movement record
      const movement: StockMovement = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        movementType,
        quantity,
        previousStock,
        newStock: product.currentStock,
        reason,
        userId: 'current-user',
        userName: 'Current User',
        timestamp: new Date()
      };

      this.stockMovements.push(movement);
      product.updatedDate = new Date();
      this.productsSubject.next(this.products);
      return of(true);
    }
    return of(false);
  }

  getStockMovements(productId?: string): Observable<StockMovement[]> {
    if (productId) {
      return of(this.stockMovements.filter(m => m.productId === productId));
    }
    return of(this.stockMovements);
  }

  searchProducts(query: string): Observable<Product[]> {
    const filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredProducts);
  }
}