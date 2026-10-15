import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Plus,
  Calendar,
  Phone,
  Download,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { Order, OrderStatus, FinancialAccount } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/accounting';

interface OrdersListViewProps {
  orders: Order[];
  accounts: FinancialAccount[];
  onOpenOrderDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onRecordOrderPayment?: (orderId: string, amount: number, accountId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddNewOrder: () => void;
  onSendToCourier?: (order: Order) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  onOpenOrderDetails,
  onUpdateStatus,
  onDeleteOrder,
  onAddNewOrder,
  onSendToCourier,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchSearch =
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.customerPhone.includes(search) ||
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          (o.packageTitle && o.packageTitle.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter]);

  // Totals
  const totalRev = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + (o.totalAmount || o.sellingPrice || 0), 0),
    [orders]
  );
  const totalCost = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + (o.totalProductCost || 0) + (o.totalDirectCosts || 0), 0),
    [orders]
  );
  // Realized Net Profit - ONLY recognized when order status is 'delivered' as instructed
  const totalProfit = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'delivered')
        .reduce((s, o) => s + (o.netProfit || o.contributionProfit || 0), 0),
    [orders]
  );
  const deliveredOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'delivered').length,
    [orders]
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Phone',
      'Address',
      'Package Title',
      'Items',
      'Total Amount (৳)',
      'Cost (৳)',
      'Net Profit (৳)',
      'Status',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      formatDate(o.orderDate),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerAddress}"`,
      `"${o.packageTitle || ''}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}"`,
      o.totalAmount || o.sellingPrice,
      (o.totalProductCost || 0) + (o.totalDirectCosts || 0),
      o.netProfit || o.contributionProfit,
      o.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Order & Sales Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Customer sales orders, fulfillment tracking, invoices, partial payments & returns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white rounded-xl cursor-pointer"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onAddNewOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Total Orders
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-neutral-900 mt-1 truncate">
            {orders.length} <span className="text-xs font-normal text-neutral-500">orders</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            Active sales volume
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Total Sales Revenue
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-blue-700 mt-1 truncate">
            {formatCurrency(totalRev)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Gross order revenue</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Total Recognized Cost
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-neutral-800 mt-1 truncate">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">COGS + direct selling expenses</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Total Net Profit
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-emerald-700 mt-1 truncate">
            {formatCurrency(totalProfit)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
            {deliveredOrdersCount > 0
              ? `${deliveredOrdersCount} of ${orders.length} delivered · Margin: ${totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}%`
              : 'Delivered status hole jog hobe'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col sm:flex-row gap-3 shadow-2xs text-xs">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by customer name, phone, order number, or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none font-semibold text-neutral-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order # & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items / Package</th>
                <th className="py-3 px-3 text-right">Total Amount (৳)</th>
                <th className="py-3 px-3 text-right">Net Profit (৳)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const ordTotal = ord.totalAmount ?? ord.sellingPrice;

                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Order No & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold font-mono text-neutral-900 text-sm">
                          #{ord.orderNumber}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(ord.orderDate || ord.createdAt)}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{ord.customerName}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {ord.customerPhone}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="font-semibold text-neutral-900 truncate">
                          {ord.packageTitle || 'Custom Package'}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900 text-sm">
                        {formatCurrency(ordTotal)}
                      </td>

                      {/* Profit - Only recognized when status === 'delivered' */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {ord.status === 'delivered' ? (
                          <div
                            className={`font-mono font-bold text-sm ${
                              (ord.netProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            +{formatCurrency(ord.netProfit || ord.contributionProfit || 0)}
                          </div>
                        ) : ord.status === 'cancelled' || ord.status === 'returned' ? (
                          <div className="font-mono text-neutral-400 text-xs">
                            ৳0.00
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Pending Delivery
                            </span>
                            <span
                              className="text-[10px] text-neutral-400 font-mono mt-0.5"
                              title="Delivered status dile ei profit jog hobe"
                            >
                              (Est: +{formatCurrency(ord.netProfit || ord.contributionProfit || 0)})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            onUpdateStatus(ord.id, e.target.value as OrderStatus)
                          }
                          className="px-2 py-1 text-[11px] font-bold rounded-lg border border-neutral-300 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="returned">Returned</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenOrderDetails(ord)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                            title="Print / View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onSendToCourier && (
                            <button
                              type="button"
                              onClick={() => onSendToCourier(ord)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Send Parcel to Pathao / Courier"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(ord.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
