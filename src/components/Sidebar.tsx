import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Layers,
  Package,
  Receipt,
  WalletCards,
  Settings,
  PackageCheck,
  Truck,
  TrendingUp,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'courier'
  | 'profit-expense-analytics'
  | 'purchases'
  | 'stock-ledger'
  | 'products'
  | 'packages'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'accounts'
  | 'profit-loss'
  | 'returns'
  | 'new-order'
  | 'new-purchase';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  shopName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  shopName,
}) => {
  const navSections = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders' as TabType, label: 'Orders & Sales', icon: ShoppingBag },
        { id: 'courier' as TabType, label: 'Courier (Pathao)', icon: Truck },
      ],
    },
    {
      title: 'Inventory & Items',
      items: [
        { id: 'stock-ledger' as TabType, label: 'Stock & Ledger', icon: Boxes },
        { id: 'products' as TabType, label: 'Products', icon: Layers },
        { id: 'packages' as TabType, label: 'Gift Packages', icon: Package },
      ],
    },
    {
      title: 'Financials',
      items: [
        {
          id: 'profit-expense-analytics' as TabType,
          label: 'Profit & Expense Analytics',
          icon: TrendingUp,
        },
        { id: 'expenses' as TabType, label: 'Expenses', icon: Receipt },
        { id: 'accounts' as TabType, label: 'Cash & Accounts', icon: WalletCards },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 min-h-screen select-none no-print">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <PackageCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 text-sm leading-tight truncate">
              {shopName || 'Business Hub'}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">
              ERP & Accounting
            </div>
          </div>
        </div>
      </div>



      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-neutral-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-neutral-100">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>System Settings</span>
        </button>
      </div>
    </aside>
  );
};
