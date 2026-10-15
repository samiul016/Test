import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency } from '../utils/formatters';

export interface EditableFormRow {
  id: string;
  productId: string;
  quantity: number;
  isCustom?: boolean;
  customName?: string;
  customCostPrice?: number | '';
  customSellingPrice?: number | '';
  customUnit?: string;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: EditableFormRow | null;
  product?: ProductItem;
  onUpdate: (updatedRow: EditableFormRow) => void;
  onDelete: (rowId: string) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  row,
  product,
  onUpdate,
  onDelete,
}) => {
  const [qty, setQty] = useState<number>(1);
  const [customName, setCustomName] = useState('');
  const [customCostPrice, setCustomCostPrice] = useState<number | ''>('');
  const [customSellingPrice, setCustomSellingPrice] = useState<number | ''>('');
  const [customUnit, setCustomUnit] = useState('pcs');

  useEffect(() => {
    if (row && isOpen) {
      setQty(row.quantity);
      if (row.isCustom) {
        setCustomName(row.customName || '');
        setCustomCostPrice(row.customCostPrice ?? '');
        setCustomSellingPrice(row.customSellingPrice ?? '');
        setCustomUnit(row.customUnit || 'pcs');
      }
    }
  }, [row, isOpen]);

  if (!isOpen || !row) return null;

  const unitSellingPrice = row.isCustom
    ? Number(customSellingPrice) || 0
    : product
    ? product.suggestedSellingPrice || product.unitCost
    : 0;

  const itemUnit = row.isCustom ? customUnit || 'pcs' : product?.unit || 'pcs';
  const itemName = row.isCustom ? customName || 'Custom Item' : product?.name || 'Item';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (row.isCustom) {
      onUpdate({
        ...row,
        quantity: Math.max(1, qty),
        customName: customName.trim() || 'Custom Item',
        customCostPrice: customCostPrice === '' ? '' : Number(customCostPrice),
        customSellingPrice: customSellingPrice === '' ? '' : Number(customSellingPrice),
        customUnit: customUnit.trim() || 'pcs',
      });
    } else {
      onUpdate({
        ...row,
        quantity: Math.max(1, qty),
      });
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete(row.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            {row.isCustom ? (
              <Sparkles className="w-4 h-4 text-purple-600" />
            ) : (
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            )}
            <h2 className="text-base font-bold text-neutral-900">
              Edit {row.isCustom ? 'Custom Item' : 'Item'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Regular Product Info */}
          {!row.isCustom ? (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <div className="text-xs font-bold text-neutral-900">{itemName}</div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Unit Price:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(unitSellingPrice)} / {itemUnit}
                </span>
              </div>
            </div>
          ) : (
            /* Custom Product Inputs */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-purple-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

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
                    className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Selling Price ৳
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customSellingPrice}
                    onChange={(e) =>
                      setCustomSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-purple-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Unit</label>
                <input
                  type="text"
                  placeholder="pcs"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Quantity ({itemUnit})
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 text-sm font-bold cursor-pointer"
                  title="Decrease"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center text-sm font-mono font-bold py-2 border-x border-neutral-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 text-sm font-bold cursor-pointer"
                  title="Increase"
                >
                  +
                </button>
              </div>

              <div className="text-right flex-1">
                <span className="text-[11px] text-neutral-500">Subtotal:</span>{' '}
                <div className="font-mono font-bold text-base text-neutral-900">
                  {formatCurrency(unitSellingPrice * qty)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
