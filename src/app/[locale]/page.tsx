import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROMO_CODES, PACKAGES, ADDONS, MAINTENANCE, EXTRA_CATEGORIES } from '@/lib/data';
import Quoter from '@/components/quoter/Quoter';
import type { PromoCode, Package, Addon, MaintenancePlan, ExtraCategory } from '@/types/quoter';

export default async function QuoterPage() {
  const supabase = await createClient();

  // ── Promo codes ──────────────────────────────────────────────────────────────
  let promoCodes: PromoCode[] = DEFAULT_PROMO_CODES;
  try {
    const { data } = await supabase
      .from('promo_codes')
      .select('id, code, type, value, active, note')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (data?.length) promoCodes = data as PromoCode[];
  } catch { /* use defaults */ }

  // ── Services ─────────────────────────────────────────────────────────────────
  let packages:    Package[]      = PACKAGES;
  let addons:      Addon[]        = ADDONS;
  let maintenance: MaintenancePlan[] = MAINTENANCE;
  let extraCategories: ExtraCategory[] = EXTRA_CATEGORIES;

  try {
    const [{ data: prices }, { data: categories }] = await Promise.all([
      supabase.from('prices').select('*').eq('active', true).order('sort_order'),
      supabase.from('service_categories').select('*').order('sort_order'),
    ]);

    if (prices?.length) {
      const pkgRows = prices.filter(r => r.category === 'package');
      if (pkgRows.length) packages = pkgRows.map(r => ({
        id: r.id, name: r.name, description: r.description ?? '',
        price: r.price, deliveryTime: r.delivery ?? '',
        maintenanceTier: (r.mnt_tier ?? 'ess') as 'ess' | 'std' | 'prm',
        isPopular: r.is_popular ?? false,
      }));

      const addonRows = prices.filter(r => r.category === 'addon');
      if (addonRows.length) addons = addonRows.map(r => ({
        id: r.id, name: r.name, price: r.price,
      }));

      const mntRows = prices.filter(r => r.category === 'maintenance');
      if (mntRows.length) maintenance = mntRows.map(r => ({
        id: r.id, name: r.name, description: r.description ?? '', price: r.price,
      }));

      const extraRows = prices.filter(r => r.category === 'extra');
      if (extraRows.length && categories?.length) {
        extraCategories = categories.map((cat: { id: string; label: string; icon: string }) => ({
          label: cat.label,
          icon:  cat.icon,
          items: extraRows
            .filter(r => r.subcategory === cat.id)
            .map(r => ({
              id: r.id, name: r.name, description: r.description ?? '',
              price: r.price, isMonthly: r.is_monthly ?? false,
              isFrom: r.is_from ?? false,
            })),
        })).filter((c: ExtraCategory) => c.items.length > 0);
      }
    }
  } catch { /* use defaults */ }

  return (
    <Quoter
      promoCodes={promoCodes}
      packages={packages}
      addons={addons}
      maintenance={maintenance}
      extraCategories={extraCategories}
    />
  );
}
