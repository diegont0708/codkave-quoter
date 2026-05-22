'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { calcQuote, getLineItems, calcPayments, formatAUD, formatDate, formatDateTime } from '@/lib/calc';
import type { QuoteState, PromoCode, Package, Addon, MaintenancePlan, ExtraCategory } from '@/types/quoter';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface QuoterProps {
  promoCodes:      PromoCode[];
  packages:        Package[];
  addons:          Addon[];
  maintenance:     MaintenancePlan[];
  extraCategories: ExtraCategory[];
}

export default function Quoter({ promoCodes, packages, addons, maintenance, extraCategories }: QuoterProps) {
  const serviceData = { packages, addons, maintenance, extraItems: extraCategories.flatMap(c => c.items) };
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [state, setState] = useState<QuoteState>({
    packageId: null,
    addonIds: new Set(),
    maintenanceId: 'ess',
    extraIds: new Set(),
    paymentPlan: 'full',
    instalmentMonths: 3,
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    clientAbn: '',
    clientAddress: '',
    projectName: '',
    timeline: 'To be confirmed',
    notes: '',
    promoCode: null,
    promoInput: '',
    promoError: '',
  });

  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError = emailTouched && !!state.clientEmail && !isValidEmail(state.clientEmail);

  // ─── Derived state ──────────────────────────────────────────────────────────
  const calc = calcQuote(state, serviceData);
  const items = getLineItems(state, serviceData);
  const payments = calcPayments(calc.net, state.instalmentMonths);
  const hasItems = items.length > 0;
  const canSend = hasItems && !!state.clientEmail && isValidEmail(state.clientEmail);
  const hasEstimated = items.some(i => i.isEstimated);
  const recommendedMntId = state.packageId
    ? (packages.find(p => p.id === state.packageId)?.maintenanceTier ?? null)
    : null;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const togglePackage = (id: string) =>
    setState(s => ({ ...s, packageId: s.packageId === id ? null : id }));

  const toggleAddon = (id: string) =>
    setState(s => {
      const addonIds = new Set(s.addonIds);
      if (addonIds.has(id)) addonIds.delete(id); else addonIds.add(id);
      return { ...s, addonIds };
    });

  const toggleMaintenance = (id: string) =>
    setState(s => ({ ...s, maintenanceId: s.maintenanceId === id ? null : id }));

  const toggleExtra = (id: string) =>
    setState(s => {
      const extraIds = new Set(s.extraIds);
      if (extraIds.has(id)) extraIds.delete(id); else extraIds.add(id);
      return { ...s, extraIds };
    });

  const applyPromo = () => {
    const code = state.promoInput.trim().toUpperCase();
    if (!code) { setState(s => ({ ...s, promoError: t('promo.emptyCode') })); return; }
    const found = promoCodes.find(c => c.code === code && c.active);
    if (found) {
      setState(s => ({ ...s, promoCode: found, promoError: '' }));
    } else {
      setState(s => ({ ...s, promoCode: null, promoError: t('promo.invalidCode') }));
    }
  };

  // ─── Send to Client ──────────────────────────────────────────────────────────
  const sendToClient = async () => {
    if (!canSend || sendStatus === 'sending') return;
    setSendStatus('sending');

    const { net, discount, monthly } = calc;
    const { deposit35, payment35, balance, instalment } = payments;
    const now = new Date();
    const quoteNumber = `CK-${String(now.getFullYear()).slice(2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

    try {
      const payload = {
        channel: 'presencial',
        quote_number: quoteNumber,
        client: {
          name:    state.clientName,
          company: state.clientCompany,
          email:   state.clientEmail,
          phone:   state.clientPhone,
          abn:     state.clientAbn,
          address: state.clientAddress,
          notes:   state.notes ?? '',
        },
        quote: {
          items: items.map(i => ({ name: i.name, price: i.price, recurring: i.isMonthly, estimated: i.isEstimated })),
          timeline:          state.timeline,
          subtotal:          net + discount,
          discount,
          total_onetime:     net,
          total_monthly:     monthly,
          payment_plan:      state.paymentPlan,
          deposit_35:        deposit35,
          payment_35:        payment35,
          balance_30:        balance,
          instalment_months: state.paymentPlan === 'inst' ? state.instalmentMonths : null,
          instalment_amount: state.paymentPlan === 'inst' ? instalment : null,
          promo_code:        state.promoCode?.code ?? null,
        },
        sent_at: new Date().toISOString(),
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSendStatus('sent');
        setTimeout(() => setSendStatus('idle'), 3000);
      } else throw new Error();
    } catch {
      setSendStatus('error');
      setTimeout(() => setSendStatus('idle'), 3000);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-8 px-3 sm:px-4 max-w-[1100px] mx-auto">

      {/* ── Header ── */}
      <header className="bg-[#1D2E56] rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[21px] font-medium text-white mb-0.5 leading-tight">{t('header.title')}</h1>
          <p className="text-[12px] text-[#36A9E1]/90 m-0">{t('header.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[11px] text-white/45">{t('header.abn')}</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href={`/${locale}/admin/login`} className="text-[11px] text-[#36A9E1]/80 hover:text-[#36A9E1] transition-colors flex items-center gap-1">
              🔒 {t('header.adminLink')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div className="flex gap-4 items-start">

        {/* ──── LEFT PANEL ──── */}
        <div className="flex-1 min-w-0">

          {/* Client details */}
          <div className="pnl mb-1">
            <p className="text-[13px] font-medium mb-2.5 text-[#1D2E56]">{t('client.sectionTitle')}</p>
            <input className="ck-input" placeholder={t('client.name')} value={state.clientName}
              onChange={e => setState(s => ({ ...s, clientName: e.target.value }))} />
            <input className="ck-input" placeholder={t('client.company')} value={state.clientCompany}
              onChange={e => setState(s => ({ ...s, clientCompany: e.target.value }))} />
            <input className="ck-input" placeholder={t('client.phone')} type="tel" value={state.clientPhone}
              onChange={e => setState(s => ({ ...s, clientPhone: e.target.value }))} />
            <input className="ck-input" placeholder={t('client.abn')} value={state.clientAbn}
              onChange={e => setState(s => ({ ...s, clientAbn: e.target.value }))} />
            <input className="ck-input" placeholder={t('client.address')} value={state.clientAddress}
              onChange={e => setState(s => ({ ...s, clientAddress: e.target.value }))} />
            <input
              className={`ck-input ${emailError ? '!border-[#e57373] !mb-1' : '!mb-0'}`}
              placeholder={t('client.email')}
              type="email"
              value={state.clientEmail}
              onChange={e => {
                setState(s => ({ ...s, clientEmail: e.target.value }));
                if (emailTouched) setEmailTouched(true);
              }}
              onBlur={() => { if (state.clientEmail) setEmailTouched(true); }}
            />
            {emailError && (
              <p className="text-[11px] text-[#e57373] mb-2 px-0.5">{t('client.invalidEmail')}</p>
            )}
          </div>

          {/* Project details */}
          <div className="pnl mb-1">
            <p className="text-[13px] font-medium mb-2.5 text-[#1D2E56]">{t('project.sectionTitle')}</p>
            <input className="ck-input" placeholder={t('project.name')} value={state.projectName}
              onChange={e => setState(s => ({ ...s, projectName: e.target.value }))} />
            <div>
              <p className="text-[11px] text-[#888] mb-1 px-0.5">{t('project.timeline')}</p>
            <select className="ck-input !mb-0 bg-white" value={state.timeline}
              onChange={e => setState(s => ({ ...s, timeline: e.target.value }))}>
              <option value="To be confirmed">To be confirmed</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="2-4 weeks">2-4 weeks</option>
              <option value="4-6 weeks">4-6 weeks</option>
              <option value="6-8 weeks">6-8 weeks</option>
              <option value="8-12 weeks">8-12 weeks</option>
              <option value="3-6 months">3-6 months</option>
            </select>
            </div>
            <textarea className="ck-input !mb-0 resize-none" rows={3} placeholder={t('project.notes')} value={state.notes}
              onChange={e => setState(s => ({ ...s, notes: e.target.value }))} />
          </div>

          {/* Packages */}
          <p className="ck-section-label">💻 {t('packages.sectionTitle')}</p>
          <div className="grid grid-cols-2 gap-[7px] mb-1">
            {packages.map(pkg => {
              const on = state.packageId === pkg.id;
              return (
                <button key={pkg.id} onClick={() => togglePackage(pkg.id)}
                  className={`ck-pkg-card text-left w-full ${on ? 'active' : ''}`}>
                  {pkg.isPopular
                    ? <span className="ck-tag bg-[#A601F1] text-white mb-1.5 block">{t('packages.mostPopular')}</span>
                    : <div className="h-[22px]" />}
                  <p className="text-[13px] font-medium mb-0.5 text-[#1D2E56]">{pkg.name}</p>
                  <p className="text-[11px] text-[#666] mb-1.5 leading-[1.4]">{pkg.description}</p>
                  <p className="text-[19px] font-medium text-[#A601F1] mb-0.5">{formatAUD(pkg.price)}</p>
                  <p className="text-[11px] text-[#888]">{pkg.deliveryTime}</p>
                </button>
              );
            })}
          </div>

          {/* Add-ons */}
          <p className="ck-section-label">🧩 {t('addons.sectionTitle')}</p>
          <div className="grid grid-cols-2 gap-1 mb-1">
            {addons.map(addon => {
              const on = state.addonIds.has(addon.id);
              return (
                <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                  className={`ck-row ${on ? 'active' : ''}`}>
                  <div className={`ck-checkbox ${on ? 'checked' : ''}`}>{on ? '✓' : ''}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#1D2E56] leading-[1.3]">{addon.name}</p>
                  </div>
                  <span className="text-[11px] font-medium text-[#A601F1] whitespace-nowrap">+{formatAUD(addon.price)}</span>
                </button>
              );
            })}
          </div>

          {/* Maintenance */}
          <p className="ck-section-label">
            🛡️ {t('maintenance.sectionTitle')}
            <span className="font-normal normal-case text-[10px] ml-1 tracking-normal text-[#36A9E1]">
              ({t('maintenance.optional')})
            </span>
          </p>
          <div className="grid grid-cols-3 gap-[7px] mb-1">
            {maintenance.map(mnt => {
              const on = state.maintenanceId === mnt.id;
              const isRec = mnt.id === recommendedMntId;
              return (
                <button key={mnt.id} onClick={() => toggleMaintenance(mnt.id)}
                  className={`ck-pkg-card text-center w-full ${on ? 'active' : ''}`}>
                  {isRec
                    ? <span className="ck-tag bg-[rgba(54,169,225,0.14)] text-[#1D7EA6] mb-1.5 block">{t('packages.recommended')}</span>
                    : <div className="h-[22px]" />}
                  <p className="text-[12px] font-medium text-[#1D2E56]">{mnt.name}</p>
                  <p className="text-[10px] text-[#888] mb-1.5">{mnt.description}</p>
                  <p className="text-[16px] font-medium text-[#A601F1]">
                    {formatAUD(mnt.price)}<span className="text-[10px] font-normal text-[#888]">/mo</span>
                  </p>
                </button>
              );
            })}
          </div>

          {/* Extra categories */}
          {extraCategories.map(cat => (
            <div key={cat.label}>
              <p className="ck-section-label">{cat.icon} {cat.label}</p>
              {cat.items.map(item => {
                const on = state.extraIds.has(item.id);
                const priceLabel = item.price === 0 ? t('extras.free')
                  : (item.isFrom ? t('extras.from') : '') + formatAUD(item.price) + (item.isMonthly ? '/mo' : '');
                return (
                  <button key={item.id} onClick={() => toggleExtra(item.id)}
                    className={`ck-row w-full ${on ? 'active' : ''}`}>
                    <div className={`ck-checkbox ${on ? 'checked' : ''}`}>{on ? '✓' : ''}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-medium text-[#1D2E56] leading-[1.3]">
                        {item.name}
                        {item.isMonthly && (
                          <span className="ck-tag bg-[rgba(54,169,225,0.1)] text-[#1D7EA6] ml-1 align-middle">
                            {t('extras.monthly')}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#888] mt-0.5 leading-[1.3]">{item.description}</p>
                    </div>
                    <span className="text-[11px] font-medium text-[#A601F1] whitespace-nowrap ml-1.5">{priceLabel}</span>
                  </button>
                );
              })}
              <div className="mb-2.5" />
            </div>
          ))}
        </div>

        {/* ──── RIGHT PANEL ──── */}
        <div className="w-[272px] flex-shrink-0 sticky top-4">

          {/* Total */}
          <div className="bg-[#1D2E56] rounded-xl p-3.5 mb-2.5">
            <p className="text-[11px] text-[#36A9E1]/80 font-medium mb-0.5">{t('summary.oneTimeTotal')}</p>
            <p className="text-[30px] font-medium text-white tracking-tight leading-none mb-0.5">
              {!hasItems ? '—' : formatAUD(calc.net)}
            </p>
            {calc.discount > 0 && (
              <p className="text-[12px] text-[#36A9E1] mt-0.5">
                {t('summary.discountApplied', { amount: formatAUD(calc.discount) })}
              </p>
            )}
            {calc.monthly > 0 && (
              <p className="text-[12px] text-white/55 mt-0.5">
                {t('summary.monthlyRecurring', { amount: formatAUD(calc.monthly) })}
              </p>
            )}
            {hasEstimated && (
              <p className="text-[11px] text-white/35 mt-0.5">{t('summary.estimated')}</p>
            )}
          </div>

          {/* Selected services */}
          <div className="pnl mb-2.5">
            <p className="text-[12px] font-medium text-[#1D2E56] mb-2">{t('summary.selectedServices')}</p>
            {!hasItems ? (
              <p className="text-[12px] text-[#bbb] text-center py-2">{t('summary.noServices')}</p>
            ) : (
              items.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px] mb-1.5 items-start">
                  <span className="text-[#666] flex-1 pr-1.5 leading-[1.4]">{item.name}</span>
                  <span className="font-medium text-[#1D2E56] whitespace-nowrap">
                    {item.price === 0 ? t('extras.free') : formatAUD(item.price) + (item.isMonthly ? '/mo' : '')}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Payment plan */}
          <div className="pnl mb-2.5">
            <p className="text-[12px] font-medium text-[#1D2E56] mb-2">{t('summary.paymentPlan')}</p>
            <div className="flex gap-1.5 mb-2">
              <button className={`ck-plan-btn ${state.paymentPlan === 'full' ? 'active' : ''}`}
                onClick={() => setState(s => ({ ...s, paymentPlan: 'full' }))}>
                {t('summary.btnFull')}
              </button>
              <button className={`ck-plan-btn ${state.paymentPlan === 'inst' ? 'active' : ''}`}
                onClick={() => setState(s => ({ ...s, paymentPlan: 'inst' }))}>
                {t('summary.btnInstalment')}
              </button>
            </div>

            {state.paymentPlan === 'inst' && (
              <div className="flex gap-1.5 mb-2">
                <button className={`ck-plan-btn text-[10px] ${state.instalmentMonths === 3 ? 'active' : ''}`}
                  onClick={() => setState(s => ({ ...s, instalmentMonths: 3 }))}>
                  {t('summary.btn3months')}
                </button>
                <button className={`ck-plan-btn text-[10px] ${state.instalmentMonths === 6 ? 'active' : ''}`}
                  onClick={() => setState(s => ({ ...s, instalmentMonths: 6 }))}>
                  {t('summary.btn6months')}
                </button>
              </div>
            )}

            {calc.net > 0 && (
              <div className="bg-[rgba(29,46,86,0.04)] rounded-[7px] p-2 mt-1">
                {state.paymentPlan === 'full' ? (
                  <>
                    <PayRow label={t('summary.contractSigning')} value={formatAUD(payments.deposit35)} />
                    <PayRow label={t('summary.designReview')} value={formatAUD(payments.payment35)} />
                    <PayRow label={t('summary.finalDelivery')} value={formatAUD(payments.balance)} last={calc.monthly === 0} />
                    {calc.monthly > 0 && (
                      <>
                        <p className="text-[9px] font-bold text-[#A601F1] uppercase tracking-[1.5px] mt-2.5 mb-1">
                          {t('summary.monthlyCharges')}
                        </p>
                        {items.filter(i => i.isMonthly).map(item => (
                          <PayRow key={item.name} label={item.name} value={`${formatAUD(item.price)}/mo`} />
                        ))}
                        <PayRow label={t('summary.totalMonthly')} value={`${formatAUD(calc.monthly)}/mo`} bold accent last />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <PayRow label={t('summary.contractSigning')} value={formatAUD(payments.deposit35)} />
                    <PayRow label={t('summary.designReview')} value={formatAUD(payments.payment35)} last />

                    <p className="text-[9px] font-bold text-[#A601F1] uppercase tracking-[1.5px] mt-2.5 mb-1">
                      {t('summary.monthlyCharges')}
                    </p>

                    <PayRow
                      label={t('summary.financedBalance')}
                      value={formatAUD(payments.instalment * state.instalmentMonths)}
                    />
                    <PayRow
                      label={t('summary.monthlyInstalment')}
                      value={`${formatAUD(payments.instalment)}/mo × ${state.instalmentMonths}`}
                    />
                    {items.filter(i => i.isMonthly).map(item => (
                      <PayRow key={item.name} label={item.name} value={`${formatAUD(item.price)}/mo`} />
                    ))}
                    <PayRow
                      label={t('summary.totalMonthly')}
                      value={`${formatAUD(payments.instalment + calc.monthly)}/mo`}
                      bold accent last
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Promo code */}
          <div className="pnl mb-2.5">
            <p className="text-[12px] font-medium text-[#1D2E56] mb-1.5">{t('promo.sectionTitle')}</p>
            {state.promoCode ? (
              <div className="flex justify-between items-center bg-[#e8f5e9] rounded-[6px] px-3 py-1.5">
                <span className="text-[12px] text-[#2e7d32] font-medium">
                  {t('promo.applied', {
                    discount: state.promoCode.type === 'percent'
                      ? state.promoCode.value + '%'
                      : formatAUD(state.promoCode.value)
                  })}
                </span>
                <button onClick={() => setState(s => ({ ...s, promoCode: null, promoInput: '', promoError: '' }))}
                  className="text-[18px] leading-none text-[#2e7d32] hover:opacity-70">×</button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    className="ck-input !mb-0 pr-[74px] uppercase tracking-[0.05em]"
                    placeholder={t('promo.placeholder')}
                    value={state.promoInput}
                    onChange={e => setState(s => ({ ...s, promoInput: e.target.value.toUpperCase() }))}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  />
                  <button onClick={applyPromo}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#A601F1] text-white border-none rounded-[5px] px-2 py-1 text-[12px] cursor-pointer">
                    {t('promo.apply')}
                  </button>
                </div>
                {state.promoError && <p className="text-[11px] text-[#e53935] mt-1">{state.promoError}</p>}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button onClick={sendToClient} disabled={!canSend || sendStatus === 'sending'}
            className={`w-full rounded-[9px] py-3 text-[13px] font-medium mb-1.5 flex items-center justify-center gap-1.5 transition-all border-none
              ${sendStatus === 'sent' ? 'bg-gradient-to-br from-[#4CAF50] to-[#2e7d32] text-white cursor-default' :
                sendStatus === 'error' ? 'bg-gradient-to-br from-[#e53935] to-[#b71c1c] text-white cursor-pointer' :
                canSend ? 'bg-gradient-to-br from-[#36A9E1] to-[#1a7db5] text-white cursor-pointer shadow-[0_4px_12px_rgba(54,169,225,0.3)]' :
                'bg-[rgba(29,46,86,0.09)] text-[#bbb] cursor-default'}`}>
            {sendStatus === 'sending' ? '⏳ ' + t('actions.sending') :
             sendStatus === 'sent' ? '✓ ' + t('actions.sent') :
             sendStatus === 'error' ? '⚠ ' + t('actions.error') :
             '📤 ' + t('actions.sendToClient')}
          </button>

          {hasItems && !canSend && (
            <p className="text-[11px] text-[#e57373] text-center mb-1.5">
              {!state.clientEmail ? t('actions.emailRequired') : t('client.invalidEmail')}
            </p>
          )}

          <p className="text-[11px] text-[#bbb] text-center mt-1">{t('actions.validity')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────
function PayRow({
  label, value, bold, accent, last,
}: {
  label: string; value: string; bold?: boolean; accent?: boolean; last?: boolean;
}) {
  return (
    <div className={`flex justify-between text-[12px] py-[5px] ${!last ? 'border-b border-[rgba(29,46,86,0.08)]' : ''}`}>
      <span className={bold ? 'font-medium text-[#1D2E56]' : 'text-[#666]'}>{label}</span>
      <span className={`font-medium ${accent ? 'text-[#A601F1]' : 'text-[#1D2E56]'}`}>{value}</span>
    </div>
  );
}
