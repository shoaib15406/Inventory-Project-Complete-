export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  fax?: string;
  website?: string;
}

export interface BankingInfo {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface SupplierMetrics {
  totalOrders: number;
  totalValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  averageLeadTime: number;
  defectRate: number;
  lastOrderDate?: Date;
}

export interface Supplier {
  id: string;
  
  // Basic Information
  name: string;
  supplierCode?: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'service-provider' | 'other';
  category: string[];
  
  // Contact Information
  contact: ContactInfo;
  
  // Address Information
  billingAddress: Address;
  shippingAddress?: Address;
  
  // Business Information
  businessRegistrationNumber?: string;
  taxId?: string;
  vatNumber?: string;
  duns?: string;
  
  // Financial Information
  paymentTerms: string;
  creditLimit?: number;
  currency: string;
  banking?: BankingInfo;
  
  // Operational Information
  leadTime?: number; // in days
  minimumOrderValue?: number;
  shippingMethods: string[];
  incoterms?: string;
  
  // Certifications & Compliance
  certifications: string[];
  complianceStatus: 'compliant' | 'pending' | 'non-compliant';
  
  // Status & Performance
  status: 'active' | 'inactive' | 'suspended' | 'pending-approval';
  priority: 'high' | 'medium' | 'low';
  rating: number; // 1-5 stars
  riskLevel: 'low' | 'medium' | 'high';
  
  // Metrics
  metrics?: SupplierMetrics;
  
  // Additional Information
  notes?: string;
  tags: string[];
  documents: SupplierDocument[];
  
  // System Information
  createdBy?: string;
  updatedBy?: string;
  createdDate: Date;
  updatedDate: Date;
  lastContactDate?: Date;
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: 'certificate' | 'contract' | 'insurance' | 'tax-document' | 'other';
  url?: string;
  uploadDate: Date;
  expiryDate?: Date;
  description?: string;
}

export interface CreateSupplierRequest {
  name: string;
  type: Supplier['type'];
  category: string[];
  contact: ContactInfo;
  billingAddress: Address;
  shippingAddress?: Address;
  paymentTerms: string;
  currency: string;
  status?: Supplier['status'];
  priority?: Supplier['priority'];
  notes?: string;
  tags?: string[];
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string;
}

export interface SupplierFilters {
  search?: string;
  status?: Supplier['status'][];
  type?: Supplier['type'][];
  category?: string[];
  priority?: Supplier['priority'][];
  riskLevel?: Supplier['riskLevel'][];
  minRating?: number;
  maxCreditLimit?: number;
  tags?: string[];
}

export interface SupplierSortOptions {
  field: 'name' | 'rating' | 'createdDate' | 'lastContactDate' | 'totalOrders' | 'totalValue';
  direction: 'asc' | 'desc';
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}