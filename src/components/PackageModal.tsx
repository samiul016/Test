import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  Sparkles,
  Check,
  AlertCircle,
  Truck,
  Box,
} from 'lucide-react';
import { ProductItem, SavedPackage, SavedPackageItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AddItemModal } from './AddItemModal';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  packageToEdit: SavedPackage | null;
  onSave: (savedPkg: SavedPackage) => void;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  products,
  packageToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<SavedPackageItem[]>([]);
  const [bundlePrice, setBundlePrice] = useState<number | ''>('');
  const [deliveryCharge, setDeliveryCharge] = useState<number | ''>('');
  const [packagingCharge, setPackagingCharge] = useState<number | ''>('');
  const [error, setError] = useState('');

  // Add Item modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemTab, setAddItemTab] = useState<'inventory' | 'custom'>('inventory');

  useEffect(() => {
    if (isOpen) {
      if (packageToEdit) {
        setName(packageToEdit.name);
        setDescription(packageToEdit.description || '');
        setItems(packageToEdit.items || []);
        setBundlePrice(packageToEdit.customSellingPrice ?? '');
        setDeliveryCharge(packageToEdit.defaultDeliveryCharge ?? '');
        setPackagingCharge(packageToEdit.defaultPackagingCharge ?? '');
      } else {
        setName('');
        setDescription('');
        setItems([]);
        setBundlePrice('');
        setDeliveryCharge('');
        setPackagingCharge('');
      }
      setError('');
    }
  }, [isOpen, packageToEdit]);

  // Calculations
  const totalCost = useMemo(() => {
    return items.reduce((sum, it) => {
      if (it.isCustom) {
        return sum + (Number(it.customCostPrice) || 0) * it.quantity;
      }
      const p = products.find((prod) => prod.id === it.productId);
      return sum + (p ? p.unitCost * it.quantity : 0);
    }, 0);
  }, [items, products]);

  const defaultTotalSell = useMemo(() => {
    return items.reduce((sum, it) => {
      if (it.isCustom) {
        return sum + (Number(it.customSellingPrice) || 0) * it.quantity;
      }
      const p = products.find((prod) => prod.id === it.productId);
      return sum + (p ? (p.suggestedSellingPrice || p.unitCost) * it.quantity : 0);
    }, 0);
  }, [items, products]);

  const effectiveSellingPrice = bundlePrice !== '' ? Number(bundlePrice) : defaultTotalSell;
  const estimatedProfit = effectiveSellingPrice - totalCost;

  if (!isOpen) return null;

  const handleAddInventory = (productId: string, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => !i.isCustom && i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          !i.isCustom && i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { id: `item-${Date.now()}-${Math.random()}`, productId, quantity }];
    });
  };

  const handleAddCustom = (custom: {
    name: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
  }) => {
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random()}`,
        productId: '',
        quantity: custom.quantity,
        isCustom: true,
        customName: custom.name,
        customCostPrice: custom.costPrice,
        customSellingPrice: custom.sellingPrice,
        customUnit: custom.unit,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a package name');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item to this package');
      return;
    }

    const saved: SavedPackage = {
      id: packageToEdit ? packageToEdit.id : `pkg-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      items,
      customSellingPrice: bundlePrice === '' ? '' : Number(bundlePrice),
      defaultDeliveryCharge: deliveryCharge === '' ? '' : Number(deliveryCharge),
      defaultPackagingCharge: packagingCharge === '' ? '' : Number(packagingCharge),
      createdAt: packageToEdit?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {packageToEdit ? 'Edit Package' : 'Create New Package'}
              </h2>
              <p className="text-xs text-neutral-500">
                Create ready-made package bundles for quick order selection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Package Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Birthday Special Box, Eid Mubarak Combo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Description / Notes <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Includes premium ribbon, custom note, greeting card"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Package Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Package Items
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAddItemTab('inventory');
                    setIsAddItemModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddItemTab('custom');
                    setIsAddItemModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="border border-neutral-200 rounded-xl bg-neutral-50/40 p-3 min-h-[120px] max-h-[220px] overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-7 text-neutral-400 text-xs">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  No items in this package yet. Click &quot;Add Product&quot; or &quot;Custom Item&quot; above.
                </div>
              ) : (
                items.map((it) => {
                  let itemName = '';
                  let itemUnit = 'pcs';
                  let itemCost = 0;
                  let itemSell = 0;

                  if (it.isCustom) {
                    itemName = it.customName || 'Custom Item';
                    itemUnit = it.customUnit || 'pcs';
                    itemCost = Number(it.customCostPrice) || 0;
                    itemSell = Number(it.customSellingPrice) || 0;
                  } else {
                    const prod = products.find((p) => p.id === it.productId);
                    itemName = prod ? prod.name : 'Unknown Product';
                    itemUnit = prod?.unit || 'pcs';
                    itemCost = prod?.unitCost || 0;
                    itemSell = prod?.suggestedSellingPrice || prod?.unitCost || 0;
                  }

                  return (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-neutral-200 rounded-xl text-xs shadow-2xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-800 truncate" title={itemName}>
                            {itemName}
                          </span>
                          {it.isCustom && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-700 rounded-md shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Cost: {formatCurrency(itemCost)} · Sell: {formatCurrency(itemSell)}
                        </div>
                      </div>

                      {/* Qty +/- and Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.id, -1)}
                            className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-200 text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-bold font-mono text-neutral-900 bg-white min-w-[32px] text-center border-x border-neutral-200">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.id, 1)}
                            className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-200 text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {itemUnit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer ml-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pricing & Fulfillment Defaults */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                Bundle Selling Price ৳
              </label>
              <input
                type="number"
                min="0"
                placeholder={`Auto (${formatCurrency(defaultTotalSell)})`}
                value={bundlePrice}
                onChange={(e) =>
                  setBundlePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Leave empty for item total sum
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                <Truck className="w-3 h-3 inline mr-1 text-blue-600" />
                Default D.Charge ৳
              </label>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={deliveryCharge}
                onChange={(e) =>
                  setDeliveryCharge(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                <Box className="w-3 h-3 inline mr-1 text-amber-600" />
                Default Packing ৳
              </label>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={packagingCharge}
                onChange={(e) =>
                  setPackagingCharge(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center justify-between p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs">
            <div className="text-purple-900">
              <span className="text-neutral-500">Total Items Cost: </span>
              <strong className="font-mono">{formatCurrency(totalCost)}</strong>
            </div>
            <div className="text-purple-900">
              <span className="text-neutral-500">Package Selling Price: </span>
              <strong className="font-mono text-purple-700 font-bold">
                {formatCurrency(effectiveSellingPrice)}
              </strong>
            </div>
            <div className="text-emerald-700 font-bold">
              <span>Est. Profit: </span>
              <strong className="font-mono">{formatCurrency(estimatedProfit)}</strong>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{packageToEdit ? 'Save Changes' : 'Create Package'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Embedded AddItemModal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        products={products}
        initialTab={addItemTab}
        onAddInventoryItem={handleAddInventory}
        onAddCustomItem={handleAddCustom}
      />
    </div>
  );
};
