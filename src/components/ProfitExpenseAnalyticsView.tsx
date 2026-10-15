import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { Order, ExpenseItem, FinancialAccount } from '../types';
import {
  formatCurrency,
  formatDate,
  getTodayString,
} from '../utils/accounting';

const formatPercent = (val: number) => `${isNaN(val) ? '0.0' : val.toFixed(1)}%`;

interface ProfitExpenseAnalyticsViewProps {
  orders: Order[];
  expenses: ExpenseItem[];
  accounts: FinancialAccount[];
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense?: (id: string) => void;
}

type DateRangeFilter =
  | 'this_month'
  | 'last_month'
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_year'
  | 'all'
  | 'custom';

export const ProfitExpenseAnalyticsView: React.FC<ProfitExpenseAnalyticsViewProps> = ({
  orders,
  expenses,
  accounts,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Explicitly added expense IDs for this analytics view
  // Starts EMPTY as instructed by user: "expender erkhane age theke kicu thakbe na"
  const [includedExpenseIds, setIncludedExpenseIds] = useState<string[]>([]);

  // Add Expense Modal
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'select' | 'create'>('select');

  // Dropdown selection state
  const [selectedExpenseIdToAdd, setSelectedExpenseIdToAdd] = useState<string>('');

  // Create new expense form state
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<string>('Facebook Ads');
  const [customCategory, setCustomCategory] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expDate, setExpDate] = useState<string>(getTodayString());
  const [expAccountId, setExpAccountId] = useState<string>(accounts[0]?.id || '');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Date Range Filtering for delivered orders
  const isDateInFilter = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'all') return true;

    if (dateFilter === 'today') {
      const todayStr = getTodayString();
      return dateStr.startsWith(todayStr);
    }

    if (dateFilter === 'this_month') {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    if (dateFilter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        date.getFullYear() === lastMonth.getFullYear() &&
        date.getMonth() === lastMonth.getMonth()
      );
    }

    if (dateFilter === 'last_7_days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return date >= sevenDaysAgo && date <= now;
    }

    if (dateFilter === 'last_30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return date >= thirtyDaysAgo && date <= now;
    }

    if (dateFilter === 'this_year') {
      return date.getFullYear() === now.getFullYear();
    }

    if (dateFilter === 'custom') {
      if (customStart && dateStr < customStart) return false;
      if (customEnd && dateStr > customEnd) return false;
      return true;
    }

    return true;
  };

  // Delivered orders only in period (as requested: "panding thaka oostay profit dhora na , delivery status dewyar por profit dekhabe")
  const periodDeliveredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      return o.status === 'delivered' && isDateInFilter(d);
    });
  }, [orders, dateFilter, customStart, customEnd]);

  // Expenses that user has explicitly added to this analytics view
  const addedExpenses = useMemo(() => {
    return includedExpenseIds
      .map((id) => expenses.find((e) => e.id === id))
      .filter(Boolean) as ExpenseItem[];
  }, [includedExpenseIds, expenses]);

  // Search filter for added expenses
  const displayedAddedExpenses = useMemo(() => {
    return addedExpenses.filter((e) => {
      const q = expenseSearch.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.expenseNumber.toLowerCase().includes(q)
      );
    });
  }, [addedExpenses, expenseSearch]);

  // List of recorded expenses that are NOT YET added to analytics, to choose from in dropdown
  const availableExpensesToSelect = useMemo(() => {
    return expenses.filter((e) => !includedExpenseIds.includes(e.id));
  }, [expenses, includedExpenseIds]);

  // Metrics Calculations
  // 1. Total Delivered Sales Revenue
  const totalDeliveredRevenue = useMemo(() => {
    return periodDeliveredOrders.reduce(
      (sum, o) => sum + (o.totalAmount || o.sellingPrice || 0),
      0
    );
  }, [periodDeliveredOrders]);

  // 2. Total Product Wholesale / Purchase Cost for delivered orders
  const totalProductWholesaleCost = useMemo(() => {
    return periodDeliveredOrders.reduce(
      (sum, o) => sum + (o.totalProductCost || 0),
      0
    );
  }, [periodDeliveredOrders]);

  // 3. Orders Gross Profit (Delivered Sales Revenue - Wholesale Cost - Direct Order Packaging)
  const ordersGrossProfit = useMemo(() => {
    return periodDeliveredOrders.reduce(
      (sum, o) => sum + (o.netProfit || o.contributionProfit || 0),
      0
    );
  }, [periodDeliveredOrders]);

  // 4. Selected Operating Expenses to Deduct
  const totalSelectedExpenses = useMemo(() => {
    return addedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [addedExpenses]);

  // 5. Final Realized Main Net Profit = Orders Profit - Selected Operating Expenses
  const finalMainNetProfit = ordersGrossProfit - totalSelectedExpenses;
  const finalProfitMargin =
    totalDeliveredRevenue > 0
      ? (finalMainNetProfit / totalDeliveredRevenue) * 100
      : 0;

  // Add 1 selected expense from dropdown
  const handleAddSelectedExpense = () => {
    if (!selectedExpenseIdToAdd) {
      alert('দয়া করে ড্রপডাউন থেকে একটি খরচ নির্বাচন করুন।');
      return;
    }
    setIncludedExpenseIds((prev) => [...prev, selectedExpenseIdToAdd]);
    setSelectedExpenseIdToAdd('');
    setIsAddExpenseModalOpen(false);
  };

  // Remove an expense from this analytics deduction
  const handleRemoveExpenseFromAnalytics = (id: string) => {
    setIncludedExpenseIds((prev) => prev.filter((item) => item !== id));
  };

  // Handle Save Quick Expense (Brand New)
  const handleSaveQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) {
      alert('Please enter a valid expense title and amount.');
      return;
    }

    const finalCategory =
      expCategory === 'CUSTOM'
        ? customCategory.trim() || 'Other Expenses'
        : expCategory;
    const selectedAcc = accounts.find((a) => a.id === expAccountId) || accounts[0];

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      title: expTitle.trim(),
      category: finalCategory,
      amount: Number(expAmount),
      date: expDate || getTodayString(),
      paymentAccountId: selectedAcc?.id || '',
      paymentAccountName: selectedAcc?.name || 'Cash',
      paymentMethod: selectedAcc?.type || 'cash',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    // Add to included list
    setIncludedExpenseIds((prev) => [...prev, newExpense.id]);

    // Reset modal
    setExpTitle('');
    setExpAmount('');
    setCustomCategory('');
    setIsAddExpenseModalOpen(false);
  };

  // Category badge styling
  const getCategoryBadgeClass = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('facebook') || c.includes('ads') || c.includes('marketing')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (c.includes('food') || c.includes('meal') || c.includes('lunch')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (c.includes('transport') || c.includes('fuel') || c.includes('travel')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (c.includes('rent') || c.includes('office') || c.includes('electricity')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (c.includes('salary') || c.includes('wages')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Profit & Expense Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Realized Accounting
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Compare delivered sales revenue with product costs and selectively deduct operating expenses
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setDateFilter('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'this_month'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'today'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('last_7_days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'last_7_days'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('last_30_days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'last_30_days'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('this_year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'this_year'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              dateFilter === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Total Delivered Sales */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Delivered Sales
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(totalDeliveredRevenue)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {periodDeliveredOrders.length} delivered orders
          </div>
        </div>

        {/* 2. Product Wholesale Cost */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Wholesale Cost (পাইকারি)
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            -{formatCurrency(totalProductWholesaleCost)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Delivered product COGS</div>
        </div>

        {/* 3. Orders Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            Orders Gross Profit
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            +{formatCurrency(ordersGrossProfit)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Before operating expenses</div>
        </div>

        {/* 4. Selected Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Selected Expenses
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            -{formatCurrency(totalSelectedExpenses)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {addedExpenses.length} expenses deducted
          </div>
        </div>

        {/* 5. Final Realized Net Profit */}
        <div
          className={`p-4 rounded-xl border col-span-2 lg:col-span-1 shadow-xs ${
            finalMainNetProfit >= 0
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-rose-600 text-white border-rose-600'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
            Final Net Profit
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {formatCurrency(finalMainNetProfit)}
          </div>
          <div className="text-[10px] opacity-90 mt-0.5 font-semibold">
            Margin: {formatPercent(finalProfitMargin)}
          </div>
        </div>
      </div>

      {/* Operating Expenses Section (Selectively deduct expenses from profit) */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-neutral-900">
                Operating Expenses (Ads, Food, Transport...)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Click &quot;+ Add Expense&quot; to pick expenses from dropdown one by one to deduct from realized profit
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalMode('select');
              setIsAddExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          {/* Search and Count Bar */}
          {addedExpenses.length > 0 && (
            <div className="p-3 border-b border-neutral-200 flex flex-col sm:flex-row gap-2 justify-between items-center bg-neutral-50/50">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search added expense..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="text-xs text-neutral-500 font-semibold">
                {addedExpenses.length} expense(s) selected
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-100">
            {addedExpenses.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <Receipt className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                <div className="font-bold text-neutral-700 text-sm">
                  এখানে আগে থেকে কোনো খরচ যোগ করা নেই
                </div>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  প্রফিট থেকে বাদ দিতে চাইলে উপরের <strong>&quot;+ Add Expense&quot;</strong> বাটনে ক্লিক করে ড্রপডাউন থেকে আপনার খরচগুলো ১টা ১টা করে সিলেক্ট করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('select');
                    setIsAddExpenseModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </button>
              </div>
            ) : displayedAddedExpenses.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">
                No added expense matches your search query.
              </div>
            ) : (
              displayedAddedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-3 bg-white hover:bg-neutral-50/80 transition-colors"
                >
                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                        {exp.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(
                          exp.category
                        )}`}
                      >
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {formatDate(exp.date)} · Ref: #{exp.expenseNumber} · Paid via {exp.paymentAccountName}
                    </div>
                  </div>

                  {/* Amount & Remove Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="font-mono font-bold text-sm sm:text-base text-right text-rose-600">
                      -{formatCurrency(exp.amount)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseFromAnalytics(exp.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove from analytics deduction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Expenses Summary Footer */}
          {addedExpenses.length > 0 && (
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs sm:text-sm">
              <span className="font-bold text-neutral-600">
                Total Deducted Operating Expenses ({addedExpenses.length} items):
              </span>
              <span className="font-mono font-black text-rose-600 text-sm sm:text-base">
                -{formatCurrency(totalSelectedExpenses)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL (WITH DROPDOWN SELECTION AS REQUESTED) */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Add Expense to Analytics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => setModalMode('select')}
                className={`flex-1 py-1.5 text-center font-bold rounded-lg cursor-pointer transition-colors ${
                  modalMode === 'select'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Select from List (ড্রপডাউন)
              </button>
              <button
                type="button"
                onClick={() => setModalMode('create')}
                className={`flex-1 py-1.5 text-center font-bold rounded-lg cursor-pointer transition-colors ${
                  modalMode === 'create'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                + Record New Expense (নতুন খরচ)
              </button>
            </div>

            {/* TAB 1: Select from existing recorded expenses dropdown */}
            {modalMode === 'select' ? (
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Select Recorded Expense (খরচের ড্রপডাউন) *
                  </label>

                  {availableExpensesToSelect.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
                      <p className="font-semibold">
                        {expenses.length === 0
                          ? 'আপনার কোনো খরচ এখনো রেকর্ড করা নেই।'
                          : 'আপনার সকল রেকর্ডকৃত খরচ ইতিমধ্যে এই অ্যানালিটিক্সে যোগ করা আছে।'}
                      </p>
                      <p className="text-[11px] text-amber-700">
                        নতুন কোনো খরচ এন্ট্রি করতে পাশের <strong>&quot;+ Record New Expense&quot;</strong> ট্যাবে ক্লিক করুন।
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedExpenseIdToAdd}
                      onChange={(e) => setSelectedExpenseIdToAdd(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="">-- ড্রপডাউন থেকে খরচ সিলেক্ট করুন --</option>
                      {availableExpensesToSelect.map((exp) => (
                        <option key={exp.id} value={exp.id}>
                          {exp.title} ({exp.category}) — ৳{exp.amount} [{formatDate(exp.date)}]
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preview of chosen expense */}
                {selectedExpenseIdToAdd && (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                    {(() => {
                      const exp = expenses.find((e) => e.id === selectedExpenseIdToAdd);
                      if (!exp) return null;
                      return (
                        <>
                          <div className="flex justify-between font-bold text-neutral-900">
                            <span>{exp.title}</span>
                            <span className="text-rose-600 font-mono">
                              -{formatCurrency(exp.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-neutral-500 text-[11px]">
                            <span>Category: {exp.category}</span>
                            <span>Date: {formatDate(exp.date)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedExpenseIdToAdd}
                    onClick={handleAddSelectedExpense}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    + Add to Analytics
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: Record New Expense */
              <form onSubmit={handleSaveQuickExpense} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Expense Title / Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Facebook Boost Campaign, Staff Lunch, CNG Rent..."
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Category *
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Facebook Ads">Facebook Ads / Boost</option>
                    <option value="Food & Refreshment">Food & Refreshment</option>
                    <option value="Transport & Fare">Transport & Fare</option>
                    <option value="Office Rent">Office Rent</option>
                    <option value="Internet & Electricity">Internet & Electricity</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Salaries">Salaries & Wages</option>
                    <option value="Equipment">Equipment & Tools</option>
                    <option value="CUSTOM">+ Custom Category</option>
                  </select>
                </div>

                {expCategory === 'CUSTOM' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Enter Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Courier Return Fine"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Amount (৳) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="0"
                      value={expAmount}
                      onChange={(e) =>
                        setExpAmount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg font-bold font-mono text-rose-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-xs"
                  >
                    Save & Add to Analytics
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
