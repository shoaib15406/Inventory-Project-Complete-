export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  supplierId: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdDate: Date;
  updatedDate: Date;
  imageUrl?: string;
  barcode?: string;
  location?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdDate: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  cost?: number;
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
}