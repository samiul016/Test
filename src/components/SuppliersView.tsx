import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Supplier, Purchase, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/accounting';

interface SuppliersViewProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  accounts: FinancialAccount[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onRecordSupplierPayment: (
    supplierId: string,
    amount: number,
    accountId: string,
    notes: string
  ) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  purchases,
  accounts,
  onAddSupplier,
  onUpdateSupplier,
  onRecordSupplierPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [selectedSupplierStatement, setSelectedSupplierStatement] = useState<Supplier | null>(null);

  // New Supplier Form
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [notes, setNotes] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id || '');
  const [payNotes, setPayNotes] = useState<string>('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );
  }, [suppliers, searchTerm]);

  const totalPayableDue = useMemo(
    () => suppliers.reduce((sum, s) => sum + Math.max(0, s.outstandingBalance || 0), 0),
    [suppliers]
  );
  const totalPurchasedAll = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0),
    [suppliers]
  );
  const totalPaidAll = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
    [suppliers]
  );

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !companyName || !phone) {
      alert('Please fill required supplier details');
      return;
    }

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name,
      companyName,
      phone,
      address: address || 'Dhaka, Bangladesh',
      email,
      openingBalance: Number(openingBalance || 0),
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: Number(openingBalance || 0),
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddSupplier(newSup);
    setIsAddModalOpen(false);
    setName('');
    setCompanyName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setOpeningBalance(0);
    setNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment || payAmount <= 0) return;
    onRecordSupplierPayment(selectedSupplierForPayment.id, payAmount, payAccountId, payNotes);
    setSelectedSupplierForPayment(null);
    setPayAmount(0);
    setPayNotes('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Supplier Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Vendor accounts, procurement ledger, payable dues & supplier statements
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Registered Suppliers
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {suppliers.length} <span className="text-xs font-normal text-neutral-500">vendors</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Active vendor network</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Purchases
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {formatCompactCurrency(totalPurchasedAll)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Cumulative procurement</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Paid Out
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {formatCompactCurrency(totalPaidAll)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Settled payments</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Outstanding Due
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {formatCompactCurrency(totalPayableDue)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Current vendor liabilities</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="relative w-full sm:w-80 text-xs">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search supplier, company, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Company / Supplier</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Opening (৳)</th>
                <th className="p-3 text-right">Purchases (৳)</th>
                <th className="p-3 text-right">Paid (৳)</th>
                <th className="p-3 text-right">Balance Due (৳)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition-all">
                  <td className="p-3 font-bold text-neutral-900">
                    <div>{s.companyName}</div>
                    <div className="text-[10px] text-neutral-400 font-normal">{s.name}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-neutral-800">{s.phone}</div>
                    {s.email && <div className="text-[10px] text-neutral-400">{s.email}</div>}
                  </td>
                  <td className="p-3 text-neutral-600 max-w-xs truncate">{s.address}</td>
                  <td className="p-3 text-right text-neutral-500">
                    {formatCurrency(s.openingBalance)}
                  </td>
                  <td className="p-3 text-right font-semibold text-neutral-900">
                    {formatCurrency(s.totalPurchases)}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-700">
                    {formatCurrency(s.totalPaid)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    <span className={s.outstandingBalance > 0 ? 'text-amber-700' : 'text-neutral-500'}>
                      {formatCurrency(s.outstandingBalance)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedSupplierStatement(s)}
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        title="View Statement & History"
                      >
                        Statement
                      </button>
                      {s.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedSupplierForPayment(s);
                            setPayAmount(s.outstandingBalance);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Pay Due
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Add New Supplier</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Company / Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Padma Confectionery Wholesale"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdur Rahim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Business Address</label>
                <input
                  type="text"
                  placeholder="Shop #, Market, Area, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Opening Payable Balance (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Credit terms, bank info..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Supplier Payment Modal */}
      {selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-sm font-bold">Record Supplier Payment</h3>
                <p className="text-[11px] text-neutral-400">
                  {selectedSupplierForPayment.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForPayment(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-4 space-y-4">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Outstanding Balance
                  </span>
                  <span className="text-base font-bold text-amber-700">
                    {formatCurrency(selectedSupplierForPayment.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Payment Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedSupplierForPayment.outstandingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Pay From Account *</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
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
                <label className="block font-bold text-neutral-700 mb-1">Notes / Check Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #10294 or bKash TrxID"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForPayment(null)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Statement Modal */}
      {selectedSupplierStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-base font-bold">{selectedSupplierStatement.companyName}</h3>
                <p className="text-xs text-neutral-400">
                  Contact: {selectedSupplierStatement.name} &bull; {selectedSupplierStatement.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierStatement(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Total Purchases</div>
                  <div className="text-sm font-bold text-neutral-900">
                    {formatCurrency(selectedSupplierStatement.totalPurchases)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Total Settled</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(selectedSupplierStatement.totalPaid)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Current Due</div>
                  <div className="text-sm font-bold text-amber-700">
                    {formatCurrency(selectedSupplierStatement.outstandingBalance)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 mb-2">Purchase Invoice History</h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="p-2.5">PO Number</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Invoice Total</th>
                        <th className="p-2.5 text-right">Paid</th>
                        <th className="p-2.5 text-right">Due</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {purchases
                        .filter((p) => p.supplierId === selectedSupplierStatement.id)
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="p-2.5 font-bold">#{p.purchaseNumber}</td>
                            <td className="p-2.5">{formatDate(p.purchaseDate)}</td>
                            <td className="p-2.5 text-right font-semibold">
                              {formatCurrency(p.totalAmount)}
                            </td>
                            <td className="p-2.5 text-right text-emerald-700">
                              {formatCurrency(p.paidAmount)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-amber-700">
                              {formatCurrency(p.dueAmount)}
                            </td>
                            <td className="p-2.5 text-center uppercase text-[10px] font-bold">
                              {p.status}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setSelectedSupplierStatement(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
