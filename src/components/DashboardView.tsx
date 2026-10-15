import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  Receipt,
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Wallet,
  Building,
  Smartphone,
  ChevronRight,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ProductItem,
  Order,
  Purchase,
  ExpenseItem,
  Supplier,
  Customer,
  FinancialAccount,
} from '../types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  DateFilterPreset,
  isDateInRange,
} from '../utils/accounting';
import { TabType } from './Sidebar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  products: ProductItem[];
  orders: Order[];
  purchases: Purchase[];
  expenses: ExpenseItem[];
  suppliers: Supplier[];
  customers: Customer[];
  accounts: FinancialAccount[];
  onSelectTab: (tab: TabType) => void;
  onViewOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  purchases,
  expenses,
  suppliers,
  customers,
  accounts,
  onSelectTab,
  onViewOrder,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filtered orders, purchases, and expenses based on selected date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      isDateInRange(o.orderDate || o.createdAt, dateFilter, customStart, customEnd)
    );
  }, [orders, dateFilter, customStart, customEnd]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) =>
      isDateInRange(p.purchaseDate || p.createdAt, dateFilter, customStart, customEnd)
    );
  }, [purchases, dateFilter, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) =>
      isDateInRange(e.date || e.createdAt || '', dateFilter, customStart, customEnd)
    );
  }, [expenses, dateFilter, customStart, customEnd]);

  // Financial Metrics
  const totalSales = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalPurchases = useMemo(() => {
    return filteredPurchases
      .filter((p) => p.status !== 'draft')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [filteredPurchases]);

  const totalBusinessExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const grossProfit = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.grossProfit || 0), 0);
  }, [filteredOrders]);

  const netProfit = useMemo(() => {
    // Net profit = Delivered orders contribution profit - operating expenses recognized
    const orderContribution = filteredOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.contributionProfit || 0), 0);
    return orderContribution - totalBusinessExpenses;
  }, [filteredOrders, totalBusinessExpenses]);

  // Inventory Figures (Current Snapshot)
  const totalInventoryQuantity = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock || 0) * (p.unitCost || 0), 0);
  }, [products]);

  const totalProductsCount = products.length;

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock <= p.minStockAlert);
  }, [products]);

  // Orders Status Breakdown
  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'delivered').length;
  }, [orders]);

  const cancelledAndReturnedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'cancelled' || o.status === 'returned').length;
  }, [orders]);

  // Dues
  const customerOutstandingDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.outstandingDue || 0), 0);
  }, [customers]);

  const supplierOutstandingDues = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + Math.max(0, s.outstandingBalance || 0), 0);
  }, [suppliers]);

  // Financial Accounts Balances
  const cashInHand = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'cash')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const bankBalance = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'bank')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const mfsBalance = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'bkash' || a.type === 'nagad')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  // Chart data: Group orders & expenses by date
  const chartData = useMemo(() => {
    const daysMap = new Map<string, { date: string; sales: number; profit: number; expenses: number }>();
    
    // Sort orders by date
    filteredOrders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        const d = o.orderDate || o.createdAt.split('T')[0];
        const existing = daysMap.get(d) || { date: d, sales: 0, profit: 0, expenses: 0 };
        existing.sales += o.totalAmount || 0;
        existing.profit += o.contributionProfit || 0;
        daysMap.set(d, existing);
      });

    filteredExpenses.forEach((e) => {
      const d = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (d) {
        const existing = daysMap.get(d) || { date: d, sales: 0, profit: 0, expenses: 0 };
        existing.expenses += e.amount || 0;
        daysMap.set(d, existing);
      }
    });

    const arr = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    if (arr.length === 0) {
      // Default 7 days placeholder
      return [
        { date: 'Day 1', sales: 0, profit: 0, expenses: 0 },
        { date: 'Day 2', sales: 0, profit: 0, expenses: 0 },
      ];
    }
    return arr.map((item) => ({
      ...item,
      displayDate: formatDate(item.date).slice(0, 5), // DD-MM
    }));
  }, [filteredOrders, filteredExpenses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          Business Dashboard
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Real-time sales, inventory valuation, cash balances & profit analytics
        </p>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate text-amber-900 font-medium">
              <span className="font-bold">{lowStockProducts.length} Product(s)</span> are at or
              below minimum stock alert levels.
            </div>
          </div>
          <button
            onClick={() => onSelectTab('stock-ledger')}
            className="shrink-0 font-bold text-amber-800 hover:underline cursor-pointer"
          >
            Review Stock &rarr;
          </button>
        </div>
      )}

      {/* 1. Core Financial Performance Cards (2 per row on mobile!) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Financial & Profit Overview
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Sales */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Total Sales
              </span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCompactCurrency(totalSales)}
            </div>
          </div>

          {/* Total Purchases */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Total Purchases
              </span>
              <Truck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCompactCurrency(totalPurchases)}
            </div>
          </div>

          {/* Business Expenses */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Business Expenses
              </span>
              <Receipt className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCompactCurrency(totalBusinessExpenses)}
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Gross Profit
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-700 tracking-tight">
              {formatCompactCurrency(grossProfit)}
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Net Profit
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div
              className={`text-base sm:text-xl font-bold tracking-tight ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatCompactCurrency(netProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Inventory & Stock Valuation (2 per row on mobile!) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Inventory Valuation & Stock Status
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Total Stock Qty
              </span>
              <Boxes className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {totalInventoryQuantity}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Inventory Value
              </span>
              <Boxes className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCompactCurrency(totalInventoryValue)}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Active Products
              </span>
              <Boxes className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight">
              {totalProductsCount}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div
              className={`text-base sm:text-xl font-bold tracking-tight ${
                lowStockProducts.length > 0 ? 'text-amber-600' : 'text-neutral-900'
              }`}
            >
              {lowStockProducts.length}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Orders Pipeline & Outstanding Dues (2 per row on mobile!) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Order Pipeline & Balances
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Pending Orders
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-amber-700">
              {pendingOrdersCount}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Delivered Orders
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-700">
              {deliveredOrdersCount}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Cancelled / Return
              </span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-rose-700">
              {cancelledAndReturnedCount}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Customer Dues
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-blue-700">
              {formatCompactCurrency(customerOutstandingDues)}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Supplier Dues
              </span>
              <Building2 className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-orange-700">
              {formatCompactCurrency(supplierOutstandingDues)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Account Balances (Cash, Bank, bKash/Nagad) (2 per row on mobile!) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
          Live Financial Account Balances
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Cash in Hand
              </span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900">
              {formatCurrency(cashInHand)}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Bank Balance
              </span>
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900">
              {formatCurrency(bankBalance)}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                MFS (bKash & Nagad)
              </span>
              <Smartphone className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-900">
              {formatCurrency(mfsBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sales & Profit Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Revenue & Profit Dynamics</h3>
            <p className="text-xs text-neutral-500">Trend across selected date period</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-neutral-600">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-neutral-600">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="text-neutral-600">Expenses</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profitGrad)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#fb7185"
                strokeWidth={2}
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Recent Orders, Recent Purchases & Recent Expenses Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
              Recent Orders
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100 text-xs">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                onClick={() => onViewOrder(ord)}
                className="p-3 hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-neutral-900 truncate">
                    #{ord.orderNumber} &bull; {ord.customerName}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {formatDate(ord.orderDate)} &bull; {ord.status}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-neutral-900">
                    {formatCurrency(ord.totalAmount)}
                  </div>
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                    {ord.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
              Recent Purchases
            </div>
          </div>
          <div className="divide-y divide-neutral-100 text-xs">
            {purchases.slice(0, 5).map((pur) => (
              <div
                key={pur.id}
                className="p-3 hover:bg-neutral-50 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-neutral-900 truncate">
                    #{pur.purchaseNumber} &bull; {pur.supplierName}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {formatDate(pur.purchaseDate)} &bull; {pur.items.length} items
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-neutral-900">
                    {formatCurrency(pur.totalAmount)}
                  </div>
                  <div className="text-[10px] text-neutral-500">{pur.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
              Recent Expenses
            </div>
            <button
              onClick={() => onSelectTab('expenses')}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100 text-xs">
            {expenses.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                className="p-3 hover:bg-neutral-50 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-neutral-900 truncate">{exp.title}</div>
                  <div className="text-[10px] text-neutral-400">
                    {formatDate(exp.date)} &bull; {exp.category}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-rose-600">-{formatCurrency(exp.amount)}</div>
                  <div className="text-[10px] text-neutral-400">{exp.paymentAccountName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
