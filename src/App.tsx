import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
} from 'lucide-react';
import {
  ProductItem,
  Supplier,
  Customer,
  Purchase,
  Order,
  OrderStatus,
  StockMovementType,
  StockLedgerEntry,
  FinancialAccount,
  AccountTransaction,
  ExpenseItem,
  ReturnRecord,
  AppSettings,
  SavedPackage,
  CourierParcel,
  CourierApiSettings,
  CourierParcelStatus,
  PackagingMaterial,
} from './types';
import {
  loadProducts,
  saveProducts,
  loadSuppliers,
  saveSuppliers,
  loadCustomers,
  saveCustomers,
  loadPurchases,
  savePurchases,
  loadOrders,
  saveOrders,
  loadExpenses,
  saveExpenses,
  loadAccounts,
  saveAccounts,
  loadTransactions,
  saveTransactions,
  loadStockLedger,
  saveStockLedger,
  loadReturns,
  saveReturns,
  loadPackages,
  savePackages,
  loadSettings,
  saveSettings,
  loadParcels,
  saveParcels,
  loadCourierSettings,
  saveCourierSettings,
  loadPackagingMaterials,
  savePackagingMaterials,
  resetAllData,
  exportAllData,
} from './utils/storage';
import {
  calculateNewWeightedAverageCost,
  formatDate,
  getTodayString,
} from './utils/accounting';

import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { OrdersListView } from './components/OrdersListView';
import { CourierView } from './components/CourierView';
import { ProfitExpenseAnalyticsView } from './components/ProfitExpenseAnalyticsView';
import { PurchasesView } from './components/PurchasesView';
import { PurchaseModal } from './components/PurchaseModal';
import { StockLedgerView } from './components/StockLedgerView';
import { ProductListView } from './components/ProductListView';
import { PackagesView } from './components/PackagesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { ExpensesView } from './components/ExpensesView';
import { AccountsView } from './components/AccountsView';
import { ProfitLossView } from './components/ProfitLossView';
import { ReturnsView } from './components/ReturnsView';
import { OrderFormView } from './components/OrderFormView';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [products, setProducts] = useState<ProductItem[]>(loadProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(loadSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);
  const [purchases, setPurchases] = useState<Purchase[]>(loadPurchases);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(loadExpenses);
  const [accounts, setAccounts] = useState<FinancialAccount[]>(loadAccounts);
  const [transactions, setTransactions] = useState<AccountTransaction[]>(loadTransactions);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(loadStockLedger);
  const [returns, setReturns] = useState<ReturnRecord[]>(loadReturns);
  const [packages, setPackages] = useState<SavedPackage[]>(loadPackages);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [parcels, setParcels] = useState<CourierParcel[]>(loadParcels);
  const [courierSettings, setCourierSettings] = useState<CourierApiSettings>(loadCourierSettings);
  const [orderToDispatch, setOrderToDispatch] = useState<Order | null>(null);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>(loadPackagingMaterials);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedPackageForOrder, setSelectedPackageForOrder] = useState<SavedPackage | null>(null);
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  // Sync state to local storage
  useEffect(() => saveProducts(products), [products]);
  useEffect(() => saveSuppliers(suppliers), [suppliers]);
  useEffect(() => saveCustomers(customers), [customers]);
  useEffect(() => savePurchases(purchases), [purchases]);
  useEffect(() => saveOrders(orders), [orders]);
  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => saveAccounts(accounts), [accounts]);
  useEffect(() => saveTransactions(transactions), [transactions]);
  useEffect(() => saveStockLedger(stockLedger), [stockLedger]);
  useEffect(() => saveReturns(returns), [returns]);
  useEffect(() => savePackages(packages), [packages]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveParcels(parcels), [parcels]);
  useEffect(() => saveCourierSettings(courierSettings), [courierSettings]);
  useEffect(() => savePackagingMaterials(packagingMaterials), [packagingMaterials]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // 1. Order Saving & Customer Ledger Sync
  const handleSaveOrder = (newOrder: Order, shouldDeductStock: boolean) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Update customer stats
    setCustomers((prev) => {
      const existing = prev.find(
        (c) =>
          c.id === newOrder.customerId ||
          c.phone === newOrder.customerPhone ||
          c.name.toLowerCase() === newOrder.customerName.toLowerCase()
      );
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalPurchases: c.totalPurchases + newOrder.totalAmount,
                amountPaid: c.amountPaid + (newOrder.paidAmount || 0),
                outstandingDue: c.outstandingDue + (newOrder.dueAmount || 0),
              }
            : c
        );
      }
      // Create new customer if not found
      const created: Customer = {
        id: `cust-${Date.now()}`,
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        address: newOrder.customerAddress,
        totalOrders: 1,
        totalPurchases: newOrder.totalAmount,
        amountPaid: newOrder.paidAmount || 0,
        outstandingDue: newOrder.dueAmount || 0,
        createdAt: getTodayString(),
      };
      return [created, ...prev];
    });

    // Deduct stock & create ledger entries
    if (shouldDeductStock) {
      newOrder.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          const ledgerEntry: StockLedgerEntry = {
            id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            date: newOrder.orderDate || getTodayString(),
            movementType: 'sales_order',
            quantityIn: 0,
            quantityOut: item.quantity,
            referenceType: 'order',
            referenceNumber: newOrder.orderNumber,
            unitCost: prod.unitCost,
            totalValue: prod.unitCost * item.quantity,
            balanceStockAfter: newStock,
            user: 'Sales Dispatch',
            reason: `Order #${newOrder.orderNumber} for ${newOrder.customerName}`,
            createdAt: new Date().toISOString(),
          };
          setStockLedger((l) => [ledgerEntry, ...l]);
        }
      });

      setProducts((prev) => {
        return prev.map((prod) => {
          const matched = newOrder.items.find((it) => it.productId === prod.id);
          if (matched) {
            return { ...prod, stock: Math.max(0, prod.stock - matched.quantity) };
          }
          return prod;
        });
      });

      // Deduct packaging materials stock if materials were used
      if (newOrder.packagingItems && newOrder.packagingItems.length > 0) {
        setPackagingMaterials((prev) =>
          prev.map((mat) => {
            const used = newOrder.packagingItems?.find((it) => it.materialId === mat.id);
            if (used) {
              return { ...mat, stock: Math.max(0, mat.stock - used.quantity) };
            }
            return mat;
          })
        );
      }
    }

    showToast(`Order #${newOrder.orderNumber} created successfully!`, 'success');
    setSelectedOrderForInvoice(newOrder);
    setCurrentTab('orders');
  };

  // Order Status update with stock reversal on cancellation
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (newStatus === 'cancelled' && order.isStockDeducted) {
      // Revert product stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = order.items.find((it) => it.productId === p.id);
          if (item) {
            return { ...p, stock: p.stock + item.quantity };
          }
          return p;
        })
      );

      // Revert packaging materials stock if materials were used
      if (order.packagingItems && order.packagingItems.length > 0) {
        setPackagingMaterials((prev) =>
          prev.map((mat) => {
            const used = order.packagingItems?.find((it) => it.materialId === mat.id);
            if (used) {
              return { ...mat, stock: mat.stock + used.quantity };
            }
            return mat;
          })
        );
      }
      // Log stock return
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const ledgerEntry: StockLedgerEntry = {
            id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            date: getTodayString(),
            movementType: 'stock_adjustment',
            quantityIn: item.quantity,
            quantityOut: 0,
            referenceType: 'order',
            referenceNumber: order.orderNumber,
            unitCost: prod.unitCost,
            totalValue: prod.unitCost * item.quantity,
            balanceStockAfter: prod.stock + item.quantity,
            user: 'System Reversal',
            reason: `Order #${order.orderNumber} Cancelled - Inventory Restored`,
            createdAt: new Date().toISOString(),
          };
          setStockLedger((l) => [ledgerEntry, ...l]);
        }
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              isStockDeducted: newStatus === 'cancelled' ? false : o.isStockDeducted,
            }
          : o
      )
    );
    showToast(`Order status updated to ${newStatus}`, 'info');
  };

  // Record Order Partial/Full Payment
  const handleRecordOrderPayment = (orderId: string, amount: number, accountId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const account = accounts.find((a) => a.id === accountId);
    if (!order || !account) return;

    const newPaid = (order.paidAmount || 0) + amount;
    const total = order.totalAmount ?? order.sellingPrice ?? 0;
    const newDue = Math.max(0, total - newPaid);
    const newPayStatus = newDue <= 0 ? 'paid' : 'partial';

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paidAmount: newPaid,
              dueAmount: newDue,
              paymentStatus: newPayStatus,
            }
          : o
      )
    );

    // Update account balance
    const newAccBalance = account.currentBalance + amount;
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, currentBalance: newAccBalance } : a))
    );

    // Create Account Transaction
    const tx: AccountTransaction = {
      id: `tx-${Date.now()}`,
      accountId,
      accountName: account.name,
      date: getTodayString(),
      type: 'customer_payment',
      amount,
      balanceAfter: newAccBalance,
      referenceNumber: order.orderNumber,
      description: `Payment received for Order #${order.orderNumber} (${order.customerName})`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    // Update Customer Dues
    setCustomers((prev) =>
      prev.map((c) =>
        c.phone === order.customerPhone || c.name === order.customerName
          ? {
              ...c,
              amountPaid: c.amountPaid + amount,
              outstandingDue: Math.max(0, c.outstandingDue - amount),
            }
          : c
      )
    );

    showToast(`Payment of ৳${amount} recorded for Order #${order.orderNumber}!`, 'success');
  };

  // 2. Purchases & WAC Inventory Valuation
  const handleSavePurchase = (newPurchase: Purchase) => {
    setPurchases((prev) => [newPurchase, ...prev]);

    // Update Supplier Balance
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === newPurchase.supplierId) {
          const totalPur = s.totalPurchases + newPurchase.totalAmount;
          const totalPaid = s.totalPaid + newPurchase.paidAmount;
          const outBalance = s.openingBalance + totalPur - totalPaid;
          return {
            ...s,
            totalPurchases: totalPur,
            totalPaid: totalPaid,
            outstandingBalance: outBalance,
          };
        }
        return s;
      })
    );

    // If purchase paid immediately from an account
    if (newPurchase.paidAmount > 0 && newPurchase.paymentAccountId) {
      const account = accounts.find((a) => a.id === newPurchase.paymentAccountId);
      if (account) {
        const newBal = account.currentBalance - newPurchase.paidAmount;
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, currentBalance: newBal } : a))
        );
        const tx: AccountTransaction = {
          id: `tx-${Date.now()}`,
          accountId: account.id,
          accountName: account.name,
          date: newPurchase.purchaseDate,
          type: 'supplier_payment',
          amount: -newPurchase.paidAmount,
          balanceAfter: newBal,
          referenceNumber: newPurchase.purchaseNumber,
          description: `Disbursed for Purchase #${newPurchase.purchaseNumber} (${newPurchase.supplierName})`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [tx, ...prev]);
      }
    }

    // If received, update stock and recalculate Weighted Average Cost (WAC)
    if (newPurchase.status === 'received') {
      newPurchase.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newWAC = calculateNewWeightedAverageCost(
            prod.stock,
            prod.unitCost,
            item.quantity,
            item.effectiveUnitCost
          );
          const newStock = prod.stock + item.quantity;

          const ledgerEntry: StockLedgerEntry = {
            id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            date: newPurchase.purchaseDate,
            movementType: 'purchase_receive',
            quantityIn: item.quantity,
            quantityOut: 0,
            referenceType: 'purchase',
            referenceNumber: newPurchase.purchaseNumber,
            unitCost: item.effectiveUnitCost,
            totalValue: item.totalCost,
            balanceStockAfter: newStock,
            user: 'Purchase Intake',
            reason: `PO #${newPurchase.purchaseNumber} from ${newPurchase.supplierName}`,
            createdAt: new Date().toISOString(),
          };
          setStockLedger((l) => [ledgerEntry, ...l]);
        }
      });

      setProducts((prev) =>
        prev.map((prod) => {
          const matched = newPurchase.items.find((it) => it.productId === prod.id);
          if (matched) {
            const newWAC = calculateNewWeightedAverageCost(
              prod.stock,
              prod.unitCost,
              matched.quantity,
              matched.effectiveUnitCost
            );
            return {
              ...prod,
              stock: prod.stock + matched.quantity,
              unitCost: newWAC,
            };
          }
          return prod;
        })
      );
    }

    showToast(`Purchase invoice #${newPurchase.purchaseNumber} saved!`, 'success');
  };

  const handleReceivePurchase = (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase || purchase.status === 'received') return;

    purchase.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const newWAC = calculateNewWeightedAverageCost(
          prod.stock,
          prod.unitCost,
          item.quantity,
          item.effectiveUnitCost
        );
        const newStock = prod.stock + item.quantity;
        const ledgerEntry: StockLedgerEntry = {
          id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          date: getTodayString(),
          movementType: 'purchase_receive',
          quantityIn: item.quantity,
          quantityOut: 0,
          referenceType: 'purchase',
          referenceNumber: purchase.purchaseNumber,
          unitCost: item.effectiveUnitCost,
          totalValue: item.totalCost,
          balanceStockAfter: newStock,
          user: 'Warehouse Receiver',
          reason: `PO #${purchase.purchaseNumber} received from ${purchase.supplierName}`,
          createdAt: new Date().toISOString(),
        };
        setStockLedger((l) => [ledgerEntry, ...l]);
      }
    });

    setProducts((prev) =>
      prev.map((prod) => {
        const matched = purchase.items.find((it) => it.productId === prod.id);
        if (matched) {
          const newWAC = calculateNewWeightedAverageCost(
            prod.stock,
            prod.unitCost,
            matched.quantity,
            matched.effectiveUnitCost
          );
          return {
            ...prod,
            stock: prod.stock + matched.quantity,
            unitCost: newWAC,
          };
        }
        return prod;
      })
    );

    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId ? { ...p, status: 'received', isStockReceived: true } : p
      )
    );

    showToast(`PO #${purchase.purchaseNumber} received. Stock & WAC updated!`, 'success');
  };

  // 3. Stock Adjustment & Reconciliation
  const handleAddStockAdjustment = (
    productId: string,
    delta: number,
    movementType: StockMovementType,
    reason: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newStock = Math.max(0, prod.stock + delta);
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));

    const ledgerEntry: StockLedgerEntry = {
      id: `sl-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      date: getTodayString(),
      movementType,
      quantityIn: delta > 0 ? delta : 0,
      quantityOut: delta < 0 ? Math.abs(delta) : 0,
      referenceType: 'adjustment',
      referenceNumber: `ADJ-${Date.now().toString().slice(-4)}`,
      unitCost: prod.unitCost,
      totalValue: Math.abs(delta) * prod.unitCost,
      balanceStockAfter: newStock,
      user: 'Stock Auditor',
      reason,
      createdAt: new Date().toISOString(),
    };
    setStockLedger((prev) => [ledgerEntry, ...prev]);

    showToast(`Stock updated for ${prod.name}: ${newStock} units`, 'info');
  };

  // 4. Expense Recording
  const handleAddExpense = (expense: ExpenseItem) => {
    setExpenses((prev) => [expense, ...prev]);

    // Deduct from financial account
    const account = accounts.find((a) => a.id === expense.paymentAccountId);
    if (account) {
      const newBal = account.currentBalance - expense.amount;
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, currentBalance: newBal } : a))
      );

      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: account.id,
        accountName: account.name,
        date: expense.date,
        type: 'expense',
        amount: -expense.amount,
        balanceAfter: newBal,
        referenceNumber: expense.expenseNumber,
        description: `${expense.category}: ${expense.title}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    showToast(`Expense #${expense.expenseNumber} recorded!`, 'success');
  };

  // Packaging Materials Handlers (Boxes, Stickers, Ribbons, Tapes)
  const handleAddPackagingMaterial = (mat: PackagingMaterial) => {
    setPackagingMaterials((prev) => [mat, ...prev]);
    showToast(`ম্যাটেরিয়াল "${mat.name}" যুক্ত করা হয়েছে!`, 'success');
  };

  const handleUpdatePackagingMaterial = (mat: PackagingMaterial) => {
    setPackagingMaterials((prev) => prev.map((m) => (m.id === mat.id ? mat : m)));
    showToast(`ম্যাটেরিয়াল "${mat.name}" আপডেট করা হয়েছে!`, 'success');
  };

  const handleDeletePackagingMaterial = (id: string) => {
    setPackagingMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast('ম্যাটেরিয়াল মুছে ফেলা হয়েছে', 'info');
  };

  const handleAdjustPackagingStock = (id: string, delta: number) => {
    setPackagingMaterials((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStock = Math.max(0, m.stock + delta);
          return { ...m, stock: nextStock };
        }
        return m;
      })
    );
    showToast('ম্যাটেরিয়াল স্টক সমন্বয় করা হয়েছে', 'success');
  };

  // 5. Financial Account Transfers
  const handleTransferFunds = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes: string
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    const fromNewBal = fromAcc.currentBalance - amount;
    const toNewBal = toAcc.currentBalance + amount;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === fromAccountId) return { ...a, currentBalance: fromNewBal };
        if (a.id === toAccountId) return { ...a, currentBalance: toNewBal };
        return a;
      })
    );

    const refNum = `TRF-${Date.now().toString().slice(-4)}`;
    const txOut: AccountTransaction = {
      id: `tx-${Date.now()}-out`,
      accountId: fromAcc.id,
      accountName: fromAcc.name,
      date: getTodayString(),
      type: 'transfer_out',
      amount: -amount,
      balanceAfter: fromNewBal,
      referenceNumber: refNum,
      description: `Transfer to ${toAcc.name}${notes ? ` - ${notes}` : ''}`,
      linkedAccountId: toAcc.id,
      linkedAccountName: toAcc.name,
      createdAt: new Date().toISOString(),
    };
    const txIn: AccountTransaction = {
      id: `tx-${Date.now()}-in`,
      accountId: toAcc.id,
      accountName: toAcc.name,
      date: getTodayString(),
      type: 'transfer_in',
      amount: amount,
      balanceAfter: toNewBal,
      referenceNumber: refNum,
      description: `Transfer from ${fromAcc.name}${notes ? ` - ${notes}` : ''}`,
      linkedAccountId: fromAcc.id,
      linkedAccountName: fromAcc.name,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [txIn, txOut, ...prev]);
    showToast(`Transferred ৳${amount} from ${fromAcc.name} to ${toAcc.name}!`, 'success');
  };

  const handleAdjustBalance = (accountId: string, newBalance: number, reason: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const diff = newBalance - account.currentBalance;
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, currentBalance: newBalance } : a))
    );

    const tx: AccountTransaction = {
      id: `tx-${Date.now()}`,
      accountId,
      accountName: account.name,
      date: getTodayString(),
      type: 'adjustment',
      amount: diff,
      balanceAfter: newBalance,
      referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
      description: `Reconciliation adjustment: ${reason}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    showToast(`Account balance reconciled for ${account.name}`, 'info');
  };

  // 6. Supplier Payment Recording
  const handleRecordSupplierPayment = (
    supplierId: string,
    amount: number,
    accountId: string,
    payNotes: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const account = accounts.find((a) => a.id === accountId);
    if (!supplier || !account) return;

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              totalPaid: s.totalPaid + amount,
              outstandingBalance: Math.max(0, s.outstandingBalance - amount),
            }
          : s
      )
    );

    const newAccBal = account.currentBalance - amount;
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, currentBalance: newAccBal } : a))
    );

    const tx: AccountTransaction = {
      id: `tx-${Date.now()}`,
      accountId,
      accountName: account.name,
      date: getTodayString(),
      type: 'supplier_payment',
      amount: -amount,
      balanceAfter: newAccBal,
      referenceNumber: `PMT-${Date.now().toString().slice(-4)}`,
      description: `Settled payment to supplier ${supplier.companyName} (${payNotes || 'Due clearance'})`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    showToast(`Payment of ৳${amount} disbursed to ${supplier.companyName}!`, 'success');
  };

  // 7. Customer Payment Collection
  const handleRecordCustomerPayment = (
    customerId: string,
    amount: number,
    accountId: string,
    colNotes: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    const account = accounts.find((a) => a.id === accountId);
    if (!customer || !account) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              amountPaid: c.amountPaid + amount,
              outstandingDue: Math.max(0, c.outstandingDue - amount),
            }
          : c
      )
    );

    const newAccBal = account.currentBalance + amount;
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, currentBalance: newAccBal } : a))
    );

    const tx: AccountTransaction = {
      id: `tx-${Date.now()}`,
      accountId,
      accountName: account.name,
      date: getTodayString(),
      type: 'customer_payment',
      amount: amount,
      balanceAfter: newAccBal,
      referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
      description: `Customer due collected from ${customer.name} (${colNotes || 'Receipt'})`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    showToast(`Collected ৳${amount} from ${customer.name}!`, 'success');
  };

  // 8. Returns and Restocks
  const handleAddReturn = (record: ReturnRecord, shouldRestock: boolean) => {
    setReturns((prev) => [record, ...prev]);

    const prod = products.find((p) => p.id === record.productId);

    if (shouldRestock && prod) {
      const newStock = prod.stock + record.quantity;
      setProducts((prev) =>
        prev.map((p) => (p.id === record.productId ? { ...p, stock: newStock } : p))
      );

      const ledgerEntry: StockLedgerEntry = {
        id: `sl-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        date: record.date,
        movementType: 'sales_return_sellable',
        quantityIn: record.quantity,
        quantityOut: 0,
        referenceType: 'return',
        referenceNumber: record.returnNumber,
        unitCost: prod.unitCost,
        totalValue: prod.unitCost * record.quantity,
        balanceStockAfter: newStock,
        user: 'Return Officer',
        reason: `Restocked return from ${record.partyName}: ${record.reason}`,
        createdAt: new Date().toISOString(),
      };
      setStockLedger((l) => [ledgerEntry, ...l]);
    } else if (record.condition === 'damaged' && prod) {
      const ledgerEntry: StockLedgerEntry = {
        id: `sl-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        date: record.date,
        movementType: 'sales_return_damaged',
        quantityIn: 0,
        quantityOut: 0,
        referenceType: 'return',
        referenceNumber: record.returnNumber,
        unitCost: prod.unitCost,
        totalValue: 0,
        balanceStockAfter: prod.stock,
        user: 'Return Officer',
        reason: `Damaged item return from ${record.partyName} (Not added to sellable stock)`,
        createdAt: new Date().toISOString(),
      };
      setStockLedger((l) => [ledgerEntry, ...l]);
    }

    // Refund disbursement from account
    if (record.refundAmount > 0 && record.refundAccountId) {
      const account = accounts.find((a) => a.id === record.refundAccountId);
      if (account) {
        const newBal = account.currentBalance - record.refundAmount;
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, currentBalance: newBal } : a))
        );
        const tx: AccountTransaction = {
          id: `tx-${Date.now()}`,
          accountId: account.id,
          accountName: account.name,
          date: record.date,
          type: 'refund',
          amount: -record.refundAmount,
          balanceAfter: newBal,
          referenceNumber: record.returnNumber,
          description: `Customer refund disbursed for Return #${record.returnNumber} (${record.partyName})`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [tx, ...prev]);
      }
    }

    showToast(`Return #${record.returnNumber} processed successfully!`, 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-2xl transition-all">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Mobile Top Header (Menu button strictly on the LEFT as requested!) */}
      <div className="md:hidden bg-white border-b border-neutral-200 px-3.5 py-2.5 flex items-center justify-between no-print sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-neutral-900 text-xs tracking-tight truncate max-w-[170px]">
            {settings.shopName}
          </span>
        </div>

        {/* No 'New Order' button per instructions */}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => {
              if (tab === 'new-purchase') {
                setIsNewPurchaseModalOpen(true);
              } else {
                setCurrentTab(tab);
              }
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            shopName={settings.shopName}
          />
        </div>

        {/* Mobile Drawer (opens from LEFT) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-white h-full shadow-2xl z-50 flex flex-col">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  if (tab === 'new-purchase') {
                    setIsNewPurchaseModalOpen(true);
                  } else {
                    setCurrentTab(tab);
                  }
                  setIsMobileMenuOpen(false);
                }}
                onOpenSettings={() => {
                  setIsSettingsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                shopName={settings.shopName}
              />
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              purchases={purchases}
              expenses={expenses}
              suppliers={suppliers}
              customers={customers}
              accounts={accounts}
              onSelectTab={(tab) => {
                if (tab === 'new-purchase') setIsNewPurchaseModalOpen(true);
                else setCurrentTab(tab);
              }}
              onViewOrder={(ord) => setSelectedOrderForInvoice(ord)}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersListView
              orders={orders}
              accounts={accounts}
              onOpenOrderDetails={(ord) => setSelectedOrderForInvoice(ord)}
              onUpdateStatus={handleUpdateOrderStatus}
              onRecordOrderPayment={handleRecordOrderPayment}
              onDeleteOrder={(orderId) => {
                if (confirm('Delete this order?')) {
                  setOrders((prev) => prev.filter((o) => o.id !== orderId));
                  showToast('Order removed', 'info');
                }
              }}
              onAddNewOrder={() => setCurrentTab('new-order')}
              onSendToCourier={(ord) => {
                setOrderToDispatch(ord);
                setCurrentTab('courier');
              }}
            />
          )}

          {currentTab === 'courier' && (
            <CourierView
              parcels={parcels}
              orders={orders}
              settings={settings}
              courierSettings={courierSettings}
              initialOrderToDispatch={orderToDispatch}
              onClearInitialOrder={() => setOrderToDispatch(null)}
              onSaveParcel={(newParcel) => {
                setParcels((prev) => [newParcel, ...prev]);
                showToast(
                  `Parcel ${newParcel.consignmentId} dispatched via ${newParcel.courierPartner}!`,
                  'success'
                );
              }}
              onUpdateParcelStatus={(id, status) => {
                setParcels((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, status } : p))
                );
                showToast('Parcel delivery status updated', 'info');
              }}
              onDeleteParcel={(id) => {
                setParcels((prev) => prev.filter((p) => p.id !== id));
                showToast('Parcel removed from courier log', 'info');
              }}
              onSaveCourierSettings={(s) => {
                setCourierSettings(s);
                showToast('Courier API credentials saved', 'success');
              }}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {currentTab === 'profit-expense-analytics' && (
            <ProfitExpenseAnalyticsView
              orders={orders}
              expenses={expenses}
              accounts={accounts}
              onAddExpense={handleAddExpense}
              onDeleteExpense={(id) => {
                setExpenses((prev) => prev.filter((e) => e.id !== id));
                showToast('Expense record deleted', 'info');
              }}
            />
          )}

          {currentTab === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              accounts={accounts}
              onOpenNewPurchase={() => setIsNewPurchaseModalOpen(true)}
              onReceivePurchase={handleReceivePurchase}
              onRecordSupplierPayment={(sId, amt, aId, notes) =>
                handleRecordSupplierPayment(sId, amt, aId, notes || '')
              }
            />
          )}

          {currentTab === 'stock-ledger' && (
            <StockLedgerView
              products={products}
              ledger={stockLedger}
              onAddStockAdjustment={handleAddStockAdjustment}
            />
          )}

          {currentTab === 'products' && (
            <ProductListView
              products={products}
              orders={orders}
              purchases={purchases}
              packagingMaterials={packagingMaterials}
              onAddProduct={(prod) => {
                setProducts((prev) => [prod, ...prev]);
                showToast(`Product "${prod.name}" added!`, 'success');
              }}
              onUpdateProduct={(prod) => {
                setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
                showToast(`Product "${prod.name}" updated!`, 'success');
              }}
              onDeleteProduct={(id) => {
                setProducts((prev) => prev.filter((p) => p.id !== id));
                showToast('Product deleted', 'info');
              }}
              onBulkImport={(newProds) => {
                setProducts((prev) => [...newProds, ...prev]);
                showToast(`Imported ${newProds.length} products!`, 'success');
              }}
              onAddPackagingMaterial={handleAddPackagingMaterial}
              onUpdatePackagingMaterial={handleUpdatePackagingMaterial}
              onDeletePackagingMaterial={handleDeletePackagingMaterial}
              onAdjustPackagingStock={handleAdjustPackagingStock}
            />
          )}

          {currentTab === 'packages' && (
            <PackagesView
              packages={packages}
              products={products}
              onSelectPackageForOrder={(pkg) => {
                setSelectedPackageForOrder(pkg);
                setCurrentTab('new-order');
              }}
              onSavePackage={(newPkg) => {
                setPackages((prev) => [newPkg, ...prev]);
                showToast(`Package "${newPkg.name}" saved!`, 'success');
              }}
              onUpdatePackage={(upPkg) => {
                setPackages((prev) => prev.map((p) => (p.id === upPkg.id ? upPkg : p)));
                showToast(`Package updated!`, 'success');
              }}
              onDeletePackage={(id) => {
                setPackages((prev) => prev.filter((p) => p.id !== id));
                showToast('Package deleted', 'info');
              }}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              orders={orders}
              accounts={accounts}
              onAddCustomer={(c) => {
                setCustomers((prev) => [c, ...prev]);
                showToast(`Customer "${c.name}" registered!`, 'success');
              }}
              onRecordCustomerPayment={handleRecordCustomerPayment}
            />
          )}

          {currentTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              purchases={purchases}
              accounts={accounts}
              onAddSupplier={(s) => {
                setSuppliers((prev) => [s, ...prev]);
                showToast(`Supplier "${s.companyName}" registered!`, 'success');
              }}
              onUpdateSupplier={(s) => {
                setSuppliers((prev) => prev.map((sup) => (sup.id === s.id ? s : sup)));
                showToast(`Supplier updated!`, 'success');
              }}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              accounts={accounts}
              onAddExpense={handleAddExpense}
              onDeleteExpense={(id) => {
                setExpenses((prev) => prev.filter((e) => e.id !== id));
                showToast('Expense record deleted', 'info');
              }}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              transactions={transactions}
              onAddAccount={(acc) => {
                setAccounts((prev) => [...prev, acc]);
                showToast(`Account "${acc.name}" added!`, 'success');
              }}
              onTransferFunds={handleTransferFunds}
              onAdjustBalance={handleAdjustBalance}
              onDeleteTransaction={(txId) => {
                setTransactions((prev) => prev.filter((t) => t.id !== txId));
                showToast('Transaction record deleted from ledger', 'info');
              }}
              onDeleteAccount={(accId) => {
                if (accounts.length <= 1) {
                  showToast('Cannot delete the last remaining account', 'error');
                  return;
                }
                setAccounts((prev) => prev.filter((a) => a.id !== accId));
                setTransactions((prev) => prev.filter((t) => t.accountId !== accId));
                showToast('Account removed', 'info');
              }}
            />
          )}

          {currentTab === 'profit-loss' && (
            <ProfitLossView
              orders={orders}
              expenses={expenses}
              products={products}
              returns={returns}
            />
          )}

          {currentTab === 'returns' && (
            <ReturnsView
              returns={returns}
              orders={orders}
              purchases={purchases}
              products={products}
              accounts={accounts}
              onAddReturn={handleAddReturn}
            />
          )}

          {currentTab === 'new-order' && (
            <OrderFormView
              products={products}
              settings={settings}
              packages={packages}
              initialPackage={selectedPackageForOrder}
              packagingMaterials={packagingMaterials}
              onSaveOrder={handleSaveOrder}
              onAddNewProduct={(p) => setProducts((prev) => [p, ...prev])}
              onQuickAddPackagingMaterial={handleAddPackagingMaterial}
              onCancel={() => {
                setSelectedPackageForOrder(null);
                setCurrentTab('dashboard');
              }}
            />
          )}
        </main>
      </div>

      {/* Purchase Invoice Creation Modal */}
      <PurchaseModal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        products={products}
        suppliers={suppliers}
        accounts={accounts}
        onSavePurchase={handleSavePurchase}
      />

      {/* Invoice & Packing Slip Modal */}
      <OrderInvoiceModal
        order={selectedOrderForInvoice}
        settings={settings}
        onClose={() => setSelectedOrderForInvoice(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          showToast('Settings saved!', 'success');
        }}
        onResetAllData={() => {
          if (confirm('Reset all demo data back to factory defaults?')) {
            const fresh = resetAllData();
            setProducts(fresh.products);
            setSuppliers(fresh.suppliers);
            setCustomers(fresh.customers);
            setPurchases(fresh.purchases);
            setOrders(fresh.orders);
            setExpenses(fresh.expenses);
            setAccounts(fresh.accounts);
            setTransactions(fresh.transactions);
            setStockLedger(fresh.stockLedger);
            setReturns(fresh.returns);
            setPackages(fresh.packages);
            setSettings(fresh.settings);
            showToast('Factory demo data restored!', 'info');
          }
        }}
        onClearTransactions={() => {
          if (
            confirm(
              'Clear all orders, purchases, expenses, and returns to start fresh? (Catalog products and settings will be preserved)'
            )
          ) {
            setOrders([]);
            setPurchases([]);
            setExpenses([]);
            setReturns([]);
            setTransactions([]);
            setStockLedger([]);
            setCustomers((prev) =>
              prev.map((c) => ({
                ...c,
                totalOrders: 0,
                totalPurchases: 0,
                amountPaid: 0,
                outstandingDue: 0,
              }))
            );
            setSuppliers((prev) =>
              prev.map((s) => ({
                ...s,
                totalPurchases: 0,
                totalPaid: 0,
                outstandingBalance: s.openingBalance,
              }))
            );
            showToast('All transaction records cleared! Dashboard is now 0 dues & 0 sales.', 'info');
          }
        }}
        onExportData={() => {
          const jsonStr = exportAllData();
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `backup_${settings.shopName.replace(/\s+/g, '_')}_${getTodayString()}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        }}
      />
    </div>
  );
}
