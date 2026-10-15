import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  AlertCircle,
  User,
  ShoppingBag,
  Package,
  Edit2,
  Truck,
  Box,
  Tag,
  Sparkles,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  ProductItem,
  Order,
  PackageOrderItem,
  AppSettings,
  SavedPackage,
  PackagingMaterial,
  SelectedPackagingItem,
} from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { QuickAddProductModal } from './QuickAddProductModal';
import { AddItemModal } from './AddItemModal';
import { EditItemModal } from './EditItemModal';
import { SelectPackageModal } from './SelectPackageModal';
import { PackagingMaterialsModal } from './PackagingMaterialsModal';

interface OrderFormViewProps {
  products: ProductItem[];
  settings: AppSettings;
  packages?: SavedPackage[];
  initialPackage?: SavedPackage | null;
  packagingMaterials?: PackagingMaterial[];
  onSaveOrder: (newOrder: Order, shouldDeductStock: boolean) => void;
  onAddNewProduct: (newProduct: ProductItem) => void;
  onQuickAddPackagingMaterial?: (newMaterial: PackagingMaterial) => void;
  onCancel: () => void;
}

interface FormRow {
  id: string;
  productId: string;
  quantity: number;
  isCustom?: boolean;
  customName?: string;
  customCostPrice?: number | '';
  customSellingPrice?: number | '';
  customUnit?: string;
}

export const OrderFormView: React.FC<OrderFormViewProps> = ({
  products,
  settings,
  packages = [],
  initialPackage = null,
  packagingMaterials = [],
  onSaveOrder,
  onAddNewProduct,
  onQuickAddPackagingMaterial,
  onCancel,
}) => {
  // Selected package tracking (null means Custom default)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialPackage ? initialPackage.id : null
  );

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  // Default is Custom (empty package title) unless initialPackage was passed
  const [packageTitle, setPackageTitle] = useState(initialPackage ? initialPackage.name : '');

  // Rows of items - Default is Custom with empty list
  const [rows, setRows] = useState<FormRow[]>(() => {
    if (initialPackage && initialPackage.items.length > 0) {
      return initialPackage.items.map((it) => ({
        id: `row-${Date.now()}-${Math.random()}`,
        productId: it.productId,
        quantity: it.quantity,
        isCustom: it.isCustom,
        customName: it.customName,
        customCostPrice: it.customCostPrice,
        customSellingPrice: it.customSellingPrice,
        customUnit: it.customUnit,
      }));
    }
    return [];
  });

  // Package picker modal
  const [isPackagePickerOpen, setIsPackagePickerOpen] = useState(false);

  // Packaging Materials Breakdown modal
  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false);
  const [selectedPackagingItems, setSelectedPackagingItems] = useState<SelectedPackagingItem[]>([]);

  // Cost, Fulfillment & Discount - Start at 0 per user instruction (not added by default)
  const [deliveryCost, setDeliveryCost] = useState<number | ''>(0);
  const [packagingCost, setPackagingCost] = useState<number | ''>(0);
  const [discount, setDiscount] = useState<number | ''>(0);
  const [showDeliveryInput, setShowDeliveryInput] = useState(false);
  const [showPackagingInput, setShowPackagingInput] = useState(false);
  const [tempDeliveryCost, setTempDeliveryCost] = useState<string>('');
  const [tempPackagingCost, setTempPackagingCost] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Add Item Modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemModalTab, setAddItemModalTab] = useState<'inventory' | 'custom'>('inventory');

  // Edit Item Modal state
  const [editingRow, setEditingRow] = useState<FormRow | null>(null);

  // Quick Add state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const handleOpenAddInventory = () => {
    setAddItemModalTab('inventory');
    setIsAddItemModalOpen(true);
  };

  const handleOpenAddCustom = () => {
    setAddItemModalTab('custom');
    setIsAddItemModalOpen(true);
  };

  const handleAddInventoryItem = (productId: string, quantity: number) => {
    setRows((prev) => {
      const existing = prev.find((r) => !r.isCustom && r.productId === productId);
      if (existing) {
        return prev.map((r) =>
          !r.isCustom && r.productId === productId
            ? { ...r, quantity: r.quantity + quantity }
            : r
        );
      }
      return [...prev, { id: `row-${Date.now()}`, productId, quantity }];
    });
  };

  const handleAddCustomItem = (item: {
    name: string;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
  }) => {
    setRows((prev) => [
      ...prev,
      {
        id: `custom-row-${Date.now()}`,
        productId: '',
        quantity: item.quantity,
        isCustom: true,
        customName: item.name,
        customCostPrice: item.costPrice,
        customSellingPrice: item.sellingPrice,
        customUnit: item.unit,
      },
    ]);
  };

  // Apply a selected package
  const handleApplyPackage = (pkg: SavedPackage) => {
    setSelectedPackageId(pkg.id);
    setPackageTitle(pkg.name);
    const newRows: FormRow[] = pkg.items.map((it, idx) => ({
      id: `row-${Date.now()}-${idx}-${Math.random()}`,
      productId: it.productId,
      quantity: it.quantity,
      isCustom: it.isCustom,
      customName: it.customName,
      customCostPrice: it.customCostPrice,
      customSellingPrice: it.customSellingPrice,
      customUnit: it.customUnit,
    }));
    setRows(newRows);

    if (pkg.defaultDeliveryCharge !== undefined && pkg.defaultDeliveryCharge !== '') {
      setDeliveryCost(Number(pkg.defaultDeliveryCharge));
      setTempDeliveryCost(String(pkg.defaultDeliveryCharge));
    }
    if (pkg.defaultPackagingCharge !== undefined && pkg.defaultPackagingCharge !== '') {
      setPackagingCost(Number(pkg.defaultPackagingCharge));
      setTempPackagingCost(String(pkg.defaultPackagingCharge));
    }
  };

  // Reset back to Custom (Default empty order) - requested by user
  const handleResetToCustom = () => {
    setSelectedPackageId(null);
    setPackageTitle('');
    setRows([]);
    setDeliveryCost(0);
    setPackagingCost(0);
    setTempDeliveryCost('');
    setTempPackagingCost('');
    setShowDeliveryInput(false);
    setShowPackagingInput(false);
  };

  useEffect(() => {
    if (initialPackage) {
      handleApplyPackage(initialPackage);
    }
  }, [initialPackage]);

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (updatedRow: FormRow) => {
    setRows((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
  };

  const handleQtyChange = (rowId: string, qty: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, quantity: Math.max(1, qty) } : r))
    );
  };

  // Calculations
  const totalProductCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (r.isCustom) {
        return sum + (Number(r.customCostPrice) || 0) * r.quantity;
      }
      const prod = products.find((p) => p.id === r.productId);
      const unitCost = prod ? prod.unitCost : 0;
      return sum + unitCost * r.quantity;
    }, 0);
  }, [rows, products]);

  const totalItemsSellingPrice = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (r.isCustom) {
        return sum + (Number(r.customSellingPrice) || 0) * r.quantity;
      }
      const prod = products.find((p) => p.id === r.productId);
      const price = prod ? (prod.suggestedSellingPrice || prod.unitCost) : 0;
      return sum + price * r.quantity;
    }, 0);
  }, [rows, products]);

  const numDelivery = Number(deliveryCost) || 0;
  const numPackaging = Number(packagingCost) || 0;
  const numDiscount = Number(discount) || 0;

  // Auto-calculated Total Customer Selling Price (Items + Delivery - Discount)
  const totalSellingPrice = Math.max(0, totalItemsSellingPrice + numDelivery - numDiscount);

  // Backend Total Cost (Products Purchase Cost + Delivery Charge + Packing Cost)
  const totalCost = totalProductCost + numDelivery + numPackaging;

  // Net Profit = Total Price (520) - Product Cost (190) - Delivery Charge (120) - Packing Cost (50) = 160
  const netProfit = totalSellingPrice - totalCost;
  const profitMargin =
    totalItemsSellingPrice - numDiscount > 0
      ? (netProfit / (totalItemsSellingPrice - numDiscount)) * 100
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter customer name');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Please enter phone number');
      return;
    }
    if (rows.length === 0) {
      setFormError('Please add at least 1 item to the package');
      return;
    }
    if (totalSellingPrice <= 0 && rows.length > 0) {
      setFormError('Total selling price must be greater than 0');
      return;
    }

    const orderItems: PackageOrderItem[] = rows.map((r) => {
      if (r.isCustom) {
        const cost = Number(r.customCostPrice) || 0;
        const sell = Number(r.customSellingPrice) || 0;
        return {
          productId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productName: r.customName?.trim() || 'Custom Item',
          quantity: r.quantity,
          unitCost: cost,
          subtotalCost: cost * r.quantity,
          suggestedPrice: sell,
        };
      }
      const prod = products.find((p) => p.id === r.productId);
      const unitCost = prod ? prod.unitCost : 0;
      const unitSelling = prod ? (prod.suggestedSellingPrice || prod.unitCost) : 0;
      return {
        productId: r.productId,
        productName: prod ? prod.name : 'Item',
        quantity: r.quantity,
        unitCost,
        subtotalCost: unitCost * r.quantity,
        suggestedPrice: unitSelling,
      };
    });

    const subtotalVal = orderItems.reduce(
      (sum, it) => sum + (it.suggestedPrice || it.unitCost) * it.quantity,
      0
    );
    const totalAmountVal = Math.max(0, subtotalVal - numDiscount + numDelivery);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || 'Dhaka, Bangladesh',
      packageTitle: packageTitle.trim() || 'Custom Package',
      items: orderItems,
      subtotal: subtotalVal,
      orderDiscount: numDiscount,
      deliveryFeeCharged: numDelivery,
      packagingCost: numPackaging,
      stickerCost: 0,
      courierCost: numDelivery,
      otherOrderExpenses: 0,
      totalAmount: totalAmountVal,
      paidAmount: 0,
      dueAmount: totalAmountVal,
      totalProductCost,
      totalDirectCosts: numPackaging,
      grossProfit: Math.max(0, subtotalVal - numDiscount - totalProductCost),
      contributionProfit: netProfit,
      netProfit,
      profitMargin,
      packagingItems: selectedPackagingItems.length > 0 ? selectedPackagingItems : undefined,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'Cash on Delivery',
      isStockDeducted: true,
      orderDate: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveOrder(newOrder, true);
  };

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Order Entry</h1>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Customer Details */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
            <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Customer Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-[11px] font-bold text-neutral-700">
                    Package Name / Occasion
                  </label>
                  {selectedPackageId ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                      <Package className="w-3 h-3 text-purple-600" />
                      <span>Package Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Custom (Default)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Undo / Reset to Custom button when package is selected */}
                  {selectedPackageId && (
                    <button
                      type="button"
                      onClick={handleResetToCustom}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                      title="Undo package selection: clear items and reset to Custom"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-600" />
                      <span>Undo / Reset Custom</span>
                    </button>
                  )}

                  {packages && packages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPackagePickerOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                      title="Load items from a saved package"
                    >
                      <Package className="w-3.5 h-3.5 text-purple-600" />
                      <span>Select Package</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Birthday Gift Combo (or leave empty for Custom)"
                  value={packageTitle}
                  onChange={(e) => setPackageTitle(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {packageTitle && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPackageId) {
                        handleResetToCustom();
                      } else {
                        setPackageTitle('');
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                    title={selectedPackageId ? "Undo package & clear" : "Clear title"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Items */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>2. Items</span>
                {selectedPackageId ? (
                  <span className="text-[10px] lowercase font-normal px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    from package
                  </span>
                ) : (
                  <span className="text-[10px] lowercase font-normal px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    custom
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Undo / Reset to Custom in items header if package is selected */}
                {selectedPackageId && (
                  <button
                    type="button"
                    onClick={handleResetToCustom}
                    className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Undo package: clear items & reset to Custom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {/* Select Package button */}
                {packages && packages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsPackagePickerOpen(true)}
                    className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                    title="Select Ready Package"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                )}

                {/* Add Item from Inventory */}
                <button
                  type="button"
                  onClick={handleOpenAddInventory}
                  className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  title="Add Item"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Custom Item */}
                <button
                  type="button"
                  onClick={handleOpenAddCustom}
                  className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                  title="Add Custom Item"
                >
                  <Sparkles className="w-4 h-4" />
                </button>


                {/* Delivery */}
                <button
                  type="button"
                  onClick={() => {
                    const willOpen = !showDeliveryInput;
                    setShowDeliveryInput(willOpen);
                    if (willOpen) {
                      setTempDeliveryCost(
                        Number(deliveryCost) > 0
                          ? String(deliveryCost)
                          : settings.defaultDeliveryCharge
                          ? String(settings.defaultDeliveryCharge)
                          : '120'
                      );
                    }
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    Number(deliveryCost) > 0
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : showDeliveryInput
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                  title={`D.Charge (${Number(deliveryCost) > 0 ? formatCurrency(Number(deliveryCost)) : 'Add'})`}
                >
                  <Truck className="w-4 h-4" />
                </button>

                {/* Packaging Materials Selection Button */}
                <button
                  type="button"
                  onClick={() => setIsPackagingModalOpen(true)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                    Number(packagingCost) > 0
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : isPackagingModalOpen
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                  title={`প্যাকেজিং সরঞ্জাম ও খরচ (${Number(packagingCost) > 0 ? formatCurrency(Number(packagingCost)) : 'Select Materials'})`}
                >
                  <Box className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline popup / input for Delivery */}
            {showDeliveryInput && (
              <div className="flex items-center gap-2 p-2 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold shrink-0">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>D.Charge:</span>
                </div>
                <div className="relative flex-1 min-w-[110px] max-w-[190px]">
                  <span className="absolute left-2.5 top-1.5 text-neutral-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={tempDeliveryCost}
                    onChange={(e) => setTempDeliveryCost(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryCost(tempDeliveryCost === '' ? 0 : Number(tempDeliveryCost));
                    setShowDeliveryInput(false);
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors shrink-0"
                  title="Save D.Charge"
                >
                  <Check className="w-4 h-4" />
                </button>
                {Number(deliveryCost) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryCost(0);
                      setTempDeliveryCost('');
                      setShowDeliveryInput(false);
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors shrink-0"
                    title="Remove D.Charge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDeliveryInput(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer ml-auto"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Inline popup / input for Packaging */}
            {showPackagingInput && (
              <div className="flex items-center gap-2 p-2 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold shrink-0">
                  <Box className="w-3.5 h-3.5 text-amber-600" />
                  <span>Packing:</span>
                </div>
                <div className="relative flex-1 min-w-[110px] max-w-[190px]">
                  <span className="absolute left-2.5 top-1.5 text-neutral-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={tempPackagingCost}
                    onChange={(e) => setTempPackagingCost(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPackagingCost(tempPackagingCost === '' ? 0 : Number(tempPackagingCost));
                    setShowPackagingInput(false);
                  }}
                  className="p-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg cursor-pointer transition-colors shrink-0"
                  title="Save Packing"
                >
                  <Check className="w-4 h-4" />
                </button>
                {Number(packagingCost) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPackagingCost(0);
                      setTempPackagingCost('');
                      setShowPackagingInput(false);
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors shrink-0"
                    title="Remove Packing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPackagingInput(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer ml-auto"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Items List - Ultra clean, showing item name, unit and price only */}
            <div className="space-y-2">
              {rows.length === 0 ? (
                <div className="text-center py-6 px-4 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                  <p className="text-xs text-neutral-500 font-medium">No items added to this package yet</p>
                  <button
                    type="button"
                    onClick={handleOpenAddInventory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              ) : (
                rows.map((row) => {
                  let itemName = '';
                  let itemUnit = 'pcs';
                  let itemSellingPrice = 0;

                  if (row.isCustom) {
                    itemName = row.customName || 'Custom Item';
                    itemUnit = row.customUnit || 'pcs';
                    itemSellingPrice = Number(row.customSellingPrice) || 0;
                  } else {
                    const prod = products.find((p) => p.id === row.productId);
                    itemName = prod ? prod.name : 'Unknown Item';
                    itemUnit = prod?.unit || 'pcs';
                    itemSellingPrice = prod ? (prod.suggestedSellingPrice || prod.unitCost) : 0;
                  }

                  const subSelling = itemSellingPrice * row.quantity;

                  return (
                    <div
                      key={row.id}
                      onClick={() => setEditingRow(row)}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all cursor-pointer group hover:border-emerald-300"
                      title="Click to edit quantity or details"
                    >
                      {/* Item Name */}
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-bold text-neutral-800 truncate group-hover:text-emerald-800 transition-colors"
                            title={itemName}
                          >
                            {itemName}
                          </span>
                          {row.isCustom && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unit / Qty + Price + Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Unit / Qty - Only show pcs / quantity without + - buttons */}
                        <span className="text-xs font-semibold text-neutral-700 px-2 py-0.5 bg-white border border-neutral-200 group-hover:border-emerald-300 rounded-md whitespace-nowrap shadow-2xs transition-colors">
                          {row.quantity} {itemUnit}
                        </span>

                        {/* Price */}
                        <div
                          className="min-w-14 text-right font-mono font-bold text-xs text-neutral-900"
                          title="Selling Price"
                        >
                          {formatCurrency(subSelling)}
                        </div>

                        {/* Edit quantity / details */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRow(row);
                          }}
                          className="text-neutral-400 hover:text-emerald-700 p-1 cursor-pointer transition-colors"
                          title="Click to edit quantity (+ / -)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRow(row.id);
                          }}
                          className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
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

            {/* Active fulfillment tags */}
            {(Number(deliveryCost) > 0 || Number(packagingCost) > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {Number(deliveryCost) > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>D.Charge: {formatCurrency(Number(deliveryCost))}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryCost(0);
                        setTempDeliveryCost('');
                      }}
                      className="ml-1 text-blue-400 hover:text-rose-600 cursor-pointer"
                      title="Remove D.Charge"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {Number(packagingCost) > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    <Box className="w-3.5 h-3.5 text-amber-600" />
                    <span>Packing: {formatCurrency(Number(packagingCost))}</span>
                    {selectedPackagingItems.length > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded font-normal">
                        {selectedPackagingItems
                          .map((it) => `${it.quantity}x ${it.materialName.split('(')[0].trim()}`)
                          .join(', ')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsPackagingModalOpen(true)}
                      className="ml-1 text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                      title="Edit selected materials"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackagingCost(0);
                        setSelectedPackagingItems([]);
                      }}
                      className="ml-1 text-amber-400 hover:text-rose-600 cursor-pointer"
                      title="Remove Packing"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Total Selling Price line */}
            <div className="pt-2 flex justify-between items-center text-xs text-neutral-600 border-t border-neutral-100">
              <span className="font-bold text-neutral-700">Total Selling Price:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">
                {formatCurrency(totalItemsSellingPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Cost & Profit */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs sticky top-6 space-y-4">
            <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider border-b border-neutral-100 pb-2">
              Cost & Profit
            </div>

            {/* Customer Bill Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider pb-1.5 border-b border-emerald-200/60">
                Customer Bill
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-700">
                  <span>Items Selling Price:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {formatCurrency(totalItemsSellingPrice)}
                  </span>
                </div>

                {numDelivery > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span className="flex items-center gap-1 text-blue-700">
                      <Truck className="w-3.5 h-3.5" /> D.Charge:
                    </span>
                    <span className="font-mono font-semibold text-neutral-900">
                      +{formatCurrency(numDelivery)}
                    </span>
                  </div>
                )}

                {/* Discount */}
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-emerald-200/60">
                  <span className="text-neutral-700 font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Discount:</span>
                  </span>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1 text-neutral-400 font-bold text-xs">৳</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={discount === '' ? '' : discount}
                      onChange={(e) =>
                        setDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                      }
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold border border-emerald-300 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 text-rose-600"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-emerald-200 pt-2.5 flex justify-between items-baseline">
                <div className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Total Price
                </div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  {formatCurrency(totalSellingPrice)}
                </div>
              </div>
            </div>

            {/* Backend Cost Breakdown */}
            <div className="bg-neutral-50 rounded-xl p-3.5 space-y-2 text-xs border border-neutral-200/80">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Backend Cost & Profit
              </div>

              {/* Total Price (520) */}
              <div className="flex justify-between text-neutral-800 font-semibold pb-1.5 border-b border-neutral-200/70">
                <span>Total Price:</span>
                <span className="font-bold font-mono text-neutral-900">
                  {formatCurrency(totalSellingPrice)}
                </span>
              </div>

              {/* Products Purchase Cost (minus hobe) */}
              <div className="flex justify-between text-neutral-600">
                <span>Products Purchase Cost:</span>
                <span className="font-semibold text-rose-600 font-mono">
                  -{formatCurrency(totalProductCost)}
                </span>
              </div>

              {/* Delivery Charge (minus hobe) */}
              {numDelivery > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" /> Delivery Charge:
                  </span>
                  <span className="font-semibold text-rose-600 font-mono">
                    -{formatCurrency(numDelivery)}
                  </span>
                </div>
              )}

              {/* Packing Cost (minus hobe) */}
              {numPackaging > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1 text-amber-900">
                    <Box className="w-3.5 h-3.5 text-amber-600" /> Packing Cost:
                  </span>
                  <span className="font-semibold text-rose-600 font-mono">
                    -{formatCurrency(numPackaging)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-neutral-200 pt-2 text-neutral-900 font-bold text-sm">
                <span>Total Cost:</span>
                <span className="font-mono text-neutral-900">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>

            {/* Big Net Profit Display */}
            <div
              className={`p-5 rounded-2xl border text-center transition-all ${
                netProfit > 0
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : netProfit === 0
                  ? 'bg-neutral-100 text-neutral-900 border-neutral-200'
                  : 'bg-rose-600 text-white border-rose-600'
              }`}
            >
              <div className="text-xs uppercase font-bold tracking-wider opacity-90 mb-1">
                Net Profit
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {formatCurrency(netProfit)}
              </div>
              <div className="text-xs mt-1 font-semibold opacity-90">
                Margin: {formatPercent(profitMargin)} ·{' '}
                {netProfit > 0 ? 'Profitable Order' : netProfit === 0 ? 'Break-even' : 'Loss'}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Save Order & Deduct Stock</span>
            </button>
            <div className="text-center text-[11px] text-neutral-400">
              * Inventory stock will auto-decrement for selected items
            </div>
          </div>
        </div>
      </form>

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        row={editingRow}
        product={editingRow ? products.find((p) => p.id === editingRow.productId) : undefined}
        onUpdate={handleUpdateRow}
        onDelete={(rowId) => {
          handleRemoveRow(rowId);
          setEditingRow(null);
        }}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        products={products}
        initialTab={addItemModalTab}
        onAddInventoryItem={handleAddInventoryItem}
        onAddCustomItem={handleAddCustomItem}
        onOpenQuickAddProduct={() => {
          setIsQuickAddOpen(true);
        }}
      />

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setActiveRowId(null);
        }}
        onProductCreated={(newProd) => {
          onAddNewProduct(newProd);
          if (activeRowId) {
            setRows((prev) =>
              prev.map((r) => (r.id === activeRowId ? { ...r, productId: newProd.id } : r))
            );
            setActiveRowId(null);
          }
        }}
        defaultCategories={categories}
      />

      {/* Select Package Modal */}
      <SelectPackageModal
        isOpen={isPackagePickerOpen}
        onClose={() => setIsPackagePickerOpen(false)}
        packages={packages}
        products={products}
        currentPackageId={selectedPackageId}
        onSelectPackage={handleApplyPackage}
        onSelectCustom={handleResetToCustom}
      />

      {/* Packaging Materials Selection Modal */}
      <PackagingMaterialsModal
        isOpen={isPackagingModalOpen}
        onClose={() => setIsPackagingModalOpen(false)}
        materials={packagingMaterials}
        initialSelectedItems={selectedPackagingItems}
        currentManualCost={packagingCost}
        onApply={(items, finalCost) => {
          setSelectedPackagingItems(items);
          setPackagingCost(finalCost);
        }}
        onQuickAddMaterial={onQuickAddPackagingMaterial}
      />
    </div>
  );
};

