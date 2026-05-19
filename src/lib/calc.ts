import { PACKAGES, ADDONS, MAINTENANCE, findExtraItem } from './data';
import type { QuoteState, CalcResult, QuoteLineItem } from '@/types/quoter';

export function formatAUD(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-AU');
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function calcQuote(state: QuoteState): CalcResult {
  let oneTime = 0;
  let monthly = 0;

  if (state.packageId) {
    const pkg = PACKAGES.find(p => p.id === state.packageId);
    if (pkg) oneTime += pkg.price;
  }

  state.addonIds.forEach(id => {
    const addon = ADDONS.find(a => a.id === id);
    if (addon) oneTime += addon.price;
  });

  if (state.maintenanceId) {
    const mnt = MAINTENANCE.find(m => m.id === state.maintenanceId);
    if (mnt) monthly += mnt.price;
  }

  state.extraIds.forEach(id => {
    const item = findExtraItem(id);
    if (item) {
      if (item.isMonthly) monthly += item.price;
      else oneTime += item.price;
    }
  });

  let discount = 0;
  if (state.promoCode && oneTime > 0) {
    if (state.promoCode.type === 'percent') {
      discount = Math.round(oneTime * state.promoCode.value / 100);
    } else {
      discount = Math.min(state.promoCode.value, oneTime);
    }
  }

  return { oneTime, monthly, discount, net: Math.max(0, oneTime - discount) };
}

export function getLineItems(state: QuoteState): QuoteLineItem[] {
  const items: QuoteLineItem[] = [];

  if (state.packageId) {
    const pkg = PACKAGES.find(p => p.id === state.packageId);
    if (pkg) items.push({ name: pkg.name + ' website package', price: pkg.price, isMonthly: false, isEstimated: false });
  }

  state.addonIds.forEach(id => {
    const addon = ADDONS.find(a => a.id === id);
    if (addon) items.push({ name: addon.name, price: addon.price, isMonthly: false, isEstimated: false });
  });

  if (state.maintenanceId) {
    const mnt = MAINTENANCE.find(m => m.id === state.maintenanceId);
    if (mnt) items.push({ name: mnt.name + ' maintenance plan', price: mnt.price, isMonthly: true, isEstimated: false });
  }

  state.extraIds.forEach(id => {
    const item = findExtraItem(id);
    if (item) items.push({ name: item.name, price: item.price, isMonthly: !!item.isMonthly, isEstimated: !!item.isFrom });
  });

  return items;
}

export function calcPayments(net: number, months: 3 | 6) {
  const deposit35 = Math.round(net * 0.35);
  const payment35 = Math.round(net * 0.35);
  const balance = net - deposit35 - payment35;
  const rate = months === 3 ? 0.05 : 0.08;
  const financed = Math.round(balance * (1 + rate));
  const instalment = Math.round(financed / months);
  return { deposit35, payment35, balance, financed, instalment };
}
