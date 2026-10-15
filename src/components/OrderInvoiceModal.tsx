import React, { useState } from 'react';
import { X, Printer, Package, Phone, Eye, EyeOff } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/accounting';

interface OrderInvoiceModalProps {
  order: Order | null;
  settings: AppSettings;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const [showProfitOnPrint, setShowProfitOnPrint] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalBill = order.totalAmount ?? order.sellingPrice;
  const paidVal = order.paidAmount ?? (order.paymentStatus === 'paid' ? totalBill : 0);
  const dueVal = order.dueAmount ?? Math.max(0, totalBill - paidVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs no-print:flex">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Toolbar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70 no-print">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 text-sm">
              Sales Invoice & Packing Slip (#{order.orderNumber})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProfitOnPrint(!showProfitOnPrint)}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
              title="Toggle internal profit analysis"
            >
              {showProfitOnPrint ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showProfitOnPrint ? 'Profit Visible' : 'Hide Profit'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 space-y-6 text-neutral-900">
          {/* Header & Shop Details */}
          <div className="flex items-start justify-between border-b border-neutral-200 pb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                {settings.shopName}
              </h1>
              <p className="text-xs text-neutral-500 mt-1">{settings.shopAddress}</p>
              <p className="text-xs text-neutral-500 font-mono">{settings.shopPhone}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                OFFICIAL INVOICE
              </span>
              <div className="text-base font-bold font-mono text-neutral-900 mt-2">
                #{order.orderNumber}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Date: {formatDate(order.orderDate || order.createdAt)}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs">
            <div>
              <div className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                Bill To Customer
              </div>
              <div className="font-bold text-neutral-900 text-sm">{order.customerName}</div>
              <div className="font-mono text-neutral-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-neutral-400" />
                <span>{order.customerPhone}</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                Delivery Destination
              </div>
              <div className="font-semibold text-neutral-800">{order.packageTitle}</div>
              <div className="text-neutral-600 mt-0.5">{order.customerAddress}</div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
              Order Line Items
            </div>
            <table className="w-full text-left border-collapse text-xs border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200 text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                  {showProfitOnPrint && (
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items.map((it, idx) => {
                  const unitPrice = it.sellingPrice || it.suggestedPrice || it.unitCost;
                  const lineTotal = unitPrice * it.quantity - (it.discount || 0);
                  return (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 text-neutral-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-neutral-900">{it.productName}</td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-700">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                        {formatCurrency(lineTotal)}
                      </td>
                      {showProfitOnPrint && (
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-500">
                          {formatCurrency(it.unitCost)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
              <span className="font-bold text-amber-900">Instructions: </span>
              <span className="text-amber-800">{order.notes}</span>
            </div>
          )}

          {/* Billing Breakdown */}
          <div className="border-t border-neutral-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showProfitOnPrint ? (
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                  <div className="font-bold text-neutral-700 uppercase tracking-wider text-[10px] mb-1">
                    Internal Profitability Audit
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>COGS (Products Cost):</span>
                    <span className="font-mono">{formatCurrency(order.totalProductCost)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Direct Delivery Cost:</span>
                    <span className="font-mono">{formatCurrency(order.courierCost || order.transportCost || 0)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Packaging & Stickers:</span>
                    <span className="font-mono">{formatCurrency(order.packagingCost + (order.stickerCost || 0))}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-1 text-emerald-700 font-bold">
                    <span>Order Net Contribution:</span>
                    <span className="font-mono">+{formatCurrency(order.netProfit || order.contributionProfit || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic flex items-center">
                  <span>Thank you for your business! All items guaranteed as per order specifications.</span>
                </div>
              )}

              {/* Total bill */}
              <div className="space-y-1.5 text-xs text-right">
                {order.orderDiscount && order.orderDiscount > 0 ? (
                  <div className="flex justify-between sm:justify-end gap-6 text-xs text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono font-bold">-{formatCurrency(order.orderDiscount)}</span>
                  </div>
                ) : null}

                {order.deliveryFeeCharged && order.deliveryFeeCharged > 0 ? (
                  <div className="flex justify-between sm:justify-end gap-6 text-xs text-neutral-600">
                    <span>Delivery Charge:</span>
                    <span className="font-mono font-semibold">+{formatCurrency(order.deliveryFeeCharged)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between sm:justify-end gap-6 text-sm font-semibold text-neutral-800 border-t border-neutral-100 pt-1">
                  <span>Total Amount:</span>
                  <span className="font-bold font-mono text-base text-neutral-900">
                    {formatCurrency(totalBill)}
                  </span>
                </div>

                <div className="flex justify-between sm:justify-end gap-6 text-neutral-500 text-[11px] pt-1">
                  <span>Payment Method:</span>
                  <span className="font-medium text-neutral-700">{order.paymentMethod || 'Cash on Delivery'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
            <div>
              Status: <strong className="text-neutral-800 uppercase">{order.status}</strong>
            </div>
            <div className="border-t border-neutral-300 pt-1 px-4 text-center">
              Authorized Signature
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
