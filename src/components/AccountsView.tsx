import React, { useState, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  ArrowRightLeft,
  Building,
  Smartphone,
  Wallet,
  History,
  CheckCircle,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import { FinancialAccount, AccountTransaction } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate, getTodayString } from '../utils/accounting';

interface AccountsViewProps {
  accounts: FinancialAccount[];
  transactions: AccountTransaction[];
  onAddAccount: (acc: FinancialAccount) => void;
  onTransferFunds: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes: string
  ) => void;
  onAdjustBalance: (accountId: string, newBalance: number, reason: string) => void;
  onDeleteTransaction?: (txId: string) => void;
  onDeleteAccount?: (accId: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  onAddAccount,
  onTransferFunds,
  onAdjustBalance,
  onDeleteTransaction,
  onDeleteAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState('All');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [adjustingAccount, setAdjustingAccount] = useState<FinancialAccount | null>(null);

  // New Account Form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<any>('bank');
  const [accNumber, setAccNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [notes, setNotes] = useState('');

  // Transfer Form
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');

  // Adjustment Form
  const [adjustedNewBalance, setAdjustedNewBalance] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Total Liquid Cash & Bank
  const totalLiquidity = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0),
    [accounts]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.accountName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAccount = accountFilter === 'All' || t.accountId === accountFilter;
      return matchSearch && matchAccount;
    });
  }, [transactions, searchTerm, accountFilter]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;

    const newAcc: FinancialAccount = {
      id: `acc-${Date.now()}`,
      name: accName,
      type: accType,
      accountNumber: accNumber,
      openingBalance: Number(openingBalance || 0),
      currentBalance: Number(openingBalance || 0),
      notes,
      updatedAt: getTodayString(),
    };

    onAddAccount(newAcc);
    setIsAddAccountModalOpen(false);
    setAccName('');
    setAccNumber('');
    setOpeningBalance(0);
    setNotes('');
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different');
      return;
    }
    if (transferAmount <= 0) {
      alert('Transfer amount must be positive');
      return;
    }

    const source = accounts.find((a) => a.id === fromAccountId);
    if (source && source.currentBalance < transferAmount) {
      if (!confirm(`Warning: Source account has ৳${source.currentBalance}, which is less than ৳${transferAmount}. Proceed?`)) {
        return;
      }
    }

    onTransferFunds(fromAccountId, toAccountId, transferAmount, transferNotes);
    setIsTransferModalOpen(false);
    setTransferAmount(0);
    setTransferNotes('');
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount) return;
    onAdjustBalance(adjustingAccount.id, adjustedNewBalance, adjustReason || 'Physical reconciliation');
    setAdjustingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'bank':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'bkash':
      case 'nagad':
        return <Smartphone className="w-5 h-5 text-rose-600" />;
      default:
        return <WalletCards className="w-5 h-5 text-neutral-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Financial Accounts & Cashflow
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cash in Hand, Bank Accounts, bKash, Nagad, internal fund transfers & reconciliations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Fund Transfer</span>
          </button>
          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid (2 per row on mobile!) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Account Balances (Total: {formatCurrency(totalLiquidity)})
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {acc.type.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getAccountIcon(acc.type)}
                    {accounts.length > 1 && onDeleteAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete account "${acc.name}"?`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        className="p-1 text-neutral-300 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                        title={`Delete ${acc.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="font-bold text-neutral-900 text-sm truncate">{acc.name}</div>
                {acc.accountNumber && (
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {acc.accountNumber}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg font-bold text-neutral-900">
                    {formatCurrency(acc.currentBalance)}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Opening: {formatCurrency(acc.openingBalance)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAdjustingAccount(acc);
                    setAdjustedNewBalance(acc.currentBalance);
                  }}
                  className="text-[10px] text-neutral-500 hover:text-neutral-900 font-semibold underline cursor-pointer"
                >
                  Reconcile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search account transactions, ref, note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-neutral-600">Filter Account:</span>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
          >
            <option value="All">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction Audit Ledger */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
          <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
            Account Transaction Ledger
          </span>
          <span className="text-[11px] text-neutral-400">
            Real-time double-entry audit trail
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Date</th>
                <th className="p-3">Account</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description / Ref</th>
                <th className="p-3 text-right">Inflow / Outflow (৳)</th>
                <th className="p-3 text-right">Balance After (৳)</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No account transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: AccountTransaction) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-all">
                      <td className="p-3 text-neutral-600">{formatDate(tx.date)}</td>
                      <td className="p-3 font-semibold text-neutral-800">{tx.accountName}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.type.includes('payment') || tx.type === 'transfer_in'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.type === 'expense' || tx.type === 'transfer_out'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-neutral-900">{tx.description}</div>
                        {tx.referenceNumber && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Ref: {tx.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                          {isPositive ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-neutral-900">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this transaction entry from ledger?')) {
                              onDeleteTransaction?.(tx.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Internal Account Fund Transfer</h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">From Account (Source) *</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  To Account (Destination) *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Transfer Amount (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. bKash to Bank Deposit, Cash till balance transfer"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl text-[11px]">
                ℹ️ Note: Internal transfers are balanced movements between your own accounts and are
                never counted as business revenue or operating expenses.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Add Financial Account</h3>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BRAC Bank A/C or bKash Personal 018..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="other">Other MFS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Account / Mobile #</label>
                  <input
                    type="text"
                    placeholder="e.g. 150-103-9921"
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Opening Balance (৳)
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Branch name, routing number, daily limits..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Account Modal */}
      {adjustingAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-sm font-bold">Reconcile / Adjust Account</h3>
                <p className="text-[11px] text-neutral-400">{adjustingAccount.name}</p>
              </div>
              <button
                onClick={() => setAdjustingAccount(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="p-4 space-y-3">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Recorded Balance
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {formatCurrency(adjustingAccount.currentBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Actual Physical / Bank Statement Balance (৳) *
                </label>
                <input
                  type="number"
                  value={adjustedNewBalance}
                  onChange={(e) => setAdjustedNewBalance(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Adjustment Reason / Audit Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank charge interest reconciliation, till cash count match"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAdjustingAccount(null)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold"
                >
                  Save Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
