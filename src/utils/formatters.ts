import { OrderStatus, PaymentStatus } from '../types';

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${symbol}${formatted}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export const STATUS_MAP: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  packaging: {
    label: 'Packaging',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  returned: {
    label: 'Returned',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; text: string }> = {
  paid: { label: 'Paid', text: 'text-emerald-700' },
  partial: { label: 'Partial', text: 'text-amber-700' },
  unpaid: { label: 'Unpaid', text: 'text-rose-700' },
  refunded: { label: 'Refunded', text: 'text-purple-700' },
  cod: { label: 'COD', text: 'text-blue-700' },
};
