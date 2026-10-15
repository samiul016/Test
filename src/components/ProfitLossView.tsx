import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  FileText,
  Printer,
  ChevronDown,
  Layers,
  ShoppingBag,
  DollarSign,
  PieChart,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Order, ExpenseItem, ProductItem, ReturnRecord } from '../types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  DateFilterPreset,
  isDateInRange,
} from '../utils/accounting';

interface ProfitLossViewProps {
  orders: Order[];
  expenses: ExpenseItem[];
  products: ProductItem[];
  returns: ReturnRecord[];
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  orders,
  expenses,
  products,
  returns,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'statement' | 'product_breakdown' | 'order_breakdown'>(
    'statement'
  );

  // Filter by date
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== 'cancelled' &&
        isDateInRange(o.orderDate || o.createdAt, dateFilter, customStart, customEnd)
    );
  }, [orders, dateFilter, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) =>
      isDateInRange(e.date || e.createdAt || '', dateFilter, customStart, customEnd)
    );
  }, [expenses, dateFilter, customStart, customEnd]);

  const filteredReturns = useMemo(() => {
    return returns.filter(
      (r) =>
        r.type === 'customer_sale' &&
        isDateInRange(r.date || r.createdAt, dateFilter, customStart, customEnd)
    );
  }, [returns, dateFilter, customStart, customEnd]);

  // Financial Line Calculations
  const grossSales = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  }, [filteredOrders]);

  const totalDiscounts = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.orderDiscount || 0), 0);
  }, [filteredOrders]);

  const salesReturns = useMemo(() => {
    return filteredReturns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  }, [filteredReturns]);

  const netSales = Math.max(0, grossSales - totalDiscounts - salesReturns);

  const costOfGoodsSold = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalProductCost || 0), 0);
  }, [filteredOrders]);

  const grossProfit = netSales - costOfGoodsSold;
  const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // Direct Order Expenses
  const customerDeliveryChargesCollected = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.deliveryFeeCharged || 0), 0);
  }, [filteredOrders]);

  const actualCourierCost = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.courierCost || 0), 0);
  }, [filteredOrders]);

  const actualPackagingCost = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.packagingCost || 0), 0);
  }, [filteredOrders]);

  const stickerAndOtherCost = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + (o.stickerCost || 0) + (o.otherOrderExpenses || 0),
      0
    );
  }, [filteredOrders]);

  const totalDirectSellingExpenses =
    actualCourierCost + actualPackagingCost + stickerAndOtherCost;

  // Order Contribution Profit = Gross Profit - Direct Selling Expenses + Customer Delivery Collected
  const orderContributionProfit =
    grossProfit - totalDirectSellingExpenses + customerDeliveryChargesCollected;

  // Operating Expenses by Category
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other Expenses';
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }, [filteredExpenses]);

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const operatingProfit = grossProfit - totalOperatingExpenses;
  const netProfit = orderContributionProfit - totalOperatingExpenses;
  const netMarginPct = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  // Cash Flow vs Accounting
  const actualCashCollectedFromOrders = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  }, [filteredOrders]);

  // Product-wise Profitability Breakdown
  const productProfitability = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        sku: string;
        category: string;
        qtySold: number;
        revenue: number;
        cogs: number;
        profit: number;
      }
    >();

    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const existing = map.get(it.productId) || {
          id: it.productId,
          name: it.productName,
          sku: prod?.sku || '',
          category: prod?.category || 'General',
          qtySold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
        const rev = (it.sellingPrice || it.suggestedPrice || 0) * it.quantity - (it.discount || 0);
        const cost = it.unitCost * it.quantity;
        existing.qtySold += it.quantity;
        existing.revenue += rev;
        existing.cogs += cost;
        existing.profit += rev - cost;
        map.set(it.productId, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [filteredOrders, products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Profit & Loss Accounting (P&L)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Accurate revenue recognition, COGS valuation, contribution margins & operating results
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
            {(
              [
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'this_week', label: 'This Week' },
                { key: 'this_month', label: 'This Month' },
                { key: 'this_year', label: 'This Year' },
                { key: 'custom', label: 'Custom' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.key}
                onClick={() => setDateFilter(preset.key)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  dateFilter === preset.key
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3 text-xs no-print">
          <span className="font-semibold text-neutral-600">From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 border border-neutral-300 rounded-lg text-xs"
          />
          <span className="font-semibold text-neutral-600">To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 border border-neutral-300 rounded-lg text-xs"
          />
        </div>
      )}

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Net Sales Revenue
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {formatCurrency(netSales)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Gross sales less discounts & returns</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Cost of Goods Sold (COGS)
          </div>
          <div className="text-base sm:text-xl font-bold text-rose-600">
            {formatCurrency(costOfGoodsSold)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Direct product costs recognized</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Gross Profit Margin
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {formatCurrency(grossProfit)}{' '}
            <span className="text-xs font-normal">({grossMarginPct.toFixed(1)}%)</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Net sales minus COGS</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="text-[10px] sm:text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1">
            Net Profit (Final)
          </div>
          <div
            className={`text-base sm:text-xl font-bold ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netProfit)}{' '}
            <span className="text-xs font-normal">({netMarginPct.toFixed(1)}%)</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Bottom line business earnings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 pb-2 no-print text-xs">
        <button
          onClick={() => setActiveTab('statement')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'statement'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Comprehensive P&L Statement
        </button>
        <button
          onClick={() => setActiveTab('product_breakdown')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'product_breakdown'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Product Profitability Breakdown
        </button>
      </div>

      {activeTab === 'statement' ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 sm:p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-4 text-center">
            <h2 className="text-lg font-bold text-neutral-900">PROFIT AND LOSS STATEMENT</h2>
            <div className="text-xs text-neutral-500 mt-1">
              Reporting Period: {dateFilter.toUpperCase().replace('_', ' ')} (Currency: BDT ৳)
            </div>
          </div>

          <div className="space-y-6 text-xs sm:text-sm">
            {/* 1. Revenue */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-xs border-b border-neutral-200 pb-1 mb-2 flex justify-between">
                <span>1. Revenue & Sales</span>
                <span>Amount (৳)</span>
              </div>
              <div className="space-y-1.5 pl-2">
                <div className="flex justify-between text-neutral-700">
                  <span>Gross Product Sales</span>
                  <span>{formatCurrency(grossSales)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Less: Order Discounts Allowed</span>
                    <span>-{formatCurrency(totalDiscounts)}</span>
                  </div>
                )}
                {salesReturns > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Less: Customer Sales Returns & Refunds</span>
                    <span>-{formatCurrency(salesReturns)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-100 pt-1">
                  <span>Net Sales Revenue</span>
                  <span>{formatCurrency(netSales)}</span>
                </div>
              </div>
            </div>

            {/* 2. COGS */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-xs border-b border-neutral-200 pb-1 mb-2 flex justify-between">
                <span>2. Cost of Goods Sold (COGS)</span>
                <span>Amount (৳)</span>
              </div>
              <div className="space-y-1.5 pl-2">
                <div className="flex justify-between text-neutral-700">
                  <span>Product Inventory Cost (WAC at Sale Snapshot)</span>
                  <span className="text-rose-600">({formatCurrency(costOfGoodsSold)})</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 border-t border-neutral-100 pt-1 text-sm">
                  <span>Gross Profit</span>
                  <span>{formatCurrency(grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* 3. Direct Selling & Order Expenses */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-xs border-b border-neutral-200 pb-1 mb-2 flex justify-between">
                <span>3. Direct Selling & Fulfillment Operations</span>
                <span>Amount (৳)</span>
              </div>
              <div className="space-y-1.5 pl-2">
                <div className="flex justify-between text-emerald-600">
                  <span>Delivery Charges Collected from Customers</span>
                  <span>+{formatCurrency(customerDeliveryChargesCollected)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Courier & Dispatch Delivery Paid</span>
                  <span className="text-rose-600">-{formatCurrency(actualCourierCost)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Packaging Boxes & Gift Wrapping</span>
                  <span className="text-rose-600">-{formatCurrency(actualPackagingCost)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Stickers, Tags & Direct Handling</span>
                  <span className="text-rose-600">-{formatCurrency(stickerAndOtherCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-700 border-t border-neutral-100 pt-1 text-sm">
                  <span>Order Contribution Profit</span>
                  <span>{formatCurrency(orderContributionProfit)}</span>
                </div>
              </div>
            </div>

            {/* 4. Operating Expenses */}
            <div>
              <div className="font-bold text-neutral-900 uppercase tracking-wider text-xs border-b border-neutral-200 pb-1 mb-2 flex justify-between">
                <span>4. General & Administrative Operating Expenses</span>
                <span>Amount (৳)</span>
              </div>
              <div className="space-y-1.5 pl-2">
                {expenseByCategory.length === 0 ? (
                  <div className="text-neutral-400 italic">No operating expenses in this period.</div>
                ) : (
                  expenseByCategory.map((exp) => (
                    <div key={exp.category} className="flex justify-between text-neutral-700">
                      <span>{exp.category}</span>
                      <span className="text-rose-600">-{formatCurrency(exp.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-100 pt-1">
                  <span>Total Operating Expenses</span>
                  <span className="text-rose-600">-{formatCurrency(totalOperatingExpenses)}</span>
                </div>
              </div>
            </div>

            {/* 5. Net Profit Result */}
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50">
              <div className="flex justify-between items-center text-sm sm:text-base font-extrabold text-neutral-900">
                <span>NET PROFIT / (LOSS)</span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Net Profit Margin: {netMarginPct.toFixed(2)}% of Net Sales
              </div>
            </div>
          </div>

          {/* Cash Flow vs Accrual Accounting Comparison Card */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <span>Accounting Profit vs Cash Inflow Note</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-600">
              <div>
                <span className="font-semibold block text-neutral-800">
                  Accrual Recognized Net Sales:
                </span>
                {formatCurrency(netSales)} (Includes credit orders)
              </div>
              <div>
                <span className="font-semibold block text-neutral-800">
                  Actual Cash Inflow from Orders:
                </span>
                {formatCurrency(actualCashCollectedFromOrders)} (Excludes customer dues pending
                collection)
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Product Profitability Breakdown */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
            <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
              Product-Wise Profit Report
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Qty Sold</th>
                  <th className="p-3 text-right">Revenue (৳)</th>
                  <th className="p-3 text-right">COGS (৳)</th>
                  <th className="p-3 text-right">Gross Profit (৳)</th>
                  <th className="p-3 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {productProfitability.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      No sales data available for products in this date range.
                    </td>
                  </tr>
                ) : (
                  productProfitability.map((item) => {
                    const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-all">
                        <td className="p-3 font-bold text-neutral-900">
                          <div>{item.name}</div>
                          {item.sku && (
                            <div className="text-[10px] text-neutral-400">SKU: {item.sku}</div>
                          )}
                        </td>
                        <td className="p-3 text-neutral-600">{item.category}</td>
                        <td className="p-3 text-center font-bold text-neutral-800">
                          {item.qtySold}
                        </td>
                        <td className="p-3 text-right font-semibold text-neutral-900">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="p-3 text-right text-rose-600">
                          {formatCurrency(item.cogs)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {formatCurrency(item.profit)}
                        </td>
                        <td className="p-3 text-right font-semibold text-neutral-700">
                          {margin.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
