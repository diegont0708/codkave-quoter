'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminNav from '@/components/admin/AdminNav';
import { PACKAGES, ADDONS, MAINTENANCE, EXTRA_CATEGORIES } from '@/lib/data';

interface PriceRow { id: string; price: number }

export default function PricesPage() {
  const t = useTranslations('admin.prices');
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const buildDefaults = () => {
    const defaults: Record<string, number> = {};
    PACKAGES.forEach(p => { defaults[p.id] = p.price; });
    ADDONS.forEach(a => { defaults[a.id] = a.price; });
    MAINTENANCE.forEach(m => { defaults[m.id] = m.price; });
    EXTRA_CATEGORIES.forEach(cat => cat.items.forEach(i => { defaults[i.id] = i.price; }));
    return defaults;
  };

  useEffect(() => {
    const load = async () => {
      const defaults = buildDefaults();
      const { data } = await supabase.from('prices').select('id, price');
      if (data?.length) {
        const overrides: Record<string, number> = {};
        data.forEach((r: PriceRow) => { overrides[r.id] = r.price; });
        setPrices({ ...defaults, ...overrides });
      } else {
        setPrices(defaults);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = Object.entries(prices).map(([id, price]) => ({ id, price }));
    await supabase.from('prices').upsert(rows, { onConflict: 'id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, ids }: { title: string; ids: string[] }) => (
    <div className="mb-4">
      <p className="text-[11px] font-medium text-[#36A9E1] uppercase tracking-wider mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {ids.map(id => {
          const name =
            PACKAGES.find(p => p.id === id)?.name ||
            ADDONS.find(a => a.id === id)?.name ||
            MAINTENANCE.find(m => m.id === id)?.name ||
            EXTRA_CATEGORIES.flatMap(c => c.items).find(i => i.id === id)?.name || id;
          return (
            <div key={id} className="flex items-center justify-between bg-white border border-[rgba(29,46,86,0.1)] rounded-[7px] px-3 py-2">
              <span className="text-[12px] text-[#1D2E56] flex-1 mr-2">{name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-[#888]">$</span>
                <input
                  type="number"
                  className="w-[70px] text-right text-[13px] font-medium text-[#A601F1] border border-[rgba(29,46,86,0.15)] rounded-[5px] px-1.5 py-0.5 focus:outline-none focus:border-[#A601F1]"
                  value={prices[id] ?? 0}
                  onChange={e => setPrices(p => ({ ...p, [id]: +e.target.value }))}
                  min="0"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <AdminNav locale={locale} active="prices" />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[21px] font-medium text-[#1D2E56]">{t('title')}</h1>
            <p className="text-[13px] text-[#888]">{t('subtitle')}</p>
          </div>
          <button onClick={save} disabled={saving}
            className={`px-5 py-2 rounded-[8px] border-none text-[13px] font-medium cursor-pointer transition-colors
              ${saved ? 'bg-[#4CAF50] text-white' : 'bg-[#A601F1] text-white hover:bg-[#8e00cc]'} disabled:opacity-60`}>
            {saved ? t('saved') : t('save')}
          </button>
        </div>

        <div className="pnl">
          <Section title="Website packages" ids={PACKAGES.map(p => p.id)} />
          <Section title="Add-ons" ids={ADDONS.map(a => a.id)} />
          <Section title="Maintenance plans" ids={MAINTENANCE.map(m => m.id)} />
          {EXTRA_CATEGORIES.map(cat => (
            <Section key={cat.label} title={cat.label} ids={cat.items.map(i => i.id)} />
          ))}
        </div>
      </main>
    </div>
  );
}
