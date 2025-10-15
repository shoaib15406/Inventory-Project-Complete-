export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalSuppliers: number;
  pendingOrders: number;
  recentMovements: number;
  monthlyTrend: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  productId?: string;
  categoryId?: string;
  supplierId?: string;
  movementType?: string;
  status?: string;
}

export interface InventoryReport {
  id: string;
  title: string;
  description: string;
  type: 'stock-level' | 'movement' | 'valuation' | 'low-stock' | 'supplier-performance';
  data: any[];
  chartData?: ChartData;
  generatedDate: Date;
  generatedBy: string;
  filters: ReportFilter;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  productId?: string;
}