import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Truck,
  ArrowDownLeft,
} from 'lucide-react';
import { ReturnRecord, Order, Purchase, ProductItem, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate, getTodayString } from '../utils/accounting';

interface ReturnsViewProps {
  returns: ReturnRecord[];
  orders: Order[];
  purchases: Purchase[];
  products: ProductItem[];
  accounts: FinancialAccount[];
  onAddReturn: (record: ReturnRecord, shouldRestock: boolean) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  returns,
  orders,
  purchases,
  products,
  accounts,
  onAddReturn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'customer_sale' | 'supplier_purchase'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Return State
  const [returnType, setReturnType] = useState<'customer_sale' | 'supplier_purchase'>('customer_sale');
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<'sellable' | 'damaged'>('sellable');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundAccountId, setRefundAccountId] = useState(accounts[0]?.id || '');
  const [reason, setReason] = useState('');

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchSearch =
        r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'All' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [returns, searchTerm, typeFilter]);

  const totalRefundsValue = useMemo(
    () => returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0),
    [returns]
  );
  const customerReturnsCount = useMemo(
    () => returns.filter((r) => r.type === 'customer_sale').length,
    [returns]
  );
  const supplierReturnsCount = useMemo(
    () => returns.filter((r) => r.type === 'supplier_purchase').length,
    [returns]
  );
  const damagedCount = useMemo(
    () => returns.filter((r) => r.condition === 'damaged').length,
    [returns]
  );

  const handleOpenModal = () => {
    if (orders.length > 0) {
      setSelectedReferenceId(orders[0].id);
      if (orders[0].items[0]) {
        setSelectedProductId(orders[0].items[0].productId);
        setRefundAmount(orders[0].items[0].sellingPrice || 0);
      }
    }
    setIsModalOpen(true);
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferenceId || !selectedProductId || quantity <= 0) {
      alert('Please select reference order/purchase and product');
      return;
    }

    let partyName = 'Party';
    let refNum = 'REF-001';

    if (returnType === 'customer_sale') {
      const order = orders.find((o) => o.id === selectedReferenceId);
      partyName = order?.customerName || 'Customer';
      refNum = order?.orderNumber || 'ORD-001';
    } else {
      const pur = purchases.find((p) => p.id === selectedReferenceId);
      partyName = pur?.supplierName || 'Supplier';
      refNum = pur?.purchaseNumber || 'PUR-001';
    }

    const prod = products.find((p) => p.id === selectedProductId);

    const newRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNumber: `RET-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      date: getTodayString(),
      type: returnType,
      referenceId: selectedReferenceId,
      referenceNumber: refNum,
      partyName,
      productId: selectedProductId,
      productName: prod?.name || 'Product',
      quantity,
      condition,
      refundAmount: Number(refundAmount || 0),
      refundAccountId: refundAccountId,
      reason: reason || 'Customer request return',
      isStockUpdated: true,
      createdAt: new Date().toISOString(),
    };

    // If it's a customer return and sellable, restock. If damaged, don't restore sellable inventory.
    const shouldRestock = returnType === 'customer_sale' && condition === 'sellable';

    onAddReturn(newRecord, shouldRestock);
    setIsModalOpen(false);
    setReason('');
    setQuantity(1);
    setRefundAmount(0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Returns & Refunds Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Customer sales returns, vendor purchase returns, sellable restocks & damaged write-offs
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Process Return</span>
        </button>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Returns
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {returns.length} <span className="text-xs font-normal text-neutral-500">records</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Audit ledger preserved</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Refunds Settled
          </div>
          <div className="text-base sm:text-xl font-bold text-rose-600">
            {formatCompactCurrency(totalRefundsValue)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Disbursed to customers</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Customer Returns
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {customerReturnsCount} <span className="text-xs font-normal text-neutral-500">items</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Processed from orders</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Damaged Write-offs
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {damagedCount} <span className="text-xs font-normal text-neutral-500">items</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Unsellable returns isolated</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search return#, order#, customer, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['All', 'customer_sale', 'supplier_purchase'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all ${
                typeFilter === t
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t === 'All'
                ? 'All Returns'
                : t === 'customer_sale'
                ? 'Customer Sales'
                : 'Supplier Purchase'}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Return #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Party</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-center">Condition</th>
                <th className="p-3 text-right">Refund Amount (৳)</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-neutral-400">
                    No return records found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50/80 transition-all">
                    <td className="p-3 font-bold text-neutral-900">#{r.returnNumber}</td>
                    <td className="p-3 text-neutral-600">{formatDate(r.date)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.type === 'customer_sale'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {r.type === 'customer_sale' ? 'Sale Return' : 'Purchase Return'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-neutral-800">
                      #{r.referenceNumber}
                    </td>
                    <td className="p-3 font-medium text-neutral-900">{r.partyName}</td>
                    <td className="p-3 font-medium text-neutral-800">{r.productName}</td>
                    <td className="p-3 text-center font-bold text-neutral-900">{r.quantity}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          r.condition === 'sellable'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.condition}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-neutral-900">
                      {formatCurrency(r.refundAmount)}
                    </td>
                    <td className="p-3 text-neutral-600 max-w-xs truncate">{r.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Process Return & Restock</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-4 space-y-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Return Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnType('customer_sale')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center cursor-pointer ${
                      returnType === 'customer_sale'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    Customer Sales Return
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('supplier_purchase')}
                    className={`py-2 px-3 rounded-xl font-bold border text-center cursor-pointer ${
                      returnType === 'supplier_purchase'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    Supplier Purchase Return
                  </button>
                </div>
              </div>

              {returnType === 'customer_sale' ? (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Select Order *</label>
                  <select
                    value={selectedReferenceId}
                    onChange={(e) => setSelectedReferenceId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.orderNumber} - {o.customerName} ({formatDate(o.orderDate)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Select Purchase PO *</label>
                  <select
                    value={selectedReferenceId}
                    onChange={(e) => setSelectedReferenceId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                  >
                    {purchases.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.purchaseNumber} - {p.supplierName} ({formatDate(p.purchaseDate)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Returned Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Quantity Returned *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Item Condition *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white font-bold"
                  >
                    <option value="sellable">Sellable (Restores Stock)</option>
                    <option value="damaged">Damaged (Loss / Do Not Restock)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Refund / Credit Amount (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Disburse From Account
                  </label>
                  <select
                    value={refundAccountId}
                    onChange={(e) => setRefundAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Reason for Return</label>
                <input
                  type="text"
                  placeholder="e.g. Courier damage, size exchange, cancelled at doorstep"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-2.5 bg-neutral-100 rounded-xl text-[11px] text-neutral-700">
                {condition === 'sellable' ? (
                  <span>
                    ✅ Stock will be restored to physical inventory & available stock automatically.
                  </span>
                ) : (
                  <span>
                    ⚠️ Item marked as DAMAGED. Stock will NOT be added back to available inventory.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
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
                  Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
