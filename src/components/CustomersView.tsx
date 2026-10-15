import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Order, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/accounting';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  accounts: FinancialAccount[];
  onAddCustomer: (customer: Customer) => void;
  onRecordCustomerPayment: (
    customerId: string,
    amount: number,
    accountId: string,
    notes: string
  ) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  accounts,
  onAddCustomer,
  onRecordCustomerPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState<Customer | null>(null);

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Collection Form
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectAccountId, setCollectAccountId] = useState<string>(accounts[0]?.id || '');
  const [collectNotes, setCollectNotes] = useState<string>('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalDuesReceivable = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.outstandingDue || 0), 0),
    [customers]
  );
  const totalCustomerSales = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0),
    [customers]
  );
  const totalCustomerPaid = useMemo(
    () => customers.reduce((sum, c) => sum + (c.amountPaid || 0), 0),
    [customers]
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please enter customer name and phone');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      address: address || 'Dhaka, Bangladesh',
      email,
      notes,
      totalOrders: 0,
      totalPurchases: 0,
      amountPaid: 0,
      outstandingDue: 0,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setNotes('');
  };

  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || collectAmount <= 0) return;
    onRecordCustomerPayment(
      selectedCustomerForPayment.id,
      collectAmount,
      collectAccountId,
      collectNotes
    );
    setSelectedCustomerForPayment(null);
    setCollectAmount(0);
    setCollectNotes('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Customer Directory & Dues
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Customer relationship records, outstanding receivables & payment collection
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Customers
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {customers.length} <span className="text-xs font-normal text-neutral-500">clients</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Client base registered</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Invoiced
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {formatCompactCurrency(totalCustomerSales)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Gross sales generated</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Received
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {formatCompactCurrency(totalCustomerPaid)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Cash & digital collections</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Outstanding Due
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {formatCompactCurrency(totalDuesReceivable)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Receivables to collect</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="relative w-full sm:w-80 text-xs">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-center">Orders</th>
                <th className="p-3 text-right">Total Purchases (৳)</th>
                <th className="p-3 text-right">Paid (৳)</th>
                <th className="p-3 text-right">Due (৳)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 transition-all">
                  <td className="p-3 font-bold text-neutral-900">
                    <div>{c.name}</div>
                    {c.email && <div className="text-[10px] text-neutral-400">{c.email}</div>}
                  </td>
                  <td className="p-3 font-semibold text-neutral-800">{c.phone}</td>
                  <td className="p-3 text-neutral-600 max-w-xs truncate">{c.address}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded-md font-semibold text-neutral-700">
                      {c.totalOrders}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-neutral-900">
                    {formatCurrency(c.totalPurchases)}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-700">
                    {formatCurrency(c.amountPaid)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    <span className={c.outstandingDue > 0 ? 'text-amber-700' : 'text-neutral-500'}>
                      {formatCurrency(c.outstandingDue)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedCustomerStatement(c)}
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        title="View Statement & History"
                      >
                        Statement
                      </button>
                      {c.outstandingDue > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCustomerForPayment(c);
                            setCollectAmount(c.outstandingDue);
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Collect Due
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

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Add New Customer</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
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
                    placeholder="customer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  placeholder="House, Road, Area, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Preferred delivery time, special remarks..."
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Customer Due Modal */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-sm font-bold">Collect Customer Due</h3>
                <p className="text-[11px] text-neutral-400">{selectedCustomerForPayment.name}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerForPayment(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCollection} className="p-4 space-y-4">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Outstanding Customer Due
                  </span>
                  <span className="text-base font-bold text-amber-700">
                    {formatCurrency(selectedCustomerForPayment.outstandingDue)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Received Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomerForPayment.outstandingDue}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Deposit Into Account *
                </label>
                <select
                  value={collectAccountId}
                  onChange={(e) => setCollectAccountId(e.target.value)}
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
                <label className="block font-bold text-neutral-700 mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. bKash TrxID #9872 or Cash Handover"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {selectedCustomerStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-base font-bold">{selectedCustomerStatement.name}</h3>
                <p className="text-xs text-neutral-400">
                  Phone: {selectedCustomerStatement.phone} &bull; Address:{' '}
                  {selectedCustomerStatement.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerStatement(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Total Orders</div>
                  <div className="text-sm font-bold text-neutral-900">
                    {formatCurrency(selectedCustomerStatement.totalPurchases)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Total Paid</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(selectedCustomerStatement.amountPaid)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Outstanding Due</div>
                  <div className="text-sm font-bold text-amber-700">
                    {formatCurrency(selectedCustomerStatement.outstandingDue)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 mb-2">Order History</h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="p-2.5">Order</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-right">Paid</th>
                        <th className="p-2.5 text-right">Due</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {orders
                        .filter(
                          (o) =>
                            o.customerId === selectedCustomerStatement.id ||
                            o.customerPhone === selectedCustomerStatement.phone
                        )
                        .map((o) => (
                          <tr key={o.id}>
                            <td className="p-2.5 font-bold">#{o.orderNumber}</td>
                            <td className="p-2.5">{formatDate(o.orderDate)}</td>
                            <td className="p-2.5 text-right font-semibold">
                              {formatCurrency(o.totalAmount)}
                            </td>
                            <td className="p-2.5 text-right text-emerald-700">
                              {formatCurrency(o.paidAmount)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-amber-700">
                              {formatCurrency(o.dueAmount)}
                            </td>
                            <td className="p-2.5 text-center uppercase text-[10px] font-bold">
                              {o.status}
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
                onClick={() => setSelectedCustomerStatement(null)}
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
