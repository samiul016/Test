import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, X, Plus } from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  initialTab?: 'inventory' | 'custom';
  onAddInventoryItem: (productId: string, quantity: number) => void;
  onAddCustomItem: (customItem: {
    name: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
  }) => void;
  onOpenQuickAddProduct?: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  products,
  initialTab = 'inventory',
  onAddInventoryItem,
  onAddCustomItem,
  onOpenQuickAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'custom'>('inventory');

  // Inventory item state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inventoryQty, setInventoryQty] = useState<number>(1);

  // Custom item state
  const [customName, setCustomName] = useState('');
  const [customCostPrice, setCustomCostPrice] = useState<number | ''>('');
  const [customSellingPrice, setCustomSellingPrice] = useState<number | ''>('');
  const [customUnit, setCustomUnit] = useState('pcs');
  const [customQty, setCustomQty] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
      }
      setInventoryQty(1);
      setCustomName('');
      setCustomCostPrice('');
      setCustomSellingPrice('');
      setCustomUnit('pcs');
      setCustomQty(1);
      setErrorMessage('');
    }
  }, [isOpen, initialTab, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const unitSellingPrice = selectedProduct
    ? (selectedProduct.suggestedSellingPrice || selectedProduct.unitCost)
    : 0;

  const handleSelectProductChange = (prodId: string) => {
    if (prodId === '__NEW__') {
      onClose();
      if (onOpenQuickAddProduct) onOpenQuickAddProduct();
      return;
    }
    setSelectedProductId(prodId);
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId && products.length > 0) {
      onAddInventoryItem(products[0].id, Math.max(1, inventoryQty));
      onClose();
      return;
    }
    if (!selectedProductId) {
      setErrorMessage('Please select a product');
      return;
    }
    onAddInventoryItem(selectedProductId, Math.max(1, inventoryQty));
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setErrorMessage('Please enter item name');
      return;
    }
    const sellPrice = Number(customSellingPrice) || 0;
    const costPrice = Number(customCostPrice) || 0;

    onAddCustomItem({
      name: customName.trim(),
      costPrice,
      sellingPrice: sellPrice,
      quantity: Math.max(1, customQty),
      unit: customUnit.trim() || 'pcs',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">Add Item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Inventory Item vs Custom Item */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inventory');
              setErrorMessage('');
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Inventory Item</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('custom');
              setErrorMessage('');
            }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'custom'
                ? 'border-purple-600 text-purple-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Item</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Inventory Item */}
        {activeTab === 'inventory' ? (
          <form onSubmit={handleAddInventory} className="p-5 space-y-4">
            {/* Product Select */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Item Name <span className="text-rose-500">*</span>
              </label>
              {products.length === 0 ? (
                <div className="text-xs text-neutral-500 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  No products in inventory yet.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenQuickAddProduct) onOpenQuickAddProduct();
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    + Add New Product
                  </button>
                </div>
              ) : (
                <select
                  value={selectedProductId || (products[0] ? products[0].id : '')}
                  onChange={(e) => handleSelectProductChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__NEW__" className="font-bold text-emerald-700">
                    + Add New Product to Inventory...
                  </option>
                </select>
              )}
            </div>

            {/* Item Details Preview */}
            {selectedProduct && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500">Unit:</span>{' '}
                  <span className="font-bold text-neutral-800 uppercase">
                    {selectedProduct.unit || 'pcs'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Selling Price:</span>{' '}
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(unitSellingPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setInventoryQty((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-100 text-sm font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={inventoryQty}
                    onChange={(e) => setInventoryQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center text-xs font-mono font-bold py-2 border-x border-neutral-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setInventoryQty((q) => q + 1)}
                    className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-100 text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex-1">
                  <span className="text-[11px] text-neutral-500">Subtotal:</span>{' '}
                  <span className="font-mono font-bold text-sm text-neutral-900">
                    {formatCurrency(unitSellingPrice * inventoryQty)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={products.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Custom Item */
          <form onSubmit={handleAddCustom} className="p-5 space-y-4">
            {/* Custom Item Name */}
            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1.5">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Special Coffee Mug, Gift Box"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-purple-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>

            {/* Wholesale/Cost & Selling Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Wholesale Cost ৳
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customCostPrice}
                  onChange={(e) =>
                    setCustomCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-neutral-400">Used for backend profit</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Selling Price ৳ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={customSellingPrice}
                  onChange={(e) =>
                    setCustomSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-purple-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-neutral-400">Customer price</span>
              </div>
            </div>

            {/* Unit & Quantity */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Unit</label>
                <input
                  type="text"
                  placeholder="pcs"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Quantity</label>
                <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center text-xs font-mono font-bold py-2 border-x border-neutral-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Subtotal Preview */}
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
              <span className="text-purple-900 font-medium">Selling Subtotal:</span>
              <span className="font-mono font-bold text-purple-900 text-sm">
                {formatCurrency((Number(customSellingPrice) || 0) * customQty)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 active:bg-purple-900 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Custom Item</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
