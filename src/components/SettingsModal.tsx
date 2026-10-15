import React, { useState } from 'react';
import { X, Download, RotateCcw, Save, Store, Globe, Calendar } from 'lucide-react';
import { AppSettings } from '../types';
import { exportAllData } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetData?: () => void;
  onResetAllData?: () => void;
  onClearTransactions?: () => void;
  onExportData?: () => void;
  onImportData?: (data: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onResetAllData,
  onClearTransactions,
  onExportData,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '৳');
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(settings.defaultDeliveryCharge);
  const [defaultPackagingCharge, setDefaultPackagingCharge] = useState(
    settings.defaultPackagingCharge
  );
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Dhaka');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'DD-MM-YYYY');
  const [costingMethod, setCostingMethod] = useState<'WAC' | 'FIFO'>(
    settings.costingMethod || 'WAC'
  );
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      shopName: shopName.trim() || 'Business Hub',
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      currencySymbol: currencySymbol.trim() || '৳',
      timezone,
      dateFormat,
      costingMethod,
      defaultDeliveryCharge: Number(defaultDeliveryCharge) || 0,
      defaultPackagingCharge: Number(defaultPackagingCharge) || 0,
    });
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
      return;
    }
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (onResetAllData) {
      onResetAllData();
    } else if (onResetData) {
      onResetData();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">System & Business Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Business / Brand Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Shop / Office Address</label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Default Delivery Fee (৳)</label>
              <input
                type="number"
                value={defaultDeliveryCharge}
                onChange={(e) => setDefaultDeliveryCharge(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">
                Default Packaging Fee (৳)
              </label>
              <input
                type="number"
                value={defaultPackagingCharge}
                onChange={(e) => setDefaultPackagingCharge(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Timezone</label>
              <input
                type="text"
                readOnly
                value={timezone}
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-xl text-xs text-neutral-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Date Format</label>
              <input
                type="text"
                readOnly
                value={dateFormat}
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-xl text-xs text-neutral-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Inventory Costing Valuation
            </label>
            <select
              value={costingMethod}
              onChange={(e) => setCostingMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs bg-white font-bold"
            >
              <option value="WAC">Weighted Average Cost (WAC) - Standard</option>
              <option value="FIFO">First-In First-Out (FIFO Architecture Ready)</option>
            </select>
          </div>

          {/* Backup & Reset actions */}
          <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Data Backup</span>
            </button>
            <div className="flex items-center gap-2">
              {onClearTransactions && (
                <button
                  type="button"
                  onClick={() => {
                    onClearTransactions();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold cursor-pointer transition-colors"
                  title="Clear all orders, purchases, and expenses to start clean"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Transactions (0 Dues / 0 Sales)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Factory Data</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 rounded-xl font-semibold text-neutral-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
