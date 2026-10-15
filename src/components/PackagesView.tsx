import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Truck,
  Box,
} from 'lucide-react';
import { ProductItem, SavedPackage } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { PackageModal } from './PackageModal';

interface PackagesViewProps {
  packages: SavedPackage[];
  products: ProductItem[];
  onSavePackage: (pkg: SavedPackage) => void;
  onUpdatePackage?: (pkg: SavedPackage) => void;
  onDeletePackage: (pkgId: string) => void;
  onSelectPackageForOrder: (pkg: SavedPackage) => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  products,
  onSavePackage,
  onDeletePackage,
  onSelectPackageForOrder,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SavedPackage | null>(null);

  const filteredPackages = useMemo(() => {
    return packages.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [packages, search]);

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: SavedPackage) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleDuplicate = (pkg: SavedPackage) => {
    const duplicated: SavedPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      name: `${pkg.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    onSavePackage(duplicated);
  };

  const handleDelete = (pkg: SavedPackage) => {
    if (window.confirm(`Delete package "${pkg.name}"?`)) {
      onDeletePackage(pkg.id);
    }
  };

  // Helper to compute cost and sell for a package
  const getPackageStats = (pkg: SavedPackage) => {
    let totalCost = 0;
    let totalSell = 0;

    pkg.items.forEach((it) => {
      if (it.isCustom) {
        totalCost += (Number(it.customCostPrice) || 0) * it.quantity;
        totalSell += (Number(it.customSellingPrice) || 0) * it.quantity;
      } else {
        const prod = products.find((p) => p.id === it.productId);
        const cost = prod ? prod.unitCost : 0;
        const sell = prod ? (prod.suggestedSellingPrice || prod.unitCost) : 0;
        totalCost += cost * it.quantity;
        totalSell += sell * it.quantity;
      }
    });

    const finalSellingPrice =
      pkg.customSellingPrice !== undefined && pkg.customSellingPrice !== ''
        ? Number(pkg.customSellingPrice)
        : totalSell;

    const profit = finalSellingPrice - totalCost;
    const margin = finalSellingPrice > 0 ? (profit / finalSellingPrice) * 100 : 0;

    return { totalCost, finalSellingPrice, profit, margin };
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">Packages</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
              {packages.length} Ready Bundles
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Create ready-made package bundles with multiple items to quickly use inside New Orders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Package</span>
        </button>
      </div>

      {/* Quick Search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ready-made packages by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-800">No Packages Found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              {search
                ? `No packages match "${search}". Try clearing the search query.`
                : 'You have not created any ready-made packages yet. Click "Create Package" to assemble your first package!'}
            </p>
          </div>
          {!search && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Package</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => {
            const { totalCost, finalSellingPrice, profit, margin } = getPackageStats(pkg);

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-purple-100 transition-colors">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 line-clamp-1" title={pkg.name}>
                          {pkg.name}
                        </h3>
                        <span className="text-[11px] text-neutral-400">
                          {pkg.items.length} {pkg.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(pkg)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                        title="Duplicate Package"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-1.5 text-neutral-400 hover:text-purple-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Package"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pkg)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2">{pkg.description}</p>
                  )}

                  {/* Items Preview */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Package Items
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {pkg.items.map((it, idx) => {
                        let itName = '';
                        let itUnit = 'pcs';
                        if (it.isCustom) {
                          itName = it.customName || 'Custom Item';
                          itUnit = it.customUnit || 'pcs';
                        } else {
                          const prod = products.find((p) => p.id === it.productId);
                          itName = prod ? prod.name : 'Unknown Product';
                          itUnit = prod?.unit || 'pcs';
                        }

                        return (
                          <div
                            key={it.id || idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-700"
                          >
                            <span className="truncate pr-2 font-medium" title={itName}>
                              {itName}
                            </span>
                            <span className="font-mono font-bold text-neutral-800 shrink-0 text-[11px]">
                              {it.quantity} {itUnit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Fulfillment chips if any */}
                  {(Number(pkg.defaultDeliveryCharge) > 0 || Number(pkg.defaultPackagingCharge) > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {Number(pkg.defaultDeliveryCharge) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                          <Truck className="w-3 h-3" />
                          <span>D.Charge: {formatCurrency(Number(pkg.defaultDeliveryCharge))}</span>
                        </span>
                      )}
                      {Number(pkg.defaultPackagingCharge) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 rounded-md border border-amber-100">
                          <Box className="w-3 h-3" />
                          <span>Packing: {formatCurrency(Number(pkg.defaultPackagingCharge))}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Financials & 1-Click "Use in New Order" */}
                <div className="p-4 sm:p-5 bg-neutral-50/70 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Total Cost</span>
                      <strong className="font-mono text-neutral-700">{formatCurrency(totalCost)}</strong>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] text-neutral-400 block">Est. Profit</span>
                      <strong className="font-mono text-emerald-700">
                        {formatCurrency(profit)} ({formatPercent(margin)})
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400 block">Selling Price</span>
                      <strong className="font-mono text-sm text-neutral-900 font-bold">
                        {formatCurrency(finalSellingPrice)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPackageForOrder(pkg)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-white bg-neutral-900 hover:bg-emerald-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Use in New Order</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Creation / Editing Modal */}
      <PackageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPackage(null);
        }}
        products={products}
        packageToEdit={editingPackage}
        onSave={onSavePackage}
      />
    </div>
  );
};
