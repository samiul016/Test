import React, { useState } from 'react';
import {
  Box,
  X,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { PackagingMaterial, SelectedPackagingItem } from '../types';
import { formatCurrency } from '../utils/accounting';

interface PackagingMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: PackagingMaterial[];
  initialSelectedItems?: SelectedPackagingItem[];
  currentManualCost?: number | '';
  onApply: (selectedItems: SelectedPackagingItem[], finalPackagingCost: number) => void;
  onQuickAddMaterial?: (newMaterial: PackagingMaterial) => void;
}

export const PackagingMaterialsModal: React.FC<PackagingMaterialsModalProps> = ({
  isOpen,
  onClose,
  materials,
  initialSelectedItems = [],
  currentManualCost = '',
  onApply,
  onQuickAddMaterial,
}) => {
  // Quantities map: materialId -> quantity
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialSelectedItems.forEach((it) => {
      map[it.materialId] = it.quantity;
    });
    return map;
  });

  // Additional or manual override
  const [customExtraCost, setCustomExtraCost] = useState<number | ''>(() => {
    if (initialSelectedItems.length === 0 && currentManualCost !== '') {
      return Number(currentManualCost);
    }
    return '';
  });

  // Quick add new material state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<PackagingMaterial['category']>('box');
  const [newMatUnitCost, setNewMatUnitCost] = useState<number | ''>('');
  const [newMatStock, setNewMatStock] = useState<number | ''>(100);

  if (!isOpen) return null;

  const handleQtyChange = (materialId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[materialId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[materialId];
        return copy;
      }
      return { ...prev, [materialId]: next };
    });
  };

  const handleSetExactQty = (materialId: string, val: string) => {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    setQuantities((prev) => {
      if (num === 0) {
        const copy = { ...prev };
        delete copy[materialId];
        return copy;
      }
      return { ...prev, [materialId]: num };
    });
  };

  // Selected items calculation
  const selectedItems: SelectedPackagingItem[] = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([matId, qty]) => {
      const mat = materials.find((m) => m.id === matId);
      const unitCost = mat?.unitCost || 0;
      return {
        materialId: matId,
        materialName: mat?.name || 'Packaging Item',
        category: mat?.category,
        quantity: qty,
        unitCost,
        subtotalCost: unitCost * qty,
      };
    });

  const materialsSubtotalCost = selectedItems.reduce((sum, it) => sum + it.subtotalCost, 0);
  const totalCalculatedPackagingCost =
    materialsSubtotalCost + (customExtraCost !== '' ? Number(customExtraCost) : 0);

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatUnitCost || Number(newMatUnitCost) < 0) {
      alert('দয়া করে ম্যাটেরিয়াল এর নাম এবং সঠিক ইউনিট খরচ লিখুন');
      return;
    }

    const created: PackagingMaterial = {
      id: `mat-${Date.now()}`,
      name: newMatName.trim(),
      category: newMatCategory,
      unit: 'pcs',
      unitCost: Number(newMatUnitCost),
      stock: newMatStock !== '' ? Number(newMatStock) : 100,
      totalPurchasedQty: newMatStock !== '' ? Number(newMatStock) : 100,
      totalPurchaseCost: (newMatStock !== '' ? Number(newMatStock) : 100) * Number(newMatUnitCost),
      minStockAlert: 15,
      createdAt: new Date().toISOString(),
    };

    if (onQuickAddMaterial) {
      onQuickAddMaterial(created);
    }

    // Auto-select 1 qty of this new material
    setQuantities((prev) => ({ ...prev, [created.id]: 1 }));
    setNewMatName('');
    setNewMatUnitCost('');
    setShowQuickAdd(false);
  };

  const handleApply = () => {
    onApply(selectedItems, totalCalculatedPackagingCost);
    onClose();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'box':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'sticker':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'ribbon':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'tape':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'bag':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                প্যাকেজিং সরঞ্জাম ও খরচ নির্বাচন (Packaging Cost)
              </h3>
              <p className="text-[11px] text-neutral-500">
                অর্ডারে ব্যবহৃত বক্স, স্টিকার, রিবন বা টেপ নির্বাচন করুন; খরচ স্বয়ংক্রিয়ভাবে হিসাব হবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Quick preset notice */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-2">
            <div className="text-[11px] text-neutral-600">
              <span className="font-bold text-neutral-800">প্যাকেজিং নিয়ম: </span>
              এই খরচটি আপনার মোট প্রফিট থেকে বাদ যাবে, কিন্তু কাস্টমারের ইনভয়েসে দেখানো হবে না।
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAdd((prev) => !prev)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন ম্যাটেরিয়াল যোগ</span>
            </button>
          </div>

          {/* Quick Add Form Inline */}
          {showQuickAdd && (
            <form
              onSubmit={handleSaveQuickAdd}
              className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3"
            >
              <div className="font-bold text-amber-950 text-xs flex items-center justify-between">
                <span>+ নতুন প্যাকেজিং আইটেম যুক্ত করুন</span>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="text-amber-800 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                    ম্যাটেরিয়াল এর নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Pink Gift Box, Fragile Sticker"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={newMatCategory}
                    onChange={(e) =>
                      setNewMatCategory(e.target.value as PackagingMaterial['category'])
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                  >
                    <option value="box">Box (কার্টন / বক্স)</option>
                    <option value="sticker">Sticker (ব্র্যান্ড স্টিকার)</option>
                    <option value="ribbon">Ribbon (রিবন / ফিতা)</option>
                    <option value="tape">Tape (টেপ)</option>
                    <option value="bag">Delivery Bag (ব্যাগ)</option>
                    <option value="bubble_wrap">Bubble Wrap (বাবল র‍্যাপ)</option>
                    <option value="other">Other (অন্যান্য)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                    প্রতি পিস খরচ (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    placeholder="যেমন: 20"
                    value={newMatUnitCost}
                    onChange={(e) =>
                      setNewMatUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                    কেনা স্টক সংখ্যা (পিস)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={newMatStock}
                    onChange={(e) =>
                      setNewMatStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          )}

          {/* Materials List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-neutral-500 font-bold uppercase text-[10px] tracking-wider px-1">
              <span>উপলব্ধ প্যাকেজিং সরঞ্জাম ({materials.length} টি)</span>
              <span>ব্যবহারের সংখ্যা ও সাবটোটাল</span>
            </div>

            {materials.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500 space-y-2">
                <Box className="w-8 h-8 text-neutral-400 mx-auto" />
                <p className="font-semibold text-xs text-neutral-700">কোনো প্যাকেজিং ম্যাটেরিয়াল যোগ করা নেই</p>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  নতুন আইটেম যোগ করুন
                </button>
              </div>
            ) : (
              materials.map((mat) => {
                const qty = quantities[mat.id] || 0;
                const isSelected = qty > 0;
                const isLowStock = mat.stock <= (mat.minStockAlert || 10);

                return (
                  <div
                    key={mat.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-300 shadow-xs ring-1 ring-amber-300'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {/* Item Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                          {mat.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getCategoryBadge(
                            mat.category
                          )}`}
                        >
                          {mat.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
                        <span className="font-semibold text-neutral-700">
                          ইউনিট খরচ: <strong className="font-mono text-neutral-900">{formatCurrency(mat.unitCost)}</strong> / {mat.unit}
                        </span>
                        <span>·</span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isLowStock ? 'text-rose-600 font-bold' : 'text-neutral-500'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                          স্টক: {mat.stock} {mat.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Picker & Line Subtotal */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isSelected && (
                        <div className="text-right font-mono font-bold text-xs sm:text-sm text-amber-900">
                          {formatCurrency(mat.unitCost * qty)}
                        </div>
                      )}

                      <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(mat.id, -1)}
                          disabled={qty === 0}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => handleSetExactQty(mat.id, e.target.value)}
                          className="w-10 text-center text-xs font-mono font-bold border-x border-neutral-200 py-1 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleQtyChange(mat.id, 1)}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Optional manual extra or direct custom packaging cost */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between gap-3 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <div>
                <div className="font-bold text-xs text-neutral-800">
                  অতিরিক্ত বা ম্যানুয়াল প্যাকিং খরচ (Optional Extra / Custom)
                </div>
                <div className="text-[10px] text-neutral-500">
                  লিস্টের বাইরে অন্য কোনো অতিরিক্ত প্যাকিং খরচ থাকলে এখানে লিখুন
                </div>
              </div>

              <div className="relative w-28 shrink-0">
                <span className="absolute left-2.5 top-1.5 text-neutral-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customExtraCost === '' ? '' : customExtraCost}
                  onChange={(e) =>
                    setCustomExtraCost(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                  }
                  className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold border border-neutral-300 rounded-lg bg-white text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Total and Apply Button */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left w-full sm:w-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              মোট প্যাকিং খরচ (Total Packing Cost)
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-800">
              {formatCurrency(totalCalculatedPackagingCost)}
            </div>
            {selectedItems.length > 0 && (
              <div className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-xs">
                {selectedItems.map((it) => `${it.quantity}x ${it.materialName}`).join(', ')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Packaging ({formatCurrency(totalCalculatedPackagingCost)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
