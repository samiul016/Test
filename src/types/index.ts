export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'packaging'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'refunded' | 'cod';

export type StockMovementType =
  | 'purchase_receive'
  | 'sales_order'
  | 'sales_return_sellable'
  | 'sales_return_damaged'
  | 'purchase_return'
  | 'stock_adjustment'
  | 'damage_writeoff'
  | 'opening_stock';

export type AccountType = 'cash' | 'bank' | 'bkash' | 'nagad' | 'other';

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  description?: string;
  image?: string;
  unit: string; // pcs, box, pack, kg, set
  unitCost: number; // Weighted Average Cost / Purchase Cost
  suggestedSellingPrice: number; // Default Selling Price
  stock: number; // Physical available stock
  reservedStock: number; // Reserved in pending orders
  minStockAlert: number; // Low stock threshold
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  openingBalance: number;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  openingBalance?: number;
  totalOrders: number;
  totalPurchases: number;
  amountPaid: number;
  outstandingDue: number;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  lineDiscount: number;
  allocatedLandedCost: number;
  effectiveUnitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string; // e.g. PUR-2026-001
  supplierId: string;
  supplierName: string;
  purchaseDate: string; // YYYY-MM-DD
  invoiceReference?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  loadingCost: number;
  otherLandedCost: number;
  totalLandedCost: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentAccountId?: string;
  status: 'draft' | 'ordered' | 'received' | 'returned';
  isStockReceived: boolean;
  notes?: string;
  createdAt: string;
}

export interface PackageOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
  suggestedPrice?: number;
  sellingPrice?: number;
  discount?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCostSnapshot: number; // COGS snapshot
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-1001
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageTitle?: string;
  items: PackageOrderItem[];

  // Order Calculations
  subtotal: number; // sum of item sales price
  orderDiscount: number;
  deliveryFeeCharged: number;
  packagingCost: number;
  stickerCost: number;
  courierCost: number;
  otherOrderExpenses: number;
  totalAmount: number; // subtotal - orderDiscount + deliveryFeeCharged
  paidAmount: number;
  dueAmount: number;

  // Costs & Profit Breakdown
  totalProductCost: number; // COGS
  totalDirectCosts: number; // packaging + sticker + courier + other
  grossProfit: number; // (subtotal - orderDiscount) - totalProductCost
  contributionProfit: number; // grossProfit - totalDirectCosts + deliveryFeeCharged
  netProfit: number; // contributionProfit
  profitMargin: number;

  // Backward compatibility aliases
  sellingPrice?: number;
  transportCost?: number;
  totalCost?: number;
  discount?: number;

  // Packaging breakdown items (boxes, stickers, ribbon, tape, etc.)
  packagingItems?: SelectedPackagingItem[];

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentAccountId?: string;
  isStockDeducted: boolean;
  trackingNumber?: string;
  orderDate: string; // YYYY-MM-DD
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
}

export type PackagingCategory =
  | 'box'
  | 'sticker'
  | 'ribbon'
  | 'tape'
  | 'bag'
  | 'bubble_wrap'
  | 'other';

export interface PackagingMaterial {
  id: string;
  name: string; // e.g. "Gift Box Pink (Small)", "Brand Logo Sticker", "Red Satin Ribbon", "Transparent Tape"
  category: PackagingCategory;
  unit: string; // pcs, roll, sheet, meter
  unitCost: number; // cost per unit/piece in BDT (e.g. 20, 1.5, 4)
  totalPurchasedQty?: number; // total quantity bought (e.g. 100)
  totalPurchaseCost?: number; // total amount paid (e.g. 2000)
  stock: number; // current available stock count
  minStockAlert?: number; // low stock alert threshold (default 10)
  notes?: string;
  createdAt: string;
}

export interface SelectedPackagingItem {
  materialId: string;
  materialName: string;
  category?: PackagingCategory;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
}

export interface StockLedgerEntry {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  date: string;
  movementType: StockMovementType;
  quantityIn: number;
  quantityOut: number;
  referenceType: 'purchase' | 'order' | 'adjustment' | 'return';
  referenceNumber: string;
  unitCost: number;
  totalValue: number;
  balanceStockAfter: number;
  user: string;
  reason?: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  openingBalance: number;
  currentBalance: number;
  notes?: string;
  isDefault?: boolean;
  updatedAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  type:
    | 'customer_payment'
    | 'supplier_payment'
    | 'expense'
    | 'transfer_in'
    | 'transfer_out'
    | 'refund'
    | 'adjustment';
  amount: number;
  balanceAfter: number;
  referenceNumber?: string;
  description: string;
  linkedAccountId?: string;
  linkedAccountName?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Office Rent'
  | 'Salaries'
  | 'Advertising'
  | 'Internet and Electricity'
  | 'Packaging'
  | 'Stickers'
  | 'Delivery and Courier'
  | 'Transport'
  | 'Equipment'
  | 'Software and Subscriptions'
  | 'Other Expenses'
  | string;

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  title: string;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  date: string;
  paymentAccountId: string;
  paymentAccountName: string;
  paymentMethod: string;
  vendor?: string;
  notes?: string;
  createdBy: string;
  createdAt?: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  date: string;
  type: 'customer_sale' | 'supplier_purchase';
  referenceId: string;
  referenceNumber: string;
  partyName: string;
  productId: string;
  productName: string;
  quantity: number;
  condition: 'sellable' | 'damaged';
  refundAmount: number;
  refundAccountId?: string;
  reason: string;
  isStockUpdated: boolean;
  createdAt: string;
}

export interface AppSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  costingMethod: 'WAC' | 'FIFO';
  defaultDeliveryCharge: number;
  defaultPackagingCharge: number;
}

export interface SavedPackageItem {
  id: string;
  productId: string;
  quantity: number;
  isCustom?: boolean;
  customName?: string;
  customCostPrice?: number | '';
  customSellingPrice?: number | '';
  customUnit?: string;
}

export interface SavedPackage {
  id: string;
  name: string;
  description?: string;
  items: SavedPackageItem[];
  customSellingPrice?: number | '';
  defaultDeliveryCharge?: number | '';
  defaultPackagingCharge?: number | '';
  createdAt: string;
}

export type CourierPartner =
  | 'Pathao'
  | 'Steadfast'
  | 'RedX'
  | 'Paperfly'
  | 'Sundarban'
  | 'eCourier'
  | 'Custom';

export type CourierDeliveryType = 'inside_dhaka' | 'outside_dhaka' | 'sub_dhaka' | 'express';

export type CourierItemType = 'parcel' | 'fragile_gift' | 'gift_package' | 'box' | 'document';

export type CourierParcelStatus =
  | 'pending_pickup'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface CourierParcel {
  id: string;
  consignmentId: string; // e.g. PTH-892184 or ST-92104
  trackingCode: string; // e.g. TRK-782910
  orderId?: string;
  orderNumber?: string;
  courierPartner: CourierPartner;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity?: string;
  recipientZone?: string;
  recipientArea?: string;
  itemType: CourierItemType;
  itemDescription?: string;
  weightKg: number;
  numberOfItems: number;
  codAmount: number; // Cash on delivery collectable amount (৳)
  deliveryFee: number;
  deliveryType: CourierDeliveryType;
  specialInstructions?: string;
  status: CourierParcelStatus;
  statusHistory?: { status: CourierParcelStatus; timestamp: string; note?: string }[];
  dispatchedAt: string;
  deliveredAt?: string;
}

export interface CourierApiSettings {
  pathaoClientId?: string;
  pathaoClientSecret?: string;
  pathaoUsername?: string;
  pathaoPassword?: string;
  pathaoStoreId?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  redxApiKey?: string;
  defaultCourier: CourierPartner;
}

