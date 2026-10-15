import React, { useState } from 'react';
import { X, Plus, PackageCheck } from 'lucide-react';
import { ProductItem } from '../types';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: ProductItem) => void;
  defaultCategories: string[];
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  defaultCategories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategories[0] || 'Chocolates');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [suggestedPrice, setSuggestedPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [unit, setUnit] = useState('pcs');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter product name');
      return;
    }
    const cost = Number(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter valid cost price');
      return;
    }

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category: category.trim() || 'General',
      unitCost: cost,
      suggestedSellingPrice: Number(suggestedPrice) || Math.round(cost * 1.35),
      stock: Number(stock) || 0,
      reservedStock: 0,
      minStockAlert: 5,
      isActive: true,
      unit: unit.trim() || 'pcs',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onProductCreated(newProd);
    onClose();
    setName('');
    setUnitCost('');
    setSuggestedPrice('');
    setStock(10);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 text-sm">
              Add New Product to Inventory
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ferrero Rocher, Red Rose"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Chocolates"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="pcs, box, pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Cost Price (Cost ৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Selling Price (৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Initial Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              Save & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
