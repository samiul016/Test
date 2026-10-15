import {
  ProductItem,
  Supplier,
  Customer,
  Purchase,
  Order,
  StockLedgerEntry,
  FinancialAccount,
  AccountTransaction,
  ExpenseItem,
  ReturnRecord,
  AppSettings,
  SavedPackage,
  CourierParcel,
  CourierApiSettings,
  PackagingMaterial,
} from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  shopName: 'GiftCraft Business Hub',
  shopPhone: '+880 1712-345678',
  shopAddress: 'House 42, Road 7/A, Dhanmondi, Dhaka - 1205',
  currencySymbol: '৳',
  timezone: 'Asia/Dhaka',
  dateFormat: 'DD-MM-YYYY',
  costingMethod: 'WAC',
  defaultDeliveryCharge: 120,
  defaultPackagingCharge: 150,
};

export const INITIAL_PRODUCTS: ProductItem[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_FINANCIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-1',
    name: 'Cash in Hand (Store Till)',
    type: 'cash',
    accountNumber: 'CASH-01',
    openingBalance: 0,
    currentBalance: 0,
    notes: 'Physical shop counter register for instant cash receipts and payments',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'bKash Merchant Account',
    type: 'bkash',
    accountNumber: '',
    openingBalance: 0,
    currentBalance: 0,
    notes: 'Official bKash Merchant Wallet for customer payments',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Bank Current A/C',
    type: 'bank',
    accountNumber: '',
    openingBalance: 0,
    currentBalance: 0,
    notes: 'Principal operational bank account',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ACCOUNT_TRANSACTIONS: AccountTransaction[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_STOCK_LEDGER: StockLedgerEntry[] = [];

export const INITIAL_RETURNS: ReturnRecord[] = [];

export const INITIAL_PACKAGES: SavedPackage[] = [];

export const INITIAL_PARCELS: CourierParcel[] = [];

export const INITIAL_COURIER_SETTINGS: CourierApiSettings = {
  defaultCourier: 'Pathao',
  pathaoStoreId: '',
  pathaoClientId: '',
  pathaoClientSecret: '',
  pathaoUsername: '',
  pathaoPassword: '',
};

export const INITIAL_PACKAGING_MATERIALS: PackagingMaterial[] = [
  {
    id: 'mat-1',
    name: 'Standard Delivery Box (বক্স)',
    category: 'box',
    unit: 'pcs',
    unitCost: 20,
    totalPurchasedQty: 100,
    totalPurchaseCost: 2000,
    stock: 100,
    minStockAlert: 15,
    notes: 'Corrugated carton box for secure parcel packing',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-2',
    name: 'Thank You Brand Sticker (স্টিকার)',
    category: 'sticker',
    unit: 'pcs',
    unitCost: 1,
    totalPurchasedQty: 500,
    totalPurchaseCost: 500,
    stock: 500,
    minStockAlert: 50,
    notes: 'Glossy logo brand sticker',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-3',
    name: 'Decorative Satin Ribbon (রিবন)',
    category: 'ribbon',
    unit: 'pcs',
    unitCost: 4,
    totalPurchasedQty: 100,
    totalPurchaseCost: 400,
    stock: 100,
    minStockAlert: 20,
    notes: 'Red/Gold satin ribbon per gift box',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-4',
    name: 'Packaging Security Tape (টেপ)',
    category: 'tape',
    unit: 'pcs',
    unitCost: 5,
    totalPurchasedQty: 50,
    totalPurchaseCost: 250,
    stock: 50,
    minStockAlert: 10,
    notes: 'Brown carton sealing tape allocation per parcel',
    createdAt: new Date().toISOString(),
  },
];
