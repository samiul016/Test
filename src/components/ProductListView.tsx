import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Download,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Box,
} from 'lucide-react';
import { ProductItem, Order, Purchase, PackagingMaterial } from '../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/accounting';
import { PackagingMaterialsTab } from './PackagingMaterialsTab';

interface ProductListViewProps {
  products: ProductItem[];
  orders: Order[];
  purchases: Purchase[];
  packagingMaterials?: PackagingMaterial[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
  onBulkImport: (newProducts: ProductItem[]) => void;
  onAddPackagingMaterial?: (mat: PackagingMaterial) => void;
  onUpdatePackagingMaterial?: (mat: PackagingMaterial) => void;
  onDeletePackagingMaterial?: (id: string) => void;
  onAdjustPackagingStock?: (id: string, delta: number) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  orders,
  purchases,
  packagingMaterials = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkImport,
  onAddPackagingMaterial,
  onUpdatePackagingMaterial,
  onDeletePackagingMaterial,
  onAdjustPackagingStock,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'packaging'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingProd, setEditingProd] = useState<ProductItem | null>(null);
  const [viewingProdDetails, setViewingProdDetails] = useState<ProductItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Chocolates');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, selectedCat, statusFilter]);

  const totalCatalogValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0) * (p.unitCost || 0), 0),
    [products]
  );

  const openAdd = () => {
    setModalMode('add');
    setEditingProd(null);
    setName('');
    setSku(`SKU-${Math.floor(Math.random() * 9000) + 1000}`);
    setBarcode('');
    setCategory(categories[0] || 'Chocolates');
    setBrand('');
    setDescription('');
    setUnit('pcs');
    setUnitCost('');
    setSellingPrice('');
    setStock(10);
    setMinStockAlert(5);
    setIsActive(true);
    setNotes('');
    setError('');
  };

  const openEdit = (p: ProductItem) => {
    setModalMode('edit');
    setEditingProd(p);
    setName(p.name);
    setSku(p.sku || '');
    setBarcode(p.barcode || '');
    setCategory(p.category);
    setBrand(p.brand || '');
    setDescription(p.description || '');
    setUnit(p.unit);
    setUnitCost(p.unitCost);
    setSellingPrice(p.suggestedSellingPrice);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert || 5);
    setIsActive(p.isActive);
    setNotes(p.notes || '');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name');
      return;
    }
    const cost = Number(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost price');
      return;
    }
    const sell = Number(sellingPrice) || Math.round(cost * 1.35);

    if (modalMode === 'add') {
      const newP: ProductItem = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        barcode: barcode.trim() || undefined,
        category: category.trim() || 'General',
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        unit: unit.trim() || 'pcs',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        reservedStock: 0,
        minStockAlert: Number(minStockAlert) || 5,
        isActive,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newP);
    } else if (modalMode === 'edit' && editingProd) {
      onUpdateProduct({
        ...editingProd,
        name: name.trim(),
        sku: sku.trim() || editingProd.sku,
        barcode: barcode.trim() || undefined,
        category: category.trim() || 'General',
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        unit: unit.trim() || 'pcs',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        isActive,
        notes: notes.trim() || undefined,
      });
    }

    setModalMode('none');
  };

  // Safe delete: Check if transactions exist
  const handleDeleteAttempt = (p: ProductItem) => {
    const hasOrders = orders.some((o) => o.items.some((it) => it.productId === p.id));
    const hasPurchases = purchases.some((pur) => pur.items.some((it) => it.productId === p.id));

    if (hasOrders || hasPurchases) {
      if (
        confirm(
          `Product "${p.name}" has historical order/purchase records and cannot be permanently deleted to protect accounting integrity. Would you like to mark it as INACTIVE instead?`
        )
      ) {
        onUpdateProduct({ ...p, isActive: false });
      }
      return;
    }

    if (confirm(`Permanently delete "${p.name}"?`)) {
      onDeleteProduct(p.id);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'SKU',
      'Category',
      'Brand',
      'Unit',
      'Unit Cost (৳)',
      'Selling Price (৳)',
      'Stock',
      'Min Stock Alert',
      'Status',
    ];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku || '',
      `"${p.category}"`,
      p.brand || '',
      p.unit,
      p.unitCost,
      p.suggestedSellingPrice,
      p.stock,
      p.minStockAlert,
      p.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Import CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        const imported: ProductItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 4) {
            const name = cols[1] || cols[0];
            const sku = cols[2] || `SKU-${Date.now()}-${i}`;
            const category = cols[3] || 'General';
            const unitCost = Number(cols[6] || cols[4]) || 100;
            const sellingPrice = Number(cols[7] || cols[5]) || Math.round(unitCost * 1.35);
            const stock = Number(cols[8] || cols[6]) || 10;

            imported.push({
              id: `prod-imp-${Date.now()}-${i}`,
              name,
              sku,
              category,
              unit: cols[5] || 'pcs',
              unitCost,
              suggestedSellingPrice: sellingPrice,
              stock,
              reservedStock: 0,
              minStockAlert: 5,
              isActive: true,
              createdAt: new Date().toISOString().split('T')[0],
            });
          }
        }

        if (imported.length > 0) {
          onBulkImport(imported);
          alert(`Successfully imported ${imported.length} products!`);
        }
      } catch (err) {
        alert('Failed to parse CSV file. Ensure standard format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            {activeTab === 'catalog' ? 'Product Management' : 'Other Products & Packaging Materials'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {activeTab === 'catalog'
              ? 'Catalog cataloging, barcode/SKU tracking, WAC valuation & product analytics'
              : 'অর্ডারের জন্য কেনা বক্স, স্টিকার, রিবন ও টেপের স্টক এবং প্রতি পিস খরচের হিসাব'}
          </p>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'catalog'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>মূল পণ্য ক্যাটালগ (Main Products)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-700/60 text-white">
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packaging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'packaging'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Box className="w-4 h-4 text-amber-300" />
          <span>অন্যান্য পণ্য / প্যাকেজিং সরঞ্জাম (বক্স, স্টিকার, রিবন, টেপ)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-800 text-white">
            {packagingMaterials.length}
          </span>
        </button>
      </div>

      {activeTab === 'packaging' ? (
        <PackagingMaterialsTab
          materials={packagingMaterials}
          onAddMaterial={onAddPackagingMaterial || (() => {})}
          onUpdateMaterial={onUpdatePackagingMaterial || (() => {})}
          onDeleteMaterial={onDeletePackagingMaterial || (() => {})}
          onAdjustStock={onAdjustPackagingStock || (() => {})}
        />
      ) : (
        <>
          {/* 4 Summary Cards (2 per row on mobile!) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Products
          </div>
          <div className="text-base sm:text-xl font-bold text-neutral-900">{products.length}</div>
          <div className="text-[10px] text-neutral-400 mt-1">In {categories.length} categories</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Total Stock On Hand
          </div>
          <div className="text-base sm:text-xl font-bold text-blue-700">
            {products.reduce((s, p) => s + (p.stock || 0), 0)}{' '}
            <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Physical inventory count</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Catalog Inventory Value
          </div>
          <div className="text-base sm:text-xl font-bold text-emerald-700">
            {formatCompactCurrency(totalCatalogValue)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Weighted Average Cost basis</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
            Low Stock Alerts
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-700">
            {products.filter((p) => p.isActive && p.stock <= p.minStockAlert).length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">At or below reorder level</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search product, SKU, barcode, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU / Barcode</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Unit</th>
                <th className="p-3 text-right">Cost (৳)</th>
                <th className="p-3 text-right">Selling Price (৳)</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => {
                const isLow = p.stock <= p.minStockAlert;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-all">
                    <td className="p-3 font-bold text-neutral-900">
                      <div>{p.name}</div>
                      {p.brand && <div className="text-[10px] text-neutral-400">Brand: {p.brand}</div>}
                    </td>
                    <td className="p-3 font-mono text-neutral-600">
                      <div>{p.sku || '-'}</div>
                      {p.barcode && <div className="text-[10px] text-neutral-400">{p.barcode}</div>}
                    </td>
                    <td className="p-3 text-neutral-600">{p.category}</td>
                    <td className="p-3 text-center text-neutral-500 font-semibold">{p.unit}</td>
                    <td className="p-3 text-right font-semibold text-neutral-800">
                      {formatCurrency(p.unitCost)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatCurrency(p.suggestedSellingPrice)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingProdDetails(p)}
                          title="Product History & Profit"
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit Product"
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttempt(p)}
                          title="Delete / Deactivate"
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Add / Edit Product Modal */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button
                onClick={() => setModalMode('none')}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-3">
              {error && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy Milk Silk Chocolate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="CHK-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="890123..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Category *</label>
                  <input
                    type="text"
                    placeholder="e.g. Chocolates, Flowers"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Cadbury"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    placeholder="pcs, box, kg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Unit Cost (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="180"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Selling Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="250"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Min Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Storage guidelines, packaging dimensions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-neutral-700">
                  Active in sales catalog
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
                  className="px-3 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Drawer: Sales & Purchase History */}
      {viewingProdDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
              <div>
                <h3 className="text-base font-bold">{viewingProdDetails.name}</h3>
                <p className="text-xs text-neutral-400">
                  SKU: {viewingProdDetails.sku || '-'} &bull; Category:{' '}
                  {viewingProdDetails.category}
                </p>
              </div>
              <button
                onClick={() => setViewingProdDetails(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Valuation Snapshot */}
              <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Stock</div>
                  <div className="text-sm font-bold text-neutral-900">
                    {viewingProdDetails.stock} {viewingProdDetails.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">WAC Cost</div>
                  <div className="text-sm font-bold text-blue-700">
                    {formatCurrency(viewingProdDetails.unitCost)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Selling Price</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(viewingProdDetails.suggestedSellingPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Total Value</div>
                  <div className="text-sm font-bold text-neutral-900">
                    {formatCurrency(viewingProdDetails.stock * viewingProdDetails.unitCost)}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-bold text-neutral-900 mb-2">Purchase History</h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="p-2">PO #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Supplier</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {purchases
                        .filter((pur) =>
                          pur.items.some((it) => it.productId === viewingProdDetails.id)
                        )
                        .map((pur) => {
                          const item = pur.items.find(
                            (it) => it.productId === viewingProdDetails.id
                          );
                          return (
                            <tr key={pur.id}>
                              <td className="p-2 font-bold">#{pur.purchaseNumber}</td>
                              <td className="p-2">{formatDate(pur.purchaseDate)}</td>
                              <td className="p-2">{pur.supplierName}</td>
                              <td className="p-2 text-center font-bold">{item?.quantity}</td>
                              <td className="p-2 text-right font-semibold">
                                {formatCurrency(item?.effectiveUnitCost || item?.unitCost)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales History */}
              <div>
                <h4 className="font-bold text-neutral-900 mb-2">Sales Order History</h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="p-2">Order #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {orders
                        .filter((o) =>
                          o.items.some((it) => it.productId === viewingProdDetails.id)
                        )
                        .map((o) => {
                          const item = o.items.find(
                            (it) => it.productId === viewingProdDetails.id
                          );
                          return (
                            <tr key={o.id}>
                              <td className="p-2 font-bold">#{o.orderNumber}</td>
                              <td className="p-2">{formatDate(o.orderDate)}</td>
                              <td className="p-2">{o.customerName}</td>
                              <td className="p-2 text-center font-bold">{item?.quantity}</td>
                              <td className="p-2 text-right font-semibold text-emerald-700">
                                {formatCurrency(item?.sellingPrice || item?.suggestedPrice)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setViewingProdDetails(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
