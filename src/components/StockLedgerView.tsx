import React, { useState, useMemo } from 'react';
import {
  Boxes,
  History,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { ProductItem, StockLedgerEntry, StockMovementType } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate, getTodayString } from '../utils/accounting';

interface StockLedgerViewProps {
  products: ProductItem[];
  ledger: StockLedgerEntry[];
  onAddStockAdjustment: (
    productId: string,
    delta: number,
    movementType: StockMovementType,
    reason: string
  ) => void;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({
  products,
  ledger,
  onAddStockAdjustment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'ledger'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [movementFilter, setMovementFilter] = useState<string>('All');

  // Adjustment Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [adjType, setAdjType] = useState<'add' | 'remove' | 'damage'>('add');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjReason, setAdjReason] = useState<string>('Physical count reconciliation');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Aggregate stats
  const totalPhysicalUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0), 0),
    [products]
  );
  const totalReservedUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.reservedStock || 0), 0),
    [products]
  );
  const totalAvailableUnits = Math.max(0, totalPhysicalUnits - totalReservedUnits);
  const totalInventoryValuation = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0) * (p.unitCost || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.isActive && p.stock <= p.minStockAlert).length,
    [products]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Filter ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter((l) => {
      const matchSearch =
        l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchMove = movementFilter === 'All' || l.movementType === movementFilter;
      return matchSearch && matchMove;
    });
  }, [ledger, searchTerm, movementFilter]);

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjQty <= 0) return;

    let delta = adjQty;
    let type: StockMovementType = 'stock_adjustment';
    if (adjType === 'remove') {
      delta = -adjQty;
      type = 'stock_adjustment';
    } else if (adjType === 'damage') {
      delta = -adjQty;
      type = 'damage_writeoff';
    } else {
      delta = adjQty;
      type = 'stock_adjustment';
    }

    onAddStockAdjustment(adjustingProduct.id, delta, type, adjReason);
    setAdjustingProduct(null);
    setAdjQty(1);
    setAdjReason('Physical count reconciliation');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Inventory & Stock Movement Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Physical on-hand, reserved orders, available-to-sell & complete audit trail
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Current Inventory & Valuation
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Stock Movement Ledger
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (2 per row on mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Physical Stock
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">
            {totalPhysicalUnits} <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Across {products.length} SKUs</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Reserved / Pending
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {totalReservedUnits} <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Committed in pending orders</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Available To Sell
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {totalAvailableUnits} <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Ready for immediate fulfillment</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Inventory Valuation (WAC)
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {formatCompactCurrency(totalInventoryValuation)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Asset value on books</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'inventory'
                ? 'Search product, SKU, category...'
                : 'Search ledger, order#, reason...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        {activeSubTab === 'inventory' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-neutral-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-neutral-600">Movement:</span>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
            >
              <option value="All">All Movements</option>
              <option value="purchase_receive">Purchase Received</option>
              <option value="sales_order">Sales Order Dispatched</option>
              <option value="sales_return_sellable">Sales Return (Sellable)</option>
              <option value="sales_return_damaged">Sales Return (Damaged)</option>
              <option value="stock_adjustment">Stock Adjustment</option>
              <option value="damage_writeoff">Damage Write-off</option>
              <option value="opening_stock">Opening Stock</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Subtab 1: Inventory Table */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px] text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Unit Cost (WAC)</th>
                  <th className="p-3 text-center">Selling Price</th>
                  <th className="p-3 text-center">Physical Stock</th>
                  <th className="p-3 text-center">Reserved</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-right">Total Value</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  const available = Math.max(0, p.stock - (p.reservedStock || 0));
                  const valuation = p.stock * p.unitCost;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-all">
                      <td className="p-3 font-bold text-neutral-900">
                        <div>{p.name}</div>
                        {p.unit && <div className="text-[10px] text-neutral-400">Unit: {p.unit}</div>}
                      </td>
                      <td className="p-3 font-mono text-neutral-500">{p.sku || '-'}</td>
                      <td className="p-3 text-neutral-600">{p.category}</td>
                      <td className="p-3 text-center font-semibold text-neutral-800">
                        {formatCurrency(p.unitCost)}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {formatCurrency(p.suggestedSellingPrice)}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            isLow
                              ? 'bg-amber-100 text-amber-800 font-black'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3 text-center text-amber-700 font-medium">
                        {p.reservedStock || 0}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {available}
                      </td>
                      <td className="p-3 text-right font-bold text-neutral-900">
                        {formatCurrency(valuation)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Subtab 2: Movement Ledger */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3 text-center">Qty In</th>
                  <th className="p-3 text-center">Qty Out</th>
                  <th className="p-3 text-center">Balance After</th>
                  <th className="p-3 text-right">Unit Cost (৳)</th>
                  <th className="p-3 text-right">Total Value (৳)</th>
                  <th className="p-3">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-400">
                      No stock movement ledger records found.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((l) => (
                    <tr key={l.id} className="hover:bg-neutral-50/80 transition-all">
                      <td className="p-3 text-neutral-600">{formatDate(l.date)}</td>
                      <td className="p-3 font-bold text-neutral-900">{l.productName}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            l.quantityIn > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {l.quantityIn > 0 ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {l.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {l.quantityIn > 0 ? `+${l.quantityIn}` : '-'}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-600">
                        {l.quantityOut > 0 ? `-${l.quantityOut}` : '-'}
                      </td>
                      <td className="p-3 text-center font-bold text-neutral-900">
                        {l.balanceStockAfter}
                      </td>
                      <td className="p-3 text-right text-neutral-600">
                        {formatCurrency(l.unitCost)}
                      </td>
                      <td className="p-3 text-right font-bold text-neutral-900">
                        {formatCurrency(l.totalValue)}
                      </td>
                      <td className="p-3 text-neutral-600">
                        <div className="font-semibold text-neutral-900">{l.referenceNumber}</div>
                        <div className="text-[10px] text-neutral-400">{l.reason || l.user}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-sm font-bold">Stock Adjustment</h3>
                <p className="text-[11px] text-neutral-400">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="p-4 space-y-4">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Current Stock
                  </span>
                  <span className="text-base font-bold text-neutral-900">
                    {adjustingProduct.stock} {adjustingProduct.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Unit Cost
                  </span>
                  <span className="text-base font-bold text-blue-700">
                    {formatCurrency(adjustingProduct.unitCost)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('add')}
                    className={`py-2 px-2 rounded-xl font-bold border text-center cursor-pointer ${
                      adjType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    + Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('remove')}
                    className={`py-2 px-2 rounded-xl font-bold border text-center cursor-pointer ${
                      adjType === 'remove'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    - Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('damage')}
                    className={`py-2 px-2 rounded-xl font-bold border text-center cursor-pointer ${
                      adjType === 'damage'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Damage / Loss
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjQty}
                  onChange={(e) => setAdjQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Month-end count reconciliation, expired, broken"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-2 border border-neutral-200 rounded-xl text-neutral-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
