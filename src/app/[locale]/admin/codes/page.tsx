'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminNav from '@/components/admin/AdminNav';
import { formatAUD } from '@/lib/calc';
import type { PromoCode } from '@/types/quoter';

export default function CodesPage() {
  const t = useTranslations('admin.codes');
  const params = useParams();
  const locale = params.locale as string;

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: 10, note: '' });
  const [formError, setFormError] = useState('');

  const supabase = createClient();

  const loadCodes = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (data) setCodes(data.map(r => ({ ...r, type: r.type as 'percent' | 'fixed' })));
    setLoading(false);
  };

  useEffect(() => { loadCodes(); }, []);

  const toggleCode = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ active: !active }).eq('id', id);
    setCodes(cs => cs.map(c => c.id === id ? { ...c, active: !active } : c));
  };

  const deleteCode = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    setCodes(cs => cs.filter(c => c.id !== id));
  };

  const addCode = async () => {
    setFormError('');
    const code = newCode.code.trim().toUpperCase();
    if (!code) { setFormError(t('errEmpty')); return; }
    if (codes.find(c => c.code === code)) { setFormError(t('errExists')); return; }
    if (!newCode.value || newCode.value <= 0) { setFormError(t('errValue')); return; }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({ code, type: newCode.type, value: newCode.value, note: newCode.note, active: true })
      .select()
      .single();

    if (!error && data) {
      setCodes(cs => [{ ...data, type: data.type as 'percent' | 'fixed' }, ...cs]);
      setNewCode({ code: '', type: 'percent', value: 10, note: '' });
    }
  };

  const activeCount = codes.filter(c => c.active).length;
  const inactiveCount = codes.filter(c => !c.active).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <AdminNav locale={locale} active="codes" />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-[21px] font-medium text-[#1D2E56]">{t('title')}</h1>
          <p className="text-[13px] text-[#888]">{t('subtitle')}</p>
        </div>

        {/* Codes list */}
        <div className="pnl mb-4">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[rgba(29,46,86,0.09)]">
            <p className="text-[14px] font-medium text-[#1D2E56]">{t('allCodes')}</p>
            <div className="flex gap-1.5">
              <span className="ck-tag bg-[rgba(166,1,241,0.1)] text-[#A601F1]">{activeCount} {t('active')}</span>
              <span className="ck-tag bg-[rgba(29,46,86,0.07)] text-[#888]">{inactiveCount} {t('inactive')}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-[13px] text-[#aaa] text-center py-6">...</p>
          ) : !codes.length ? (
            <p className="text-[13px] text-[#aaa] text-center py-6">{t('noCodes')}</p>
          ) : (
            codes.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-2.5 py-2.5 ${i < codes.length - 1 ? 'border-b border-[rgba(29,46,86,0.07)]' : ''}`}>
                <div className={`w-[34px] h-[34px] rounded-[8px] flex items-center justify-center flex-shrink-0 text-[15px] ${c.active ? 'bg-[rgba(166,1,241,0.1)]' : 'bg-[rgba(29,46,86,0.05)]'}`}>
                  🎟️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[13px] font-medium text-[#1D2E56] tracking-[0.04em]">{c.code}</span>
                    <span className={`ck-tag ${c.active ? 'bg-[rgba(166,1,241,0.1)] text-[#A601F1]' : 'bg-[rgba(29,46,86,0.07)] text-[#999]'}`}>
                      {c.active ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#888]">
                    {c.type === 'percent' ? c.value + '% off' : formatAUD(c.value) + ' off'}
                    {c.note ? ' · ' + c.note : ''}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleCode(c.id, c.active)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-[5px] cursor-pointer border-none transition-colors ${c.active ? 'bg-[rgba(29,46,86,0.07)] text-[#1D2E56] hover:bg-[rgba(29,46,86,0.12)]' : 'bg-[rgba(166,1,241,0.1)] text-[#A601F1] hover:bg-[rgba(166,1,241,0.2)]'}`}>
                    {c.active ? t('deactivate') : t('activate')}
                  </button>
                  <button
                    onClick={() => deleteCode(c.id)}
                    className="text-[11px] px-2 py-1 rounded-[5px] cursor-pointer border-none bg-[rgba(229,57,53,0.07)] text-[#e53935] hover:bg-[rgba(229,57,53,0.14)] transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add new code */}
        <div className="pnl">
          <p className="text-[14px] font-medium text-[#1D2E56] mb-3">
            ➕ {t('addTitle')}
          </p>
          <div className="grid grid-cols-[1fr_95px_85px] gap-1.5 mb-1.5">
            <input className="ck-input !mb-0 uppercase tracking-[0.05em]" placeholder={t('codePlaceholder')}
              value={newCode.code} onChange={e => setNewCode(s => ({ ...s, code: e.target.value.toUpperCase() }))} />
            <select className="ck-input !mb-0" value={newCode.type}
              onChange={e => setNewCode(s => ({ ...s, type: e.target.value as 'percent' | 'fixed' }))}>
              <option value="percent">{t('percentOff')}</option>
              <option value="fixed">{t('fixedOff')}</option>
            </select>
            <input className="ck-input !mb-0" type="number" placeholder={t('valuePlaceholder')} min="1"
              value={newCode.value} onChange={e => setNewCode(s => ({ ...s, value: Math.abs(+e.target.value) }))} />
          </div>
          <div className="flex gap-1.5">
            <input className="ck-input !mb-0 flex-1" placeholder={t('notePlaceholder')}
              value={newCode.note} onChange={e => setNewCode(s => ({ ...s, note: e.target.value }))} />
            <button onClick={addCode}
              className="px-4 py-2 rounded-[7px] border-none bg-[#A601F1] text-white text-[13px] font-medium cursor-pointer whitespace-nowrap hover:bg-[#8e00cc] transition-colors">
              {t('add')}
            </button>
          </div>
          {formError && <p className="text-[12px] text-[#e53935] mt-1.5">{formError}</p>}
        </div>
      </main>
    </div>
  );
}
