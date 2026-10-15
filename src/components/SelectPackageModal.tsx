import React, { useState } from 'react';
import { X, Package, Check, Search, Truck, Box, Sparkles, RotateCcw } from 'lucide-react';
import { SavedPackage, ProductItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SelectPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: SavedPackage[];
  products: ProductItem[];
  currentPackageId?: string | null;
  onSelectPackage: (pkg: SavedPackage) => void;
  onSelectCustom: () => void;
}

export const SelectPackageModal: React.FC<SelectPackageModalProps> = ({
  isOpen,
  onClose,
  packages,
  products,
  currentPackageId = null,
  onSelectPackage,
  onSelectCustom,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getPackageStats = (pkg: SavedPackage) => {
    let totalSell = 0;
    pkg.items.forEach((it) => {
      if (it.isCustom) {
        totalSell += (Number(it.customSellingPrice) || 0) * it.quantity;
      } else {
        const prod = products.find((p) => p.id === it.productId);
        const sell = prod ? (prod.suggestedSellingPrice || prod.unitCost) : 0;
        totalSell += sell * it.quantity;
      }
    });

    const finalSellingPrice =
      pkg.customSellingPrice !== undefined && pkg.customSellingPrice !== ''
        ? Number(pkg.customSellingPrice)
        : totalSell;

    return { finalSellingPrice };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Select Ready Package</h2>
              <p className="text-xs text-neutral-500">
                Choose a pre-made package bundle or switch to Custom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-neutral-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ready packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Package list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-neutral-400 text-xs">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No ready packages matched your search.
            </div>
          ) : (
            filtered.map((pkg) => {
              const { finalSellingPrice } = getPackageStats(pkg);
              const isCurrent = currentPackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => {
                    onSelectPackage(pkg);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30 shadow-xs'
                      : 'bg-neutral-50/60 hover:bg-purple-50/40 border-neutral-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900 group-hover:text-purple-900 transition-colors">
                        {pkg.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {pkg.description && (
                      <p className="text-[11px] text-neutral-500 line-clamp-1">{pkg.description}</p>
                    )}

                    {/* Preview first items */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {pkg.items.slice(0, 4).map((it, idx) => {
                        let itName = '';
                        if (it.isCustom) {
                          itName = it.customName || 'Custom';
                        } else {
                          const prod = products.find((p) => p.id === it.productId);
                          itName = prod ? prod.name : 'Item';
                        }
                        return (
                          <span
                            key={idx}
                            className="inline-block text-[10px] px-1.5 py-0.5 bg-white border border-neutral-200 text-neutral-600 rounded-md font-medium truncate max-w-[140px]"
                          >
                            {it.quantity}x {itName}
                          </span>
                        );
                      })}
                      {pkg.items.length > 4 && (
                        <span className="text-[10px] text-neutral-400 font-bold">
                          & more
                        </span>
                      )}
                    </div>

                    {/* Delivery / packing presets */}
                    {(Number(pkg.defaultDeliveryCharge) > 0 || Number(pkg.defaultPackagingCharge) > 0) && (
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 pt-0.5">
                        {Number(pkg.defaultDeliveryCharge) > 0 && (
                          <span className="inline-flex items-center gap-1 text-blue-700">
                            <Truck className="w-3 h-3" /> D.Charge: {formatCurrency(Number(pkg.defaultDeliveryCharge))}
                          </span>
                        )}
                        {Number(pkg.defaultPackagingCharge) > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <Box className="w-3 h-3" /> Packing: {formatCurrency(Number(pkg.defaultPackagingCharge))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200">
                    <div className="font-mono font-bold text-sm text-purple-700">
                      {formatCurrency(finalSellingPrice)}
                    </div>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-2xs pointer-events-none ${
                        isCurrent
                          ? 'bg-purple-800 text-white'
                          : 'text-white bg-purple-600 group-hover:bg-purple-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Applied' : 'Apply'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Custom Option at bottom (Requested: nice ekta custom option thakbe, seita select korle sob empty hoye jabe) */}
          <div className="pt-3 border-t border-neutral-200/80">
            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Or Custom / Blank Order</span>
              {!currentPackageId && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Currently Active (Default)
                </span>
              )}
            </div>

            <div
              onClick={() => {
                onSelectCustom();
                onClose();
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !currentPackageId
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white hover:bg-emerald-50/50 border-neutral-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    !currentPackageId
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900 group-hover:text-emerald-900 transition-colors">
                      Custom Order (Default)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                      Empty / Blank
                    </span>
                    {!currentPackageId && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 line-clamp-1">
                    Clear loaded package items, reset charges, and start with an empty order
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                    !currentPackageId
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-neutral-100 group-hover:bg-emerald-600 text-neutral-700 group-hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{!currentPackageId ? 'Active (Custom)' : 'Select Custom (Reset)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between text-xs text-neutral-500">
          <span>Ready Packages + Custom Order</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
