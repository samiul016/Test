import React, { useState } from 'react';
import { X, Plus, Trash2, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { ProductItem, Supplier, Purchase, FinancialAccount } from '../types';
import { formatCurrency, allocateLandedCosts, getTodayString } from '../utils/accounting';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  suppliers: Supplier[];
  accounts: FinancialAccount[];
  onSavePurchase: (purchase: Purchase) => void;
  initialPurchase?: Purchase | null;
}

interface TempLineItem {
  productId: string;
  quantity: number;
  unitCost: number;
  lineDiscount: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  accounts,
  onSavePurchase,
  initialPurchase,
}) => {
  if (!isOpen) return null;

  const [supplierId, setSupplierId] = useState<string>(
    initialPurchase?.supplierId || (suppliers[0]?.id ?? '')
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    initialPurchase?.purchaseDate || getTodayString()
  );
  const [invoiceReference, setInvoiceReference] = useState<string>(
    initialPurchase?.invoiceReference || ''
  );
  const [status, setStatus] = useState<'draft' | 'ordered' | 'received'>(
    (initialPurchase?.status as any) || 'received'
  );

  const [lineItems, setLineItems] = useState<TempLineItem[]>(
    initialPurchase?.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitCost: it.unitCost,
      lineDiscount: it.lineDiscount || 0,
    })) || [
      {
        productId: products[0]?.id || '',
        quantity: 10,
        unitCost: products[0]?.unitCost || 100,
        lineDiscount: 0,
      },
    ]
  );

  // Landed costs
  const [shippingCost, setShippingCost] = useState<number>(initialPurchase?.shippingCost || 0);
  const [loadingCost, setLoadingCost] = useState<number>(initialPurchase?.loadingCost || 0);
  const [otherLandedCost, setOtherLandedCost] = useState<number>(
    initialPurchase?.otherLandedCost || 0
  );
  const [overallDiscount, setOverallDiscount] = useState<number>(initialPurchase?.discount || 0);

  // Payment
  const [paidAmount, setPaidAmount] = useState<number>(initialPurchase?.paidAmount || 0);
  const [paymentAccountId, setPaymentAccountId] = useState<string>(
    initialPurchase?.paymentAccountId || accounts[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialPurchase?.paymentMethod || 'Cash'
  );
  const [notes, setNotes] = useState<string>(initialPurchase?.notes || '');

  const totalLandedCost = Number(shippingCost || 0) + Number(loadingCost || 0) + Number(otherLandedCost || 0);

  // Calculate allocations
  const itemsSubtotal = lineItems.reduce(
    (sum, it) => sum + (Number(it.unitCost || 0) * Number(it.quantity || 0) - Number(it.lineDiscount || 0)),
    0
  );

  const allocated = allocateLandedCosts(lineItems, totalLandedCost, 'value');

  const grandTotal = Math.max(0, itemsSubtotal - Number(overallDiscount || 0) + totalLandedCost);
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount || 0));

  const handleAddLine = () => {
    if (products.length === 0) return;
    setLineItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        quantity: 5,
        unitCost: products[0].unitCost,
        lineDiscount: 0,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, patch: Partial<TempLineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, ...patch };
        if (patch.productId) {
          const prod = products.find((p) => p.id === patch.productId);
          if (prod) {
            updated.unitCost = prod.unitCost;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (lineItems.length === 0) {
      alert('Add at least one product');
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === supplierId);

    const purchaseItems = lineItems.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      const alloc = allocated[idx];
      return {
        id: `pi-${Date.now()}-${idx}`,
        productId: it.productId,
        productName: prod?.name || 'Product',
        sku: prod?.sku,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        lineDiscount: Number(it.lineDiscount || 0),
        allocatedLandedCost: alloc?.allocatedLandedCost || 0,
        effectiveUnitCost: alloc?.effectiveUnitCost || Number(it.unitCost),
        totalCost: alloc?.totalCost || Number(it.unitCost) * Number(it.quantity),
      };
    });

    const newPurchase: Purchase = {
      id: initialPurchase?.id || `pur-${Date.now()}`,
      purchaseNumber:
        initialPurchase?.purchaseNumber ||
        `PUR-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      supplierId,
      supplierName: selectedSup?.companyName || selectedSup?.name || 'Supplier',
      purchaseDate,
      invoiceReference,
      items: purchaseItems,
      subtotal: itemsSubtotal,
      discount: Number(overallDiscount || 0),
      shippingCost: Number(shippingCost || 0),
      loadingCost: Number(loadingCost || 0),
      otherLandedCost: Number(otherLandedCost || 0),
      totalLandedCost,
      totalAmount: grandTotal,
      paidAmount: Number(paidAmount || 0),
      dueAmount,
      paymentMethod,
      paymentAccountId,
      status,
      isStockReceived: status === 'received',
      notes,
      createdAt: initialPurchase?.createdAt || new Date().toISOString(),
    };

    onSavePurchase(newPurchase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {initialPurchase ? `Edit Purchase #${initialPurchase.purchaseNumber}` : 'New Purchase Invoice'}
              </h2>
              <p className="text-xs text-neutral-400">
                Landed cost allocation, multi-item line, supplier dues & inventory valuation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all cursor-pointer text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Top Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
              >
              </input>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Invoice Ref / Memo</label>
              <input
                type="text"
                placeholder="e.g. INV-8840"
                value={invoiceReference}
                onChange={(e) => setInvoiceReference(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Purchase Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white font-semibold"
              >
                <option value="received">Received (Increases Stock & WAC)</option>
                <option value="ordered">Ordered (Awaiting Delivery)</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-neutral-900 text-sm">Product Line Items</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Product Row
              </button>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 w-24">Quantity</th>
                    <th className="p-2.5 w-28">Unit Cost (৳)</th>
                    <th className="p-2.5 w-24">Discount (৳)</th>
                    <th className="p-2.5 w-32">Effective Cost (৳)</th>
                    <th className="p-2.5 w-28 text-right">Line Total (৳)</th>
                    <th className="p-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lineItems.map((item, idx) => {
                    const alloc = allocated[idx];
                    return (
                      <tr key={idx} className="hover:bg-neutral-50/60">
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateLine(idx, { productId: e.target.value })}
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku || p.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateLine(idx, { quantity: Math.max(1, Number(e.target.value)) })
                            }
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              handleUpdateLine(idx, { unitCost: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.lineDiscount}
                            onChange={(e) =>
                              handleUpdateLine(idx, { lineDiscount: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2 text-neutral-600 font-semibold">
                          ৳ {alloc?.effectiveUnitCost.toFixed(2) || '0.00'}
                          {alloc?.allocatedLandedCost > 0 && (
                            <span className="text-[10px] text-blue-600 block">
                              +৳{(alloc.allocatedLandedCost / item.quantity).toFixed(2)} landed
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right font-bold text-neutral-900">
                          {formatCurrency(alloc?.totalCost || 0)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lineItems.length <= 1}
                            className="text-neutral-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Landed Costs Allocation Box */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-2">
              Landed Costs (Automatically added to product inventory valuation)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-600 mb-1">Shipping / Transport (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Loading / Unloading (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={loadingCost}
                  onChange={(e) => setLoadingCost(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Other Customs / Misc (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={otherLandedCost}
                  onChange={(e) => setOtherLandedCost(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-neutral-600 mb-1">Overall Invoice Discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
            <div className="space-y-3">
              <div className="font-bold text-neutral-900">Payment & Account Settlement</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 mb-1">Amount Paid Now (৳)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Credit">Credit (Pay Later)</option>
                  </select>
                </div>
              </div>

              {paidAmount > 0 && (
                <div>
                  <label className="block text-neutral-600 mb-1">Paid From Account</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-neutral-600 mb-1">Notes / Memo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Batch details, supplier remarks..."
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-600">
                  <span>Items Subtotal:</span>
                  <span>{formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Total Landed Costs:</span>
                  <span className="text-blue-600">+{formatCurrency(totalLandedCost)}</span>
                </div>
                {overallDiscount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Discount:</span>
                    <span className="text-emerald-600">-{formatCurrency(overallDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-sm text-neutral-900">
                  <span>Total Purchase Cost:</span>
                  <span className="text-blue-700">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-600 font-semibold">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-neutral-900 border-t border-neutral-100 pt-1">
                  <span>Due to Supplier:</span>
                  <span className={dueAmount > 0 ? 'text-amber-700' : 'text-neutral-500'}>
                    {formatCurrency(dueAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                {status === 'received' && (
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium bg-emerald-50 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Stock and Weighted Average Cost (WAC) will be updated on submit.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Save Purchase Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
