'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminNav from '@/components/admin/AdminNav';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ServiceRow {
  id: string; category: string; subcategory: string | null;
  name: string; description: string; price: number;
  is_monthly: boolean; is_from: boolean; is_popular: boolean;
  mnt_tier: string | null; delivery: string | null;
  sort_order: number; active: boolean;
}
interface CategoryRow { id: string; label: string; icon: string; sort_order: number; }

const CATEGORY_LABELS: Record<string, string> = {
  package: 'Website Packages', addon: 'Add-ons', maintenance: 'Maintenance Plans', extra: 'Extras',
};
const MAIN_CATEGORIES = ['package', 'addon', 'maintenance', 'extra'];

const EMPTY_SERVICE: Omit<ServiceRow, 'id'> = {
  category: 'addon', subcategory: null, name: '', description: '', price: 0,
  is_monthly: false, is_from: false, is_popular: false,
  mnt_tier: null, delivery: null, sort_order: 99, active: true,
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const supabase = createClient();

  const [services,   setServices]   = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tab,        setTab]        = useState<'services' | 'categories'>('services');
  const [filterCat,  setFilterCat]  = useState<string>('all');
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editData,   setEditData]   = useState<Partial<ServiceRow>>({});
  const [showAdd,    setShowAdd]    = useState(false);
  const [newService, setNewService] = useState<Omit<ServiceRow, 'id'>>({ ...EMPTY_SERVICE });
  const [newCat,     setNewCat]     = useState<Omit<CategoryRow, 'sort_order'>>({ id: '', label: '', icon: '📦' });
  const [editCatId,  setEditCatId]  = useState<string | null>(null);
  const [editCatData,setEditCatData]= useState<Partial<CategoryRow>>({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const loadAll = useCallback(async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('prices').select('*').order('sort_order'),
      supabase.from('service_categories').select('*').order('sort_order'),
    ]);
    if (s) setServices(s as ServiceRow[]);
    if (c) setCategories(c as CategoryRow[]);
  }, [supabase]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = services.filter(s => {
    if (filterCat === 'all') return true;
    if (filterCat === 'extra') return s.category === 'extra';
    // filter by subcategory for extras
    if (categories.some(c => c.id === filterCat)) return s.subcategory === filterCat;
    return s.category === filterCat;
  });

  // ── Save inline edit ────────────────────────────────────────────────────────
  const saveEdit = async (id: string) => {
    setSaving(true);
    await supabase.from('prices').update(editData).eq('id', id);
    setEditId(null); setEditData({});
    await loadAll();
    setSaving(false); showToast('Saved!');
  };

  // ── Delete service ──────────────────────────────────────────────────────────
  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await supabase.from('prices').delete().eq('id', id);
    await loadAll(); showToast('Deleted');
  };

  // ── Add new service ─────────────────────────────────────────────────────────
  const addService = async () => {
    if (!newService.name.trim()) return;
    setSaving(true);
    const id = newService.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20) + '_' + Date.now().toString(36);
    await supabase.from('prices').insert({ ...newService, id });
    setNewService({ ...EMPTY_SERVICE }); setShowAdd(false);
    await loadAll(); setSaving(false); showToast('Service added!');
  };

  // ── Category CRUD ───────────────────────────────────────────────────────────
  const saveCatEdit = async (id: string) => {
    await supabase.from('service_categories').update(editCatData).eq('id', id);
    setEditCatId(null); setEditCatData({}); await loadAll(); showToast('Saved!');
  };
  const deleteCat = async (id: string) => {
    if (services.some(s => s.subcategory === id)) {
      alert('Cannot delete — there are services in this category. Move or delete them first.');
      return;
    }
    if (!confirm('Delete category?')) return;
    await supabase.from('service_categories').delete().eq('id', id);
    await loadAll(); showToast('Deleted');
  };
  const addCategory = async () => {
    if (!newCat.id.trim() || !newCat.label.trim()) return;
    const id = newCat.id.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await supabase.from('service_categories').insert({ ...newCat, id, sort_order: categories.length + 1 });
    setNewCat({ id: '', label: '', icon: '📦' }); await loadAll(); showToast('Category added!');
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const subcategoryLabel = (s: ServiceRow) => {
    if (s.category !== 'extra') return CATEGORY_LABELS[s.category] ?? s.category;
    return categories.find(c => c.id === s.subcategory)?.label ?? s.subcategory ?? 'Extras';
  };

  const inp = 'border border-[rgba(29,46,86,0.15)] rounded-[6px] px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#A601F1]';

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <AdminNav locale={locale} active="prices" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-[#1D2E56] text-white text-[12px] px-4 py-2 rounded-[8px] shadow-lg z-50">{toast}</div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[21px] font-medium text-[#1D2E56]">Services</h1>
            <p className="text-[13px] text-[#888]">Manage services and categories</p>
          </div>
          <button onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
            className="px-4 py-2 bg-[#A601F1] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#8e00cc] transition-colors border-none cursor-pointer">
            + Add service
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['services', 'categories'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-[7px] text-[12px] font-medium border-none cursor-pointer transition-colors capitalize
                ${tab === t ? 'bg-[#1D2E56] text-white' : 'bg-white text-[#666] hover:bg-[rgba(29,46,86,0.05)]'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <>
            {/* Add service form */}
            {showAdd && (
              <div className="pnl mb-4">
                <p className="text-[13px] font-medium text-[#1D2E56] mb-3">New service</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input className={inp} placeholder="Name *" value={newService.name}
                    onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} />
                  <input className={inp} placeholder="Description" value={newService.description}
                    onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-[#888]">$</span>
                    <input className={`${inp} flex-1`} type="number" placeholder="Price" value={newService.price}
                      onChange={e => setNewService(s => ({ ...s, price: +e.target.value }))} />
                  </div>
                  <select className={`${inp} bg-white`} value={newService.category}
                    onChange={e => setNewService(s => ({ ...s, category: e.target.value, subcategory: null }))}>
                    {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                  {newService.category === 'extra' && (
                    <select className={`${inp} bg-white`} value={newService.subcategory ?? ''}
                      onChange={e => setNewService(s => ({ ...s, subcategory: e.target.value }))}>
                      <option value="">— Select category —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                    <input type="checkbox" checked={newService.is_monthly}
                      onChange={e => setNewService(s => ({ ...s, is_monthly: e.target.checked }))} />
                    Monthly / recurring
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                    <input type="checkbox" checked={newService.is_from}
                      onChange={e => setNewService(s => ({ ...s, is_from: e.target.checked }))} />
                    Price is "from" (estimated)
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={addService} disabled={saving || !newService.name.trim()}
                    className="px-4 py-1.5 bg-[#A601F1] text-white text-[12px] rounded-[7px] border-none cursor-pointer hover:bg-[#8e00cc] disabled:opacity-50">
                    {saving ? 'Adding…' : 'Add service'}
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="px-4 py-1.5 bg-[rgba(29,46,86,0.07)] text-[#666] text-[12px] rounded-[7px] border-none cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { id: 'all', label: 'All' },
                ...MAIN_CATEGORIES.filter(c => c !== 'extra').map(c => ({ id: c, label: CATEGORY_LABELS[c] })),
                ...categories.map(c => ({ id: c.id, label: c.label })),
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setFilterCat(id)}
                  className={`px-3 py-1 rounded-[6px] text-[11px] font-medium border-none cursor-pointer transition-colors
                    ${filterCat === id ? 'bg-[#1D2E56] text-white' : 'bg-white text-[#666] hover:bg-[rgba(29,46,86,0.06)]'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Services list */}
            <div className="pnl p-0 overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-[13px] text-[#aaa] text-center py-8">No services in this category.</p>
              ) : filtered.map(svc => (
                <div key={svc.id} className={`border-b border-[rgba(29,46,86,0.07)] last:border-0 ${!svc.active ? 'opacity-50' : ''}`}>
                  {editId === svc.id ? (
                    /* ── Inline edit ── */
                    <div className="p-3 bg-[rgba(166,1,241,0.03)]">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input className={inp} placeholder="Name" value={editData.name ?? svc.name}
                          onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                        <input className={inp} placeholder="Description" value={editData.description ?? svc.description}
                          onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-[#888]">$</span>
                          <input className={`${inp} w-[90px]`} type="number" value={editData.price ?? svc.price}
                            onChange={e => setEditData(d => ({ ...d, price: +e.target.value }))} />
                        </div>
                        <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                          <input type="checkbox" checked={editData.is_monthly ?? svc.is_monthly}
                            onChange={e => setEditData(d => ({ ...d, is_monthly: e.target.checked }))} />
                          Monthly
                        </label>
                        <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                          <input type="checkbox" checked={editData.is_from ?? svc.is_from}
                            onChange={e => setEditData(d => ({ ...d, is_from: e.target.checked }))} />
                          From
                        </label>
                        <label className="flex items-center gap-1.5 text-[12px] text-[#666] cursor-pointer">
                          <input type="checkbox" checked={editData.active ?? svc.active}
                            onChange={e => setEditData(d => ({ ...d, active: e.target.checked }))} />
                          Active
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(svc.id)} disabled={saving}
                          className="px-3 py-1 bg-[#A601F1] text-white text-[11px] rounded-[6px] border-none cursor-pointer hover:bg-[#8e00cc]">
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => { setEditId(null); setEditData({}); }}
                          className="px-3 py-1 bg-[rgba(29,46,86,0.07)] text-[#666] text-[11px] rounded-[6px] border-none cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Row view ── */
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1D2E56] truncate">{svc.name}</p>
                        <p className="text-[11px] text-[#aaa] truncate">
                          {subcategoryLabel(svc)}
                          {svc.description ? ` · ${svc.description}` : ''}
                          {svc.is_monthly ? ' · /mo' : ''}
                          {svc.is_from ? ' · from' : ''}
                        </p>
                      </div>
                      <span className="text-[13px] font-medium text-[#A601F1] shrink-0">
                        {svc.price === 0 ? 'Free' : `$${Math.round(svc.price).toLocaleString('en-AU')}${svc.is_monthly ? '/mo' : ''}`}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => { setEditId(svc.id); setEditData({}); setShowAdd(false); }}
                          className="px-2.5 py-1 text-[11px] bg-[rgba(29,46,86,0.07)] text-[#555] rounded-[5px] border-none cursor-pointer hover:bg-[rgba(29,46,86,0.12)]">
                          Edit
                        </button>
                        <button onClick={() => deleteService(svc.id)}
                          className="px-2.5 py-1 text-[11px] bg-[rgba(229,57,53,0.08)] text-[#c62828] rounded-[5px] border-none cursor-pointer hover:bg-[rgba(229,57,53,0.15)]">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === 'categories' && (
          <>
            <p className="text-[12px] text-[#888] mb-3">
              These are the extra service categories (Process Automation, SEO, etc.). Website Packages, Add-ons and Maintenance Plans are fixed.
            </p>

            {/* Add category form */}
            <div className="pnl mb-4">
              <p className="text-[13px] font-medium text-[#1D2E56] mb-3">Add new category</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input className={inp} placeholder="ID (e.g. hosting)" value={newCat.id}
                  onChange={e => setNewCat(c => ({ ...c, id: e.target.value }))} />
                <input className={inp} placeholder="Label (e.g. Hosting Services)" value={newCat.label}
                  onChange={e => setNewCat(c => ({ ...c, label: e.target.value }))} />
                <input className={inp} placeholder="Icon emoji (e.g. 🖥️)" value={newCat.icon}
                  onChange={e => setNewCat(c => ({ ...c, icon: e.target.value }))} />
              </div>
              <button onClick={addCategory} disabled={!newCat.id.trim() || !newCat.label.trim()}
                className="px-4 py-1.5 bg-[#A601F1] text-white text-[12px] rounded-[7px] border-none cursor-pointer hover:bg-[#8e00cc] disabled:opacity-50">
                Add category
              </button>
            </div>

            {/* Categories list */}
            <div className="pnl p-0 overflow-hidden">
              {categories.map(cat => (
                <div key={cat.id} className="border-b border-[rgba(29,46,86,0.07)] last:border-0">
                  {editCatId === cat.id ? (
                    <div className="p-3 bg-[rgba(166,1,241,0.03)]">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input className={`${inp} bg-[rgba(29,46,86,0.05)]`} value={cat.id} disabled />
                        <input className={inp} placeholder="Label" value={editCatData.label ?? cat.label}
                          onChange={e => setEditCatData(d => ({ ...d, label: e.target.value }))} />
                        <input className={inp} placeholder="Icon" value={editCatData.icon ?? cat.icon}
                          onChange={e => setEditCatData(d => ({ ...d, icon: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveCatEdit(cat.id)}
                          className="px-3 py-1 bg-[#A601F1] text-white text-[11px] rounded-[6px] border-none cursor-pointer">
                          Save
                        </button>
                        <button onClick={() => { setEditCatId(null); setEditCatData({}); }}
                          className="px-3 py-1 bg-[rgba(29,46,86,0.07)] text-[#666] text-[11px] rounded-[6px] border-none cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <span className="text-[18px]">{cat.icon}</span>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-[#1D2E56]">{cat.label}</p>
                        <p className="text-[11px] text-[#aaa]">
                          ID: {cat.id} · {services.filter(s => s.subcategory === cat.id).length} services
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditCatId(cat.id); setEditCatData({}); }}
                          className="px-2.5 py-1 text-[11px] bg-[rgba(29,46,86,0.07)] text-[#555] rounded-[5px] border-none cursor-pointer hover:bg-[rgba(29,46,86,0.12)]">
                          Edit
                        </button>
                        <button onClick={() => deleteCat(cat.id)}
                          className="px-2.5 py-1 text-[11px] bg-[rgba(229,57,53,0.08)] text-[#c62828] rounded-[5px] border-none cursor-pointer hover:bg-[rgba(229,57,53,0.15)]">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
