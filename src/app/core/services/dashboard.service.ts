import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map } from 'rxjs';
import { DashboardStats, ChartData, InventoryReport, NotificationItem } from '../models/dashboard.model';
import { ProductService } from './product.service';
import { SupplierService } from './supplier.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private notifications: NotificationItem[] = [];
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService
  ) {
    this.initializeNotifications();
  }

  private initializeNotifications() {
    this.notifications = [
      {
        id: '1',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Office Chair Ergonomic is running low on stock (3 remaining)',
        timestamp: new Date(),
        isRead: false,
        productId: '2'
      },
      {
        id: '2',
        type: 'error',
        title: 'Out of Stock',
        message: 'Printer Paper A4 is out of stock',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: false,
        productId: '3'
      },
      {
        id: '3',
        type: 'info',
        title: 'New Supplier Added',
        message: 'Office Depot has been added to the supplier list',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        isRead: false
      }
    ];
    this.notificationsSubject.next(this.notifications);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.productService.getAllProducts().pipe(
      map(products => {
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
        const lowStockItems = products.filter(p => p.currentStock <= p.minStockLevel).length;
        const outOfStockItems = products.filter(p => p.currentStock === 0).length;
        
        return {
          totalProducts,
          totalValue,
          lowStockItems,
          outOfStockItems,
          totalSuppliers: 3, // Mock data
          pendingOrders: 2, // Mock data
          recentMovements: 15, // Mock data
          monthlyTrend: 5.2 // Mock data - percentage increase
        };
      })
    );
  }

  getStockLevelChart(): Observable<ChartData> {
    return this.productService.getAllProducts().pipe(
      map(products => {
        const categories = [...new Set(products.map(p => p.category))];
        const stockData = categories.map(category => 
          products
            .filter(p => p.category === category)
            .reduce((sum, p) => sum + p.currentStock, 0)
        );

        return {
          labels: categories,
          datasets: [{
            label: 'Stock by Category',
            data: stockData,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ],
            borderColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ],
            borderWidth: 1
          }]
        };
      })
    );
  }

  getValueChart(): Observable<ChartData> {
    return this.productService.getAllProducts().pipe(
      map(products => {
        const categories = [...new Set(products.map(p => p.category))];
        const valueData = categories.map(category => 
          products
            .filter(p => p.category === category)
            .reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
        );

        return {
          labels: categories,
          datasets: [{
            label: 'Inventory Value by Category',
            data: valueData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        };
      })
    );
  }

  getMonthlyMovementChart(): Observable<ChartData> {
    // Mock data for monthly movement trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const inData = [120, 190, 300, 500, 200, 300];
    const outData = [100, 150, 250, 400, 180, 250];

    return of({
      labels: months,
      datasets: [
        {
          label: 'Stock In',
          data: inData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2
        },
        {
          label: 'Stock Out',
          data: outData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2
        }
      ]
    });
  }

  getTopProducts(): Observable<any[]> {
    return this.productService.getAllProducts().pipe(
      map(products => {
        return products
          .sort((a, b) => (b.currentStock * b.sellingPrice) - (a.currentStock * a.sellingPrice))
          .slice(0, 5)
          .map(product => ({
            name: product.name,
            value: product.currentStock * product.sellingPrice,
            stock: product.currentStock,
            category: product.category
          }));
      })
    );
  }

  getRecentMovements(): Observable<any[]> {
    return this.productService.getStockMovements().pipe(
      map(movements => {
        return movements
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
      })
    );
  }

  // Notification methods
  getNotifications(): Observable<NotificationItem[]> {
    return this.notifications$;
  }

  markNotificationAsRead(id: string): Observable<boolean> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.notificationsSubject.next(this.notifications);
      return of(true);
    }
    return of(false);
  }

  markAllNotificationsAsRead(): Observable<boolean> {
    this.notifications.forEach(n => n.isRead = true);
    this.notificationsSubject.next(this.notifications);
    return of(true);
  }

  addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): void {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    };
    this.notifications.unshift(newNotification);
    this.notificationsSubject.next(this.notifications);
  }

  // Generate reports
  generateInventoryReport(type: string, filters: any = {}): Observable<InventoryReport> {
    return this.productService.getAllProducts().pipe(
      map(products => {
        let data: any[] = [];
        let chartData: ChartData | undefined;

        switch (type) {
          case 'stock-level':
            data = products.map(p => ({
              name: p.name,
              sku: p.sku,
              category: p.category,
              currentStock: p.currentStock,
              minLevel: p.minStockLevel,
              maxLevel: p.maxStockLevel,
              status: p.currentStock === 0 ? 'Out of Stock' : 
                     p.currentStock <= p.minStockLevel ? 'Low Stock' : 'In Stock'
            }));
            break;
            
          case 'valuation':
            data = products.map(p => ({
              name: p.name,
              sku: p.sku,
              category: p.category,
              currentStock: p.currentStock,
              costPrice: p.costPrice,
              sellingPrice: p.sellingPrice,
              totalCostValue: p.currentStock * p.costPrice,
              totalSellingValue: p.currentStock * p.sellingPrice
            }));
            break;
            
          case 'low-stock':
            data = products
              .filter(p => p.currentStock <= p.minStockLevel)
              .map(p => ({
                name: p.name,
                sku: p.sku,
                category: p.category,
                currentStock: p.currentStock,
                minLevel: p.minStockLevel,
                shortage: p.minStockLevel - p.currentStock
              }));
            break;
        }

        return {
          id: Date.now().toString(),
          title: `${type.replace('-', ' ').toUpperCase()} Report`,
          description: `Generated report for ${type}`,
          type: type as any,
          data,
          chartData,
          generatedDate: new Date(),
          generatedBy: 'Current User',
          filters
        };
      })
    );
  }
}