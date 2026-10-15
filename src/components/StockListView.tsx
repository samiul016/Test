import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface StockListViewProps {
  products: ProductItem[];
  onRestockProduct: (prodId: string, delta: number) => void;
  onNavigateToProducts: () => void;
}

export const StockListView: React.FC<StockListViewProps> = ({
  products,
  onRestockProduct,
  onNavigateToProducts,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      let matchFilter = true;
      if (filter === 'low') matchFilter = p.stock > 0 && p.stock <= p.minStockAlert;
      if (filter === 'out') matchFilter = p.stock <= 0;

      return matchSearch && matchFilter;
    });
  }, [products, search, filter]);

  const totalUnits = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products]);
  const totalValuation = useMemo(() => products.reduce((s, p) => s + p.unitCost * p.stock, 0), [products]);
  const lowCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length, [products]);
  const outCount = useMemo(() => products.filter((p) => p.stock <= 0).length, [products]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Stock List</h1>
        </div>

        <button
          type="button"
          onClick={onNavigateToProducts}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Manage Products</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">Total Stock</div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-700 mt-1 truncate">
            {totalUnits} <span className="text-xs font-normal text-neutral-500">pcs</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">Stock Value</div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 mt-1 truncate">
            {formatCurrency(totalValuation)}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">Stock Alerts</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-base font-bold font-mono text-amber-700">
              {lowCount} Low
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-base font-bold font-mono text-rose-700">
              {outCount} Out
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by product name, category, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'low'
                ? 'bg-amber-100 text-amber-900 font-bold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Low Stock ({lowCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'out'
                ? 'bg-rose-100 text-rose-900 font-bold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Out of Stock ({outCount})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Stock Level</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Unit Cost</th>
                <th className="py-3 px-3 text-right">Total Valuation</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                    No products matching filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOut = prod.stock <= 0;
                  const isLow = !isOut && prod.stock <= prod.minStockAlert;
                  const stockValue = prod.stock * prod.unitCost;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900 text-sm">{prod.name}</div>
                        {prod.sku && <div className="text-[10px] text-neutral-400 font-mono">SKU: {prod.sku}</div>}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                        {prod.category}
                      </td>

                      {/* Stock Level with +/- Steppers */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, -1)}
                            disabled={prod.stock <= 0}
                            className="text-neutral-500 hover:text-rose-600 font-bold px-1 disabled:opacity-30 cursor-pointer"
                            title="Decrease 1"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold text-sm min-w-[32px] text-center ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-neutral-900'
                            }`}
                          >
                            {prod.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, 1)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold px-1 cursor-pointer"
                            title="Increase 1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-neutral-700">
                        {formatCurrency(prod.unitCost)}
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900">
                        {formatCurrency(stockValue)}
                      </td>

                      {/* Quick Restock Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, 5)}
                            className="px-2 py-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, 10)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer"
                          >
                            +10
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
