import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Purchase, Supplier, ProductItem, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/accounting';

interface PurchasesViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: ProductItem[];
  accounts: FinancialAccount[];
  onOpenNewPurchase: () => void;
  onReceivePurchase: (purchaseId: string) => void;
  onRecordSupplierPayment: (supplierId: string, amount: number, accountId: string, notes?: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  accounts,
  onOpenNewPurchase,
  onReceivePurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'ordered' | 'draft'>('all');
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<Purchase | null>(null);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.invoiceReference && p.invoiceReference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  // Aggregate stats
  const totalPurchaseValue = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    [purchases]
  );
  const totalPaid = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
    [purchases]
  );
  const totalOutstandingDue = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0),
    [purchases]
  );
  const receivedCount = useMemo(
    () => purchases.filter((p) => p.status === 'received').length,
    [purchases]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Purchase Management (PO)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Procurement invoices, landed cost allocation, supplier payables & batch intake
          </p>
        </div>

        <button
          onClick={onOpenNewPurchase}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Invoice</span>
        </button>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Purchases
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {formatCompactCurrency(totalPurchaseValue)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">{purchases.length} invoices recorded</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Paid
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {formatCompactCurrency(totalPaid)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Disbursed to suppliers</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Supplier Dues
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {formatCompactCurrency(totalOutstandingDue)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Unpaid purchase balance</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Stock Received
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {receivedCount} <span className="text-xs text-neutral-500 font-normal">invoices</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Added to warehouse inventory</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search PO number, supplier, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'received', 'ordered', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">PO Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3 text-right">Landed Cost</th>
                <th className="p-3 text-right">Total (৳)</th>
                <th className="p-3 text-right">Paid (৳)</th>
                <th className="p-3 text-right">Due (৳)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-neutral-400">
                    No purchase invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-neutral-50/80 transition-all">
                    <td className="p-3 font-bold text-neutral-900">
                      <div>#{pur.purchaseNumber}</div>
                      {pur.invoiceReference && (
                        <div className="text-[10px] text-neutral-400">Ref: {pur.invoiceReference}</div>
                      )}
                    </td>
                    <td className="p-3 text-neutral-600">{formatDate(pur.purchaseDate)}</td>
                    <td className="p-3 font-medium text-neutral-900">{pur.supplierName}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded-md font-semibold text-neutral-700">
                        {pur.items.length} lines
                      </span>
                    </td>
                    <td className="p-3 text-right text-blue-600 font-medium">
                      {pur.totalLandedCost > 0 ? `+${formatCurrency(pur.totalLandedCost)}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-neutral-900">
                      {formatCurrency(pur.totalAmount)}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(pur.paidAmount)}
                    </td>
                    <td className="p-3 text-right font-bold">
                      <span className={pur.dueAmount > 0 ? 'text-amber-700' : 'text-neutral-400'}>
                        {formatCurrency(pur.dueAmount)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pur.status === 'received'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pur.status === 'ordered'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {pur.status === 'received' && <CheckCircle2 className="w-3 h-3" />}
                        {pur.status === 'ordered' && <Clock className="w-3 h-3" />}
                        {pur.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPurchaseDetails(pur)}
                          title="View Invoice & Items"
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {pur.status !== 'received' && (
                          <button
                            onClick={() => onReceivePurchase(pur.id)}
                            title="Mark as Received (Intake stock)"
                            className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            Receive Stock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-base font-bold">
                  Purchase #{selectedPurchaseDetails.purchaseNumber}
                </h3>
                <p className="text-xs text-neutral-400">
                  Supplier: {selectedPurchaseDetails.supplierName} &bull; Date:{' '}
                  {formatDate(selectedPurchaseDetails.purchaseDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetails(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-neutral-800 capitalize">
                    {selectedPurchaseDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Ref</span>
                  <span className="font-medium text-neutral-800">
                    {selectedPurchaseDetails.invoiceReference || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Payment</span>
                  <span className="font-medium text-neutral-800">
                    {selectedPurchaseDetails.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    Stock Intake
                  </span>
                  <span className="font-bold text-emerald-700">
                    {selectedPurchaseDetails.isStockReceived ? 'Added to stock' : 'Not received yet'}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Base</th>
                      <th className="p-2.5 text-right">Landed Cost</th>
                      <th className="p-2.5 text-right">Effective Unit Cost</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedPurchaseDetails.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium">{it.productName}</td>
                        <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="p-2.5 text-right text-neutral-500">
                          {formatCurrency(it.unitCost)}
                        </td>
                        <td className="p-2.5 text-right text-blue-600">
                          +{formatCurrency(it.allocatedLandedCost / it.quantity)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-neutral-900">
                          {formatCurrency(it.effectiveUnitCost)}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {formatCurrency(it.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>{formatCurrency(selectedPurchaseDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Shipping & Transport:</span>
                  <span>+{formatCurrency(selectedPurchaseDetails.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Loading & Unloading:</span>
                  <span>+{formatCurrency(selectedPurchaseDetails.loadingCost)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-1 flex justify-between font-bold text-neutral-900 text-sm">
                  <span>Total Landed Amount:</span>
                  <span className="text-blue-700">
                    {formatCurrency(selectedPurchaseDetails.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Paid:</span>
                  <span>{formatCurrency(selectedPurchaseDetails.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700">
                  <span>Due to Supplier:</span>
                  <span>{formatCurrency(selectedPurchaseDetails.dueAmount)}</span>
                </div>
              </div>

              {selectedPurchaseDetails.notes && (
                <div className="text-neutral-500 italic">
                  Note: {selectedPurchaseDetails.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setSelectedPurchaseDetails(null)}
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
