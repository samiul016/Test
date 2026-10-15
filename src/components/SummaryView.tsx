import React, { useMemo } from 'react';
import {
  Boxes,
  ClipboardCheck,
  Coins,
  TrendingUp,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { ProductItem, Order } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface SummaryViewProps {
  products: ProductItem[];
  orders: Order[];
  onNavigateToTab: (tab: 'inventory' | 'new-order' | 'orders') => void;
  onOpenOrderDetails: (order: Order) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  products,
  orders,
  onNavigateToTab,
  onOpenOrderDetails,
}) => {
  // Key Metrics
  const totalStockUnits = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products]);
  const totalStockCost = useMemo(() => products.reduce((s, p) => s + p.unitCost * p.stock, 0), [products]);

  const totalOrders = orders.length;
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + (o.totalAmount ?? o.sellingPrice ?? 0), 0),
    [orders]
  );
  const totalCost = useMemo(
    () =>
      orders.reduce(
        (s, o) => s + (o.totalCost ?? (o.totalProductCost || 0) + (o.totalDirectCosts || 0)),
        0
      ),
    [orders]
  );
  const totalProfit = useMemo(() => orders.reduce((s, o) => s + (o.netProfit || 0), 0), [orders]);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            সামগ্রিক হিসাব ও প্রফিট রিপোর্ট (Summary)
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            আপনার ব্যবসার প্রোডাক্ট স্টক, কয়টা অর্ডার আসছে, মোট খরচ ও নিট লাভের সহজ চিত্র।
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('new-order')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ নতুন অর্ডার এন্ট্রি</span>
        </button>
      </div>

      {/* 4 Essential Metrics Cards (প্রোডাক্ট, অর্ডার, খরচ, লাভ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Products & Stock */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">১. পণ্য ও বর্তমান স্টক</span>
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono-numbers">
            {totalStockUnits} <span className="text-xs font-normal text-neutral-500">পিস</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1.5">
            {products.length} প্রকার পণ্য · কেনা মূল্য {formatCurrency(totalStockCost)}
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">২. মোট অর্ডার এসেছে</span>
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono-numbers">
            {totalOrders} <span className="text-xs font-normal text-neutral-500">টি</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1.5">
            মোট বিক্রয়: {formatCurrency(totalRevenue)}
          </div>
        </div>

        {/* 3. Total Cost */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">৩. মোট খরচ (Cost)</span>
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-800 font-mono-numbers">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-xs text-neutral-500 mt-1.5">
            পণ্য + ডেলিভারি + প্যাকেজিং
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-300 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">৪. নিট লাভ (Profit)</span>
            <TrendingUp className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 font-mono-numbers">
            {formatCurrency(totalProfit)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1.5">
            গড় প্রফিট মার্জিন: {formatPercent(avgMargin)}
          </div>
        </div>
      </div>

      {/* Simple Financial Summary Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
          সহজ হিসাব মিলান (Profit Formula)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-neutral-50 rounded-xl">
            <div className="text-[11px] text-neutral-500 font-medium">কাস্টমারদের কাছে মোট বিক্রি</div>
            <div className="text-lg font-bold text-neutral-900 font-mono-numbers mt-0.5">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl">
            <div className="text-[11px] text-neutral-500 font-medium">(-) মোট খরচ (প্রোডাক্ট + ডেলিভারি)</div>
            <div className="text-lg font-bold text-rose-700 font-mono-numbers mt-0.5">
              - {formatCurrency(totalCost)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[11px] text-emerald-800 font-bold">(=) পকেটে মোট লাভ (নিট প্রফিট)</div>
            <div className="text-lg font-extrabold text-emerald-900 font-mono-numbers mt-0.5">
              = {formatCurrency(totalProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent 5 Orders Clean Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            সর্বশেষ অর্ডারসমূহ
          </h2>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>সবগুলো দেখুন ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {orders.slice(0, 5).map((ord) => (
            <div
              key={ord.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-bold text-neutral-900 flex items-center gap-2">
                  <span className="font-mono-numbers">{ord.orderNumber}</span>
                  <span>·</span>
                  <span>{ord.customerName}</span>
                </div>
                <div className="text-neutral-500 text-[11px] mt-0.5">
                  {ord.items.map((i) => `${i.quantity}x ${i.productName.split('(')[0]}`).join(', ')}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-neutral-400 text-[10px]">
                    বিক্রি: ৳{ord.totalAmount ?? ord.sellingPrice}
                  </div>
                  <div className="font-bold font-mono-numbers text-emerald-700">
                    লাভ: +{formatCurrency(ord.netProfit)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenOrderDetails(ord)}
                  className="px-2.5 py-1 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium cursor-pointer"
                >
                  রসিদ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
