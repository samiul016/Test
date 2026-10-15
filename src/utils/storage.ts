import {
  ProductItem,
  Supplier,
  Customer,
  Purchase,
  Order,
  ExpenseItem,
  FinancialAccount,
  AccountTransaction,
  StockLedgerEntry,
  ReturnRecord,
  SavedPackage,
  AppSettings,
  CourierParcel,
  CourierApiSettings,
  PackagingMaterial,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PURCHASES,
  INITIAL_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_FINANCIAL_ACCOUNTS,
  INITIAL_ACCOUNT_TRANSACTIONS,
  INITIAL_STOCK_LEDGER,
  INITIAL_RETURNS,
  INITIAL_PACKAGES,
  INITIAL_SETTINGS,
  INITIAL_PARCELS,
  INITIAL_COURIER_SETTINGS,
  INITIAL_PACKAGING_MATERIALS,
} from '../data/initialData';

const V = 'biz_v5_clean_';
const PRODUCTS_KEY = `${V}products`;
const SUPPLIERS_KEY = `${V}suppliers`;
const CUSTOMERS_KEY = `${V}customers`;
const PURCHASES_KEY = `${V}purchases`;
const ORDERS_KEY = `${V}orders`;
const EXPENSES_KEY = `${V}expenses`;
const ACCOUNTS_KEY = `${V}accounts`;
const TRANSACTIONS_KEY = `${V}transactions`;
const STOCK_LEDGER_KEY = `${V}stock_ledger`;
const RETURNS_KEY = `${V}returns`;
const PACKAGES_KEY = `${V}packages`;
const SETTINGS_KEY = `${V}settings`;
const PARCELS_KEY = `${V}parcels`;
const COURIER_SETTINGS_KEY = `${V}courier_settings`;
const PACKAGING_MATERIALS_KEY = `${V}packaging_materials`;

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export const loadProducts = (): ProductItem[] => getStored(PRODUCTS_KEY, INITIAL_PRODUCTS);
export const saveProducts = (d: ProductItem[]) => setStored(PRODUCTS_KEY, d);

export const loadSuppliers = (): Supplier[] => getStored(SUPPLIERS_KEY, INITIAL_SUPPLIERS);
export const saveSuppliers = (d: Supplier[]) => setStored(SUPPLIERS_KEY, d);

export const loadCustomers = (): Customer[] => getStored(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
export const saveCustomers = (d: Customer[]) => setStored(CUSTOMERS_KEY, d);

export const loadPurchases = (): Purchase[] => getStored(PURCHASES_KEY, INITIAL_PURCHASES);
export const savePurchases = (d: Purchase[]) => setStored(PURCHASES_KEY, d);

export const loadOrders = (): Order[] => getStored(ORDERS_KEY, INITIAL_ORDERS);
export const saveOrders = (d: Order[]) => setStored(ORDERS_KEY, d);

export const loadExpenses = (): ExpenseItem[] => getStored(EXPENSES_KEY, INITIAL_EXPENSES);
export const saveExpenses = (d: ExpenseItem[]) => setStored(EXPENSES_KEY, d);

export const loadAccounts = (): FinancialAccount[] =>
  getStored(ACCOUNTS_KEY, INITIAL_FINANCIAL_ACCOUNTS);
export const saveAccounts = (d: FinancialAccount[]) => setStored(ACCOUNTS_KEY, d);

export const loadTransactions = (): AccountTransaction[] =>
  getStored(TRANSACTIONS_KEY, INITIAL_ACCOUNT_TRANSACTIONS);
export const saveTransactions = (d: AccountTransaction[]) => setStored(TRANSACTIONS_KEY, d);

export const loadStockLedger = (): StockLedgerEntry[] =>
  getStored(STOCK_LEDGER_KEY, INITIAL_STOCK_LEDGER);
export const saveStockLedger = (d: StockLedgerEntry[]) => setStored(STOCK_LEDGER_KEY, d);

export const loadReturns = (): ReturnRecord[] => getStored(RETURNS_KEY, INITIAL_RETURNS);
export const saveReturns = (d: ReturnRecord[]) => setStored(RETURNS_KEY, d);

export const loadPackages = (): SavedPackage[] => getStored(PACKAGES_KEY, INITIAL_PACKAGES);
export const savePackages = (d: SavedPackage[]) => setStored(PACKAGES_KEY, d);

export const loadSettings = (): AppSettings => getStored(SETTINGS_KEY, INITIAL_SETTINGS);
export const saveSettings = (d: AppSettings) => setStored(SETTINGS_KEY, d);

export const loadParcels = (): CourierParcel[] => getStored(PARCELS_KEY, INITIAL_PARCELS);
export const saveParcels = (d: CourierParcel[]) => setStored(PARCELS_KEY, d);

export const loadCourierSettings = (): CourierApiSettings =>
  getStored(COURIER_SETTINGS_KEY, INITIAL_COURIER_SETTINGS);
export const saveCourierSettings = (d: CourierApiSettings) =>
  setStored(COURIER_SETTINGS_KEY, d);

export const loadPackagingMaterials = (): PackagingMaterial[] =>
  getStored(PACKAGING_MATERIALS_KEY, INITIAL_PACKAGING_MATERIALS);
export const savePackagingMaterials = (d: PackagingMaterial[]) =>
  setStored(PACKAGING_MATERIALS_KEY, d);

export function resetAllData() {
  saveProducts(INITIAL_PRODUCTS);
  saveSuppliers(INITIAL_SUPPLIERS);
  saveCustomers(INITIAL_CUSTOMERS);
  savePurchases(INITIAL_PURCHASES);
  saveOrders(INITIAL_ORDERS);
  saveExpenses(INITIAL_EXPENSES);
  saveAccounts(INITIAL_FINANCIAL_ACCOUNTS);
  saveTransactions(INITIAL_ACCOUNT_TRANSACTIONS);
  saveStockLedger(INITIAL_STOCK_LEDGER);
  saveReturns(INITIAL_RETURNS);
  savePackages(INITIAL_PACKAGES);
  saveSettings(INITIAL_SETTINGS);
  saveParcels(INITIAL_PARCELS);
  saveCourierSettings(INITIAL_COURIER_SETTINGS);
  savePackagingMaterials(INITIAL_PACKAGING_MATERIALS);
  return {
    products: INITIAL_PRODUCTS,
    suppliers: INITIAL_SUPPLIERS,
    customers: INITIAL_CUSTOMERS,
    purchases: INITIAL_PURCHASES,
    orders: INITIAL_ORDERS,
    expenses: INITIAL_EXPENSES,
    accounts: INITIAL_FINANCIAL_ACCOUNTS,
    transactions: INITIAL_ACCOUNT_TRANSACTIONS,
    stockLedger: INITIAL_STOCK_LEDGER,
    returns: INITIAL_RETURNS,
    packages: INITIAL_PACKAGES,
    settings: INITIAL_SETTINGS,
    parcels: INITIAL_PARCELS,
    courierSettings: INITIAL_COURIER_SETTINGS,
  };
}

export function exportAllData(): string {
  const all = {
    products: loadProducts(),
    suppliers: loadSuppliers(),
    customers: loadCustomers(),
    purchases: loadPurchases(),
    orders: loadOrders(),
    expenses: loadExpenses(),
    accounts: loadAccounts(),
    transactions: loadTransactions(),
    stockLedger: loadStockLedger(),
    returns: loadReturns(),
    packages: loadPackages(),
    settings: loadSettings(),
    parcels: loadParcels(),
    courierSettings: loadCourierSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(all, null, 2);
}
