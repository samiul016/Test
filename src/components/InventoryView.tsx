import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { ProductItem, Order } from '../types';
import { formatCurrency } from '../utils/formatters';

interface InventoryViewProps {
  products: ProductItem[];
  orders: Order[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
  onRestockProduct: (prodId: string, additionalQty: number) => void;
  onNavigateToNewOrder: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
  onNavigateToNewOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [category, setCategory] = useState('সাধারণ');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [unit, setUnit] = useState('পিস');
  const [error, setError] = useState('');

  // Calculate times ordered for each product
  const orderedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        counts[it.productId] = (counts[it.productId] || 0) + it.quantity;
      });
    });
    return counts;
  }, [orders]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Totals
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const totalCostValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + p.unitCost * p.stock, 0);
  }, [products]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingProduct(null);
    setName('');
    setCategory('সাধারণ');
    setUnitCost('');
    setSellingPrice('');
    setStock(10);
    setUnit('পিস');
    setError('');
  };

  const openEditModal = (p: ProductItem) => {
    setModalMode('edit');
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setUnitCost(p.unitCost);
    setSellingPrice(p.suggestedSellingPrice);
    setStock(p.stock);
    setUnit(p.unit);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('পণ্যের নাম লিখুন');
      return;
    }
    const cost = Number(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('সঠিক কেনা দাম (Cost) লিখুন');
      return;
    }

    const sell = Number(sellingPrice) || Math.round(cost * 1.3);

    if (modalMode === 'add') {
      const newProd: ProductItem = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        category: category.trim() || 'General',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        reservedStock: 0,
        minStockAlert: 5,
        isActive: true,
        unit: unit.trim() || 'pcs',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newProd);
    } else if (modalMode === 'edit' && editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        category: category.trim() || 'সাধারণ',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        unit: unit.trim() || 'পিস',
      });
    }

    setModalMode('none');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            পণ্য ও স্টক তালিকা (Inventory)
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            দোকানের সব পণ্য, বর্তমান স্টক, কেনা দাম এবং প্রতিটি পণ্যে লাভ দেখুন ও সহজে পরিবর্তন করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন পণ্য লিখুন</span>
          </button>
        </div>
      </div>

      {/* 3 Simple Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">মোট পণ্য আইটেম</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono-numbers mt-1">
            {products.length} <span className="text-xs font-normal text-neutral-500">প্রকার</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">বর্তমানে স্টকে মোট আছে</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {totalStockUnits} <span className="text-xs font-normal text-neutral-500">পিস পণ্য</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">মোট স্টক ক্রয়ের খরচ (Cost Value)</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono-numbers mt-1">
            {formatCurrency(totalCostValuation)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="পণ্য বা আইটেমের নাম লিখে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-neutral-400 hover:text-neutral-700 px-2"
          >
            মুছুন
          </button>
        )}
      </div>

      {/* Clean Inventory Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">পণ্যের নাম</th>
                <th className="py-3 px-3 text-center">বর্তমান স্টক (Stock)</th>
                <th className="py-3 px-3 text-right">কেনা দাম (Cost)</th>
                <th className="py-3 px-3 text-right">বিক্রয় মূল্য</th>
                <th className="py-3 px-3 text-right">প্রতিটিতে লাভ</th>
                <th className="py-3 px-3 text-center">কয়টা অর্ডার আসছে</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400 text-xs">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const profitPerUnit = prod.suggestedSellingPrice - prod.unitCost;
                  const timesOrdered = orderedCounts[prod.id] || 0;
                  const isLow = prod.stock <= 5;
                  const isOut = prod.stock <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900 text-sm">{prod.name}</div>
                        <div className="text-[11px] text-neutral-400">
                          {prod.category} · {prod.unit}
                        </div>
                      </td>

                      {/* Stock with quick +/- */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, -1)}
                            disabled={prod.stock <= 0}
                            className="text-neutral-500 hover:text-rose-600 disabled:opacity-30 cursor-pointer font-bold px-1"
                            title="১ পিস কমান"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono-numbers font-bold text-sm min-w-[32px] text-center ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-neutral-900'
                            }`}
                          >
                            {prod.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRestockProduct(prod.id, 1)}
                            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold px-1"
                            title="১ পিস বাড়ান"
                          >
                            +
                          </button>
                        </div>
                        {isOut ? (
                          <div className="text-[10px] text-rose-600 font-bold mt-0.5">স্টক শেষ</div>
                        ) : isLow ? (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">কম স্টক</div>
                        ) : null}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold font-mono-numbers text-neutral-800 text-sm">
                          {formatCurrency(prod.unitCost)}
                        </div>
                        <div className="text-[10px] text-neutral-400">প্রতি {prod.unit}</div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-semibold font-mono-numbers text-neutral-900 text-sm">
                          {formatCurrency(prod.suggestedSellingPrice)}
                        </div>
                      </td>

                      {/* Profit per item */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-bold font-mono-numbers text-sm ${
                            profitPerUnit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          +{formatCurrency(profitPerUnit)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono-numbers">
                          {prod.unitCost > 0
                            ? `${((profitPerUnit / prod.unitCost) * 100).toFixed(0)}% লাভ`
                            : '0%'}
                        </div>
                      </td>

                      {/* Times ordered */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono-numbers font-bold text-neutral-900 text-sm bg-neutral-100 px-2 py-0.5 rounded-md">
                          {timesOrdered}
                        </span>
                        <span className="text-[11px] text-neutral-500 ml-1">পিস</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-sm">
                {modalMode === 'add' ? 'নতুন পণ্য যুক্ত করুন' : 'পণ্য তথ্য এডিট করুন'}
              </h3>
              <button
                onClick={() => setModalMode('none')}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  পণ্যের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: চকলেট বক্স, লাল গোলাপ, কাস্টম মগ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: চকলেট, ফুল"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    placeholder="পিস / প্যাকেট"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    কেনা দাম (Cost ৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-sm font-mono-numbers border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    বিক্রয় মূল্য (Selling ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 text-sm font-mono-numbers border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  বর্তমান স্টক সংখ্যা (Stock Quantity)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm font-mono-numbers border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'সেভ করুন' : 'আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
