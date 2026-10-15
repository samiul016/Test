import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Download,
  Building,
  CreditCard,
  FileText,
} from 'lucide-react';
import { ExpenseItem, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate, getTodayString } from '../utils/accounting';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  accounts: FinancialAccount[];
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Office Rent',
  'Salaries',
  'Advertising',
  'Internet and Electricity',
  'Packaging',
  'Stickers',
  'Delivery and Courier',
  'Transport',
  'Equipment',
  'Software and Subscriptions',
  'Other Expenses',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  accounts,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Advertising');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayString());
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('Admin');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const totalExpenseAmount = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [expenses]
  );

  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.vendor && e.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter expense title');
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const finalCategory =
      category === 'CUSTOM' ? customCategory.trim() || 'Other Expenses' : category;
    const defaultAccount = accounts[0];

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      title: title.trim(),
      category: finalCategory,
      description: description.trim() || undefined,
      amount: amt,
      date,
      paymentAccountId: defaultAccount?.id || 'acc-1',
      paymentAccountName: defaultAccount?.name || 'Cash in Hand',
      paymentMethod: 'Cash',
      vendor: undefined,
      createdBy: createdBy.trim() || 'Admin',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExp);
    setIsModalOpen(false);
    setTitle('');
    setAmount('');
    setDescription('');
    setVendor('');
    setNotes('');
    setError('');
  };

  const handleExportCSV = () => {
    const headers = [
      'Expense #',
      'Date',
      'Category',
      'Title',
      'Amount (৳)',
      'Payment Account',
      'Method',
      'Vendor',
      'Created By',
    ];
    const rows = expenses.map((e) => [
      e.expenseNumber,
      formatDate(e.date),
      `"${e.category}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.paymentAccountName}"`,
      e.paymentMethod,
      `"${e.vendor || ''}"`,
      `"${e.createdBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Business Expense Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Operational overhead, payroll, utilities & rent ledger (No double counting of inventory purchases)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Recognized Expenses
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {formatCompactCurrency(totalExpenseAmount)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">{expenses.length} expense entries</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Rent & Salaries
          </div>
          <div className="text-base sm:text-xl font-bold text-rose-600">
            {formatCompactCurrency(
              expenses
                .filter((e) => e.category === 'Office Rent' || e.category === 'Salaries')
                .reduce((s, e) => s + e.amount, 0)
            )}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Fixed operational base</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Marketing & Ads
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {formatCompactCurrency(
              expenses
                .filter((e) => e.category === 'Advertising')
                .reduce((s, e) => s + e.amount, 0)
            )}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Meta & Google campaigns</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Utilities & Misc
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {formatCompactCurrency(
              expenses
                .filter(
                  (e) =>
                    e.category !== 'Office Rent' &&
                    e.category !== 'Salaries' &&
                    e.category !== 'Advertising'
                )
                .reduce((s, e) => s + e.amount, 0)
            )}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Internet, electricity, consumables</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search expense, vendor, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-neutral-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Expense #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Title & Description</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount (৳)</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-50/80 transition-all">
                    <td className="p-3 font-mono font-bold text-neutral-900">
                      #{e.expenseNumber}
                    </td>
                    <td className="p-3 text-neutral-600">{formatDate(e.date)}</td>
                    <td className="p-3">
                      <div className="font-bold text-neutral-900">{e.title}</div>
                      {e.description && (
                        <div className="text-[10px] text-neutral-400">{e.description}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense #${e.expenseNumber}?`)) {
                            onDeleteExpense(e.id);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Record Business Operating Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-3">
              {error && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Studio Rent, Facebook Sponsored Ads"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white font-semibold"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Category</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {category === 'CUSTOM' && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Expense Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Receipt voucher details, invoice number..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl text-[11px]">
                ℹ️ Accounting Rule: General operating expenses are deducted from Gross Profit to arrive
                at Net Profit. Raw material and inventory purchase costs are classified under Inventory
                Assets & COGS and are NOT double-counted here.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
