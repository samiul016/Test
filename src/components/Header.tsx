import React from 'react';
import { Package, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'new-order' | 'orders' | 'inventory';
  onSelectTab: (tab: 'dashboard' | 'new-order' | 'orders' | 'inventory') => void;
  onOpenNewOrder: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewOrder,
  lowStockCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="whitespace-nowrap shrink-0">
              <span className="text-lg font-bold tracking-tight text-neutral-900">
                PackageCraft
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-neutral-500 border-l border-neutral-300 pl-2">
                কাস্টম প্যাকেজ ও প্রফিট
              </span>
            </div>
          </button>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
                currentTab === 'dashboard'
                  ? 'border-emerald-600 text-neutral-900 font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              ড্যাশবোর্ড
            </button>
            <button
              onClick={() => onSelectTab('new-order')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
                currentTab === 'new-order'
                  ? 'border-emerald-600 text-neutral-900 font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              নতুন অর্ডার তৈরি
            </button>
            <button
              onClick={() => onSelectTab('orders')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
                currentTab === 'orders'
                  ? 'border-emerald-600 text-neutral-900 font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              অর্ডার ও প্রফিট লিস্ট
            </button>
            <button
              onClick={() => onSelectTab('inventory')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'inventory'
                  ? 'border-emerald-600 text-neutral-900 font-semibold'
                  : 'border-transparent hover:text-neutral-900'
              }`}
            >
              <span>পণ্য তালিকা ও স্টক</span>
              {lowStockCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono-numbers">
                  {lowStockCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>প্যাকেজ অর্ডার করুন</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-between border-t border-neutral-100 py-2.5 overflow-x-auto text-xs font-medium text-neutral-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'dashboard' ? 'bg-neutral-900 text-white' : ''}`}
          >
            ড্যাশবোর্ড
          </button>
          <button
            onClick={() => onSelectTab('new-order')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'new-order' ? 'bg-neutral-900 text-white' : ''}`}
          >
            নতুন অর্ডার
          </button>
          <button
            onClick={() => onSelectTab('orders')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'orders' ? 'bg-neutral-900 text-white' : ''}`}
          >
            অর্ডার তালিকা
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'inventory' ? 'bg-neutral-900 text-white' : ''}`}
          >
            পণ্য ও স্টক {lowStockCount > 0 && `(${lowStockCount})`}
          </button>
        </div>
      </div>
    </header>
  );
};
