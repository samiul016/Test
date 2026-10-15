// Accounting and Business Utility functions for Bangladeshi Business Standards (BDT ৳, DD-MM-YYYY, Asia/Dhaka)

export type DateFilterPreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'custom';

export function formatCurrency(amount: number | undefined | null, symbol: string = '৳'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol} 0.00`;
  }
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

export function formatCompactCurrency(amount: number | undefined | null, symbol: string = '৳'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol} 0`;
  }
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

// Format YYYY-MM-DD or ISO string to DD-MM-YYYY
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

// Get today's date in YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Filter items by preset or custom range
export function isDateInRange(
  dateStr: string,
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  const itemDate = dateStr.split('T')[0];
  const today = getTodayString();
  const now = new Date();

  if (preset === 'today') {
    return itemDate === today;
  }

  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    return itemDate === yStr;
  }

  if (preset === 'this_week') {
    // Current week starting from Saturday/Sunday (Bangladesh weekend is Friday/Saturday, standard week starts Saturday or Sunday)
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day; // Sunday of this week
    const startOfWeek = new Date(d.setDate(diff));
    const startStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    return itemDate >= startStr && itemDate <= today;
  }

  if (preset === 'this_month') {
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return itemDate >= startOfMonth && itemDate <= today;
  }

  if (preset === 'this_year') {
    const startOfYear = `${now.getFullYear()}-01-01`;
    return itemDate >= startOfYear && itemDate <= today;
  }

  if (preset === 'custom') {
    if (customStart && itemDate < customStart) return false;
    if (customEnd && itemDate > customEnd) return false;
    return true;
  }

  return true;
}

// Weighted Average Cost calculation when new purchase stock is received
export function calculateNewWeightedAverageCost(
  currentStock: number,
  currentUnitCost: number,
  incomingQuantity: number,
  incomingEffectiveUnitCost: number
): number {
  const validCurrentStock = Math.max(0, currentStock);
  const totalStock = validCurrentStock + incomingQuantity;
  if (totalStock <= 0) return incomingEffectiveUnitCost;

  const totalValue =
    validCurrentStock * currentUnitCost + incomingQuantity * incomingEffectiveUnitCost;
  return Number((totalValue / totalStock).toFixed(2));
}

// Allocate Landed Costs (shipping, loading, other) across purchase items proportionally
export function allocateLandedCosts<T extends { quantity: number; unitCost: number; lineDiscount: number }>(
  items: T[],
  totalLandedCost: number,
  method: 'value' | 'quantity' = 'value'
): { allocatedLandedCost: number; effectiveUnitCost: number; totalCost: number }[] {
  if (items.length === 0) return [];
  if (totalLandedCost <= 0) {
    return items.map((it) => {
      const lineNet = it.unitCost * it.quantity - (it.lineDiscount || 0);
      const effectiveUnitCost = it.quantity > 0 ? lineNet / it.quantity : it.unitCost;
      return {
        allocatedLandedCost: 0,
        effectiveUnitCost: Number(effectiveUnitCost.toFixed(2)),
        totalCost: Number(lineNet.toFixed(2)),
      };
    });
  }

  const totalBaseValue = items.reduce(
    (sum, it) => sum + (it.unitCost * it.quantity - (it.lineDiscount || 0)),
    0
  );
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  return items.map((it) => {
    let allocated = 0;
    if (method === 'value' && totalBaseValue > 0) {
      const lineNet = it.unitCost * it.quantity - (it.lineDiscount || 0);
      allocated = (lineNet / totalBaseValue) * totalLandedCost;
    } else if (totalQuantity > 0) {
      allocated = (it.quantity / totalQuantity) * totalLandedCost;
    }
    const lineNet = it.unitCost * it.quantity - (it.lineDiscount || 0);
    const lineTotalWithLanded = lineNet + allocated;
    const effectiveUnitCost = it.quantity > 0 ? lineTotalWithLanded / it.quantity : it.unitCost;

    return {
      allocatedLandedCost: Number(allocated.toFixed(2)),
      effectiveUnitCost: Number(effectiveUnitCost.toFixed(2)),
      totalCost: Number(lineTotalWithLanded.toFixed(2)),
    };
  });
}
