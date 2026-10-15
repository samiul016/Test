import React, { useState, useMemo } from 'react';
import {
  Box,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowUpDown,
  X,
  Sliders,
} from 'lucide-react';
import { PackagingMaterial, PackagingCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/accounting';

interface PackagingMaterialsTabProps {
  materials: PackagingMaterial[];
  onAddMaterial: (mat: PackagingMaterial) => void;
  onUpdateMaterial: (mat: PackagingMaterial) => void;
  onDeleteMaterial: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export const PackagingMaterialsTab: React.FC<PackagingMaterialsTabProps> = ({
  materials,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAdjustStock,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<PackagingMaterial | null>(null);

  // Stock Adjust Modal
  const [adjustingMaterial, setAdjustingMaterial] = useState<PackagingMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState<string>('নতুন কেনা হয়েছে');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackagingCategory>('box');
  const [unit, setUnit] = useState('pcs');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [totalPurchasedQty, setTotalPurchasedQty] = useState<number | ''>('');
  const [totalPurchaseCost, setTotalPurchaseCost] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(100);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(15);
  const [notes, setNotes] = useState('');

  // Auto-calculate unit cost if total cost and quantity are entered
  const handleQtyBlur = () => {
    if (totalPurchasedQty && totalPurchaseCost && (!unitCost || Number(unitCost) === 0)) {
      const calculated = Number(totalPurchaseCost) / Number(totalPurchasedQty);
      if (!isNaN(calculated) && isFinite(calculated)) {
        setUnitCost(parseFloat(calculated.toFixed(2)));
      }
    }
  };

  const handleCostBlur = () => {
    if (totalPurchasedQty && totalPurchaseCost) {
      const calculated = Number(totalPurchaseCost) / Number(totalPurchasedQty);
      if (!isNaN(calculated) && isFinite(calculated)) {
        setUnitCost(parseFloat(calculated.toFixed(2)));
      }
    }
  };

  const openAdd = () => {
    setEditingMaterial(null);
    setName('');
    setCategory('box');
    setUnit('pcs');
    setUnitCost('');
    setTotalPurchasedQty(100);
    setTotalPurchaseCost('');
    setStock(100);
    setMinStockAlert(15);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (mat: PackagingMaterial) => {
    setEditingMaterial(mat);
    setName(mat.name);
    setCategory(mat.category);
    setUnit(mat.unit || 'pcs');
    setUnitCost(mat.unitCost);
    setTotalPurchasedQty(mat.totalPurchasedQty || '');
    setTotalPurchaseCost(mat.totalPurchaseCost || '');
    setStock(mat.stock);
    setMinStockAlert(mat.minStockAlert || 15);
    setNotes(mat.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('দয়া করে প্যাকেজিং ম্যাটেরিয়াল এর নাম লিখুন।');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      alert('দয়া করে সঠিক ইউনিট খরচ লিখুন।');
      return;
    }

    const costNum = Number(unitCost);
    const stockNum = stock === '' ? 0 : Number(stock);
    const purchasedQtyNum = totalPurchasedQty === '' ? stockNum : Number(totalPurchasedQty);
    const totalCostNum =
      totalPurchaseCost === '' ? costNum * purchasedQtyNum : Number(totalPurchaseCost);

    if (editingMaterial) {
      const updated: PackagingMaterial = {
        ...editingMaterial,
        name: name.trim(),
        category,
        unit: unit.trim() || 'pcs',
        unitCost: costNum,
        stock: stockNum,
        totalPurchasedQty: purchasedQtyNum,
        totalPurchaseCost: totalCostNum,
        minStockAlert: minStockAlert === '' ? 10 : Number(minStockAlert),
        notes: notes.trim(),
      };
      onUpdateMaterial(updated);
    } else {
      const created: PackagingMaterial = {
        id: `mat-${Date.now()}`,
        name: name.trim(),
        category,
        unit: unit.trim() || 'pcs',
        unitCost: costNum,
        stock: stockNum,
        totalPurchasedQty: purchasedQtyNum,
        totalPurchaseCost: totalCostNum,
        minStockAlert: minStockAlert === '' ? 10 : Number(minStockAlert),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddMaterial(created);
    }

    setIsModalOpen(false);
  };

  const handleApplyStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingMaterial || adjustDelta === '' || adjustDelta === 0) return;
    onAdjustStock(adjustingMaterial.id, Number(adjustDelta));
    setAdjustingMaterial(null);
    setAdjustDelta('');
  };

  // Filtered materials
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [materials, search, selectedCategory]);

  // Overall KPIs
  const totalStockUnits = useMemo(
    () => materials.reduce((sum, m) => sum + (m.stock || 0), 0),
    [materials]
  );
  const totalStockValue = useMemo(
    () => materials.reduce((sum, m) => sum + (m.stock || 0) * (m.unitCost || 0), 0),
    [materials]
  );
  const lowStockCount = useMemo(
    () => materials.filter((m) => m.stock <= (m.minStockAlert || 15)).length,
    [materials]
  );

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
      case 'bubble_wrap':
        return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Total Material Items
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
            {materials.length} Items
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">বক্স, স্টিকার, রিবন, টেপ ইত্যাদি</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            Total Available Units
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {totalStockUnits} Pcs
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">ব্যবহারের জন্য স্টকে আছে</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Total Inventory Value
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {formatCurrency(totalStockValue)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">বর্তমান স্টকের মোট পাইকারি মূল্য</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            Low Stock Alerts
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount} Items
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {lowStockCount > 0 ? 'দ্রুত রি-অর্ডার করা প্রয়োজন' : 'পর্যাপ্ত স্টক রয়েছে'}
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search box, sticker, ribbon, tape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['all', 'box', 'sticker', 'ribbon', 'tape', 'bag', 'other'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] capitalize cursor-pointer transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat === 'all'
                  ? 'All'
                  : cat === 'box'
                  ? 'বক্স (Box)'
                  : cat === 'sticker'
                  ? 'স্টিকার'
                  : cat === 'ribbon'
                  ? 'রিবন'
                  : cat === 'tape'
                  ? 'টেপ'
                  : cat === 'bag'
                  ? 'ব্যাগ'
                  : 'অন্যান্য'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Packaging Material</span>
        </button>
      </div>

      {/* Materials List Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200 text-[10px]">
                <th className="p-3">Material Name & Category</th>
                <th className="p-3 text-right">Cost Per Unit (প্রতি পিস খরচ)</th>
                <th className="p-3 text-center">Current Stock</th>
                <th className="p-3 text-right">Stock Valuation</th>
                <th className="p-3 text-center">Batch Purchase Info</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-neutral-400">
                    <Box className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <div className="font-bold text-neutral-700 text-sm">
                      কোনো প্যাকেজিং ম্যাটেরিয়াল পাওয়া যায়নি
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      বক্স, স্টিকার, রিবন বা টেপ যুক্ত করতে উপরে <strong>&quot;+ Add Packaging Material&quot;</strong> বাটনে ক্লিক করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((mat) => {
                  const isLow = mat.stock <= (mat.minStockAlert || 15);
                  const lineValue = (mat.stock || 0) * (mat.unitCost || 0);

                  return (
                    <tr key={mat.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900 text-xs sm:text-sm">
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
                        {mat.notes && (
                          <div className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-xs">
                            {mat.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-neutral-900">
                        {formatCurrency(mat.unitCost)}
                        <span className="text-[10px] text-neutral-400 font-normal"> / {mat.unit}</span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                              isLow
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {mat.stock} {mat.unit}
                          </span>
                          {isLow && (
                            <span title="Low stock alert" className="text-rose-500">
                              <AlertTriangle className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-amber-800">
                        {formatCurrency(lineValue)}
                      </td>

                      <td className="p-3 text-center text-[11px] text-neutral-500">
                        {mat.totalPurchasedQty ? (
                          <span>
                            Batch: {mat.totalPurchasedQty} {mat.unit} (৳{mat.totalPurchaseCost || mat.totalPurchasedQty * mat.unitCost})
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingMaterial(mat);
                              setAdjustDelta('');
                            }}
                            className="p-1.5 text-neutral-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="Adjust Stock (+ / -)"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(mat)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Material"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${mat.name}"?`)) {
                                onDeleteMaterial(mat.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Material"
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

      {/* Add / Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                  {editingMaterial ? 'Edit Packaging Material' : 'Add New Packaging Material'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Delivery Box Medium, Thank You Sticker, Satin Ribbon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PackagingCategory)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="box">Box (কার্টন / ডেলিভারি বক্স)</option>
                    <option value="sticker">Sticker (ব্র্যান্ড লোগো স্টিকার)</option>
                    <option value="ribbon">Ribbon (সিল্ক / সাটিন রিবন)</option>
                    <option value="tape">Tape (প্যাকেজিং সেলোটেপ)</option>
                    <option value="bag">Delivery Bag (পলিব্যাগ / শপিং ব্যাগ)</option>
                    <option value="bubble_wrap">Bubble Wrap (বাবল র‍্যাপ)</option>
                    <option value="other">Other (অন্যান্য)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none"
                  >
                    <option value="pcs">Pieces (পিস / টি)</option>
                    <option value="roll">Roll (রোল)</option>
                    <option value="sheet">Sheet (পাতা / শিট)</option>
                    <option value="meter">Meter (মিটার)</option>
                  </select>
                </div>
              </div>

              {/* Purchase batch auto-calculator */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                  পাইকারি ক্রয়ের বিবরণ (Bulk Purchase & Cost Auto-Calculation)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                      মোট কেনা সংখ্যা ({unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      value={totalPurchasedQty}
                      onChange={(e) =>
                        setTotalPurchasedQty(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      onBlur={handleQtyBlur}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                      মোট কেনার খরচ (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 2000"
                      value={totalPurchaseCost}
                      onChange={(e) =>
                        setTotalPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      onBlur={handleCostBlur}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                      প্রতি পিস খরচ (৳) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      placeholder="e.g. 20"
                      value={unitCost}
                      onChange={(e) =>
                        setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Available Stock ({unit}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) =>
                      setMinStockAlert(e.target.value === '' ? 10 : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Notes / Supplier Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chawkbazar packaging supplier shop #4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {editingMaterial ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-sm">
                Adjust Stock: {adjustingMaterial.name}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingMaterial(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjust} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between items-center">
                <span className="text-neutral-600">Current Stock:</span>
                <span className="font-mono font-bold text-sm text-neutral-900">
                  {adjustingMaterial.stock} {adjustingMaterial.unit}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Quantity to Add (+) or Deduct (-) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. +50 or -5"
                  value={adjustDelta}
                  onChange={(e) =>
                    setAdjustDelta(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <div className="text-[10px] text-neutral-400 mt-1">
                  নতুন কিনলে পজিটিভ লিখুন (যেমন: 100), নষ্ট হলে বা কমলে মাইনাস লিখুন (যেমন: -5)
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. New stock purchased, Damaged in transit"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingMaterial(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustDelta === '' || adjustDelta === 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
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
