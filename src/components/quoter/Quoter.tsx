'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PACKAGES, ADDONS, MAINTENANCE, EXTRA_CATEGORIES } from '@/lib/data';
import { calcQuote, getLineItems, calcPayments, formatAUD, formatDate, formatDateTime } from '@/lib/calc';
import type { QuoteState, PromoCode } from '@/types/quoter';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface QuoterProps {
  promoCodes: PromoCode[];
}

export default function Quoter({ promoCodes }: QuoterProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [state, setState] = useState<QuoteState>({
    packageId: null,
    addonIds: new Set(),
    maintenanceId: null,
    extraIds: new Set(),
    paymentPlan: 'full',
    instalmentMonths: 3,
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    promoCode: null,
    promoInput: '',
    promoError: '',
  });

  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // ─── Derived state ──────────────────────────────────────────────────────────
  const calc = calcQuote(state);
  const items = getLineItems(state);
  const payments = calcPayments(calc.net, state.instalmentMonths);
  const hasItems = items.length > 0;
  const canSend = hasItems && !!state.clientEmail;
  const hasEstimated = items.some(i => i.isEstimated);
  const recommendedMntId = state.packageId
    ? (PACKAGES.find(p => p.id === state.packageId)?.maintenanceTier ?? null)
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

  // ─── PDF Generation ─────────────────────────────────────────────────────────
  const generatePDF = async () => {
    if (!hasItems) return;

    // Load logo as base64 so it renders correctly inside the iframe
    const logoDataUrl = await fetch('/Logotipo Codkave.png')
      .then(r => r.blob())
      .then(b => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      })).catch(() => '');

    const { net, discount } = calc;
    const { deposit35, payment35, balance, financed, instalment } = payments;
    const now = new Date();
    const exp = new Date(now.getTime() + 48 * 3_600_000);
    const otItems = items.filter(i => !i.isMonthly);
    const moItems = items.filter(i => i.isMonthly);

    const fAUD = formatAUD;
    const row = (l: string, v: string, alt?: boolean) =>
      `<tr style="background:${alt ? '#f7f8fb' : '#fff'}"><td style="padding:9px 14px;font-family:Arial,sans-serif;font-size:13px;color:#666">  ${l}</td><td style="padding:9px 14px;font-family:Arial,sans-serif;font-size:13px;text-align:right;font-weight:600;color:#1D2E56">${v}</td></tr>`;
    const sep = '<tr><td colspan="2" style="padding:0;height:1px;background:#e8ecf4;font-size:0;line-height:0"></td></tr>';
    const rate = state.instalmentMonths === 3 ? 5 : 8;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:0;background:#fff;font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}</style>
</head><body>
<table style="width:595px;background:#fff">
<tr><td style="background:#1D2E56;padding:24px 40px">
  <table><tr>
    <td style="vertical-align:top">
      ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:44px;display:block;margin-bottom:6px" />` : `<span style="font-family:'Arial Black',Arial,sans-serif;font-size:26px;font-weight:900;color:#A601F1;letter-spacing:-1px">CodKave</span>`}<br>
      <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:400;color:rgba(54,169,225,.85)">Web Design Agency &nbsp;·&nbsp; ABN 54 850 905 499 &nbsp;·&nbsp; Australia</span>
    </td>
    <td style="text-align:right;vertical-align:top;padding-left:20px;white-space:nowrap">
      <span style="font-size:12px;color:rgba(255,255,255,.65);font-family:Arial,sans-serif">Date: ${formatDate(now)}</span><br>
      <span style="font-size:12px;color:rgba(255,255,255,.65);font-family:Arial,sans-serif">Expires: ${formatDateTime(exp)}</span><br>
      <span style="display:inline-block;margin-top:6px;background:rgba(229,57,53,.35);color:#ffbbbb;font-size:10px;padding:2px 8px;font-family:Arial,sans-serif">Valid 48 hours only</span>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:22px 40px 0">
  <p style="font-size:20px;font-weight:700;margin:0 0 4px;color:#1D2E56;font-family:Arial,sans-serif">Service proposal</p>
  ${state.clientName ? `<p style="font-size:13px;margin:0 0 2px;color:#1D2E56;font-family:Arial,sans-serif">Prepared for: <strong>${state.clientName}</strong>${state.clientCompany ? ' &nbsp;·&nbsp; ' + state.clientCompany : ''}</p>` : ''}
  ${state.clientEmail ? `<p style="font-size:12px;color:#888;margin:0;font-family:Arial,sans-serif">${state.clientEmail}</p>` : ''}
</td></tr>
${otItems.length ? `
<tr><td style="padding:20px 40px 0">
  <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#36A9E1;margin:0 0 8px;font-family:Arial,sans-serif">Services</p>
  <table style="width:100%">
    <tr style="background:#1D2E56">
      <th style="padding:9px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif">Service</th>
      <th style="padding:9px 14px;text-align:right;font-size:11px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif">AUD</th>
    </tr>
    ${otItems.map((it, i) => row(it.name + (it.isEstimated ? ' (estimated)' : ''), it.price === 0 ? 'Free' : fAUD(it.price), i % 2 !== 0)).join('')}
    ${discount > 0 ? `<tr style="background:#e8f5e9"><td style="padding:9px 14px;font-family:Arial,sans-serif;font-size:13px;color:#2e7d32;font-weight:500">  Discount applied</td><td style="padding:9px 14px;text-align:right;font-weight:700;color:#2e7d32;font-family:Arial,sans-serif;font-size:13px">-${fAUD(discount)}</td></tr>` : ''}
    <tr style="background:#A601F1"><td style="padding:11px 14px;font-size:14px;font-weight:700;color:#fff;font-family:Arial,sans-serif">  Total (one-time)</td><td style="padding:11px 14px;font-size:16px;font-weight:700;text-align:right;color:#fff;font-family:Arial,sans-serif">${fAUD(net)}</td></tr>
  </table>
</td></tr>` : ''}
${moItems.length ? `
<tr><td style="padding:18px 40px 0">
  <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#36A9E1;margin:0 0 8px;font-family:Arial,sans-serif">Recurring services</p>
  <table style="width:100%">
    ${moItems.map((it, i) => row(it.name, fAUD(it.price) + '/mo', i % 2 !== 0)).join('')}
    <tr style="background:#eef0f7"><td style="padding:9px 14px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#1D2E56">  Monthly total</td><td style="padding:9px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(calc.monthly)}/mo</td></tr>
  </table>
</td></tr>` : ''}
<tr><td style="padding:18px 40px 0">
  <table style="width:100%;background:#f5f3fb;border-left:4px solid #A601F1">
    <tr><td colspan="2" style="padding:14px 14px 8px;font-size:14px;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif">Payment plan</td></tr>
    ${sep}
    ${state.paymentPlan === 'full' ? `
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Contract signing (35%)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(deposit35)}</td></tr>${sep}
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Design review (35%)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(payment35)}</td></tr>${sep}
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Final delivery (30%)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(balance)}</td></tr>${sep}
    <tr style="background:#f5f3fb"><td colspan="2" style="padding:8px 14px;font-family:Arial,sans-serif;font-size:11px;color:#aaa">Full payment &nbsp;·&nbsp; No interest charged</td></tr>
    ` : `
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Contract signing (35%)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(deposit35)}</td></tr>${sep}
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Design review (35%)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(payment35)}</td></tr>${sep}
    <tr style="background:#f5f3fb"><td style="padding:8px 14px;font-family:Arial,sans-serif;font-size:13px;color:#555">  Balance financed (30% + ${rate}% interest)</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#1D2E56;font-family:Arial,sans-serif;font-size:13px">${fAUD(financed)}</td></tr>${sep}
    <tr style="background:#ede8fb"><td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#1D2E56">  Monthly project instalment</td><td style="padding:10px 14px;text-align:right;font-weight:700;color:#A601F1;font-family:Arial,sans-serif;font-size:14px">${fAUD(instalment)}/mo x ${state.instalmentMonths} months</td></tr>
    ${calc.monthly > 0 ? `${sep}<tr style="background:#ede8fb"><td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#1D2E56">  Total monthly direct debit</td><td style="padding:10px 14px;text-align:right;font-weight:700;color:#A601F1;font-family:Arial,sans-serif;font-size:14px">${fAUD(instalment + calc.monthly)}/mo</td></tr>` : ''}${sep}
    <tr style="background:#f5f3fb"><td colspan="2" style="padding:8px 14px;font-family:Arial,sans-serif;font-size:11px;color:#aaa">Automatic debit via GoCardless &nbsp;·&nbsp; Hosted on CodKave servers</td></tr>
    `}
  </table>
</td></tr>
<tr><td style="padding:18px 40px 28px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#bbb;border-top:1px solid #e8ecf4">
  CodKave &nbsp;·&nbsp; ABN 54 850 905 499 &nbsp;·&nbsp; codkave.com.au &nbsp;·&nbsp; This quote expires ${formatDateTime(exp)}
</td></tr>
</table></body></html>`;

    // Use iframe so the full HTML document (with <head>/<style>) renders correctly
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:620px;height:900px;border:none;visibility:hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); return; }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    await new Promise(r => setTimeout(r, 400));

    const target = iframeDoc.body?.firstElementChild as HTMLElement | null;
    if (!target) { document.body.removeChild(iframe); return; }

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(target, {
      scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 620,
    });

    document.body.removeChild(iframe);

    if (!canvas || canvas.width === 0) return;

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.99);

    let heightLeft = imgH;
    let pos = 0;
    pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 0) {
      pos -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
      heightLeft -= pageH;
    }

    const slug = (state.clientName || 'quote').replace(/\s+/g, '-').toLowerCase();
    pdf.save(`CodKave-${slug}-${now.toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Send to Client ──────────────────────────────────────────────────────────
  const sendToClient = async () => {
    if (!canSend || sendStatus === 'sending') return;
    setSendStatus('sending');

    const { net, discount, monthly } = calc;
    const { deposit35, payment35, balance, instalment } = payments;

    const payload = {
      client: { name: state.clientName, company: state.clientCompany, email: state.clientEmail },
      quote: {
        items: items.map(i => ({ name: i.name, price: i.price, recurring: i.isMonthly, estimated: i.isEstimated })),
        subtotal: net + discount,
        discount,
        total_onetime: net,
        total_monthly: monthly,
        payment_plan: state.paymentPlan,
        instalment_months: state.paymentPlan === 'inst' ? state.instalmentMonths : null,
        instalment_amount: state.paymentPlan === 'inst' ? instalment : null,
        deposit_35: deposit35,
        payment_35: payment35,
        balance,
        promo_code: state.promoCode?.code ?? null,
      },
      sent_at: new Date().toISOString(),
    };

    try {
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
            <input className="ck-input !mb-0" placeholder={t('client.email')} type="email" value={state.clientEmail}
              onChange={e => setState(s => ({ ...s, clientEmail: e.target.value }))} />
          </div>

          {/* Packages */}
          <p className="ck-section-label">💻 {t('packages.sectionTitle')}</p>
          <div className="grid grid-cols-2 gap-[7px] mb-1">
            {PACKAGES.map(pkg => {
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
            {ADDONS.map(addon => {
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
            {MAINTENANCE.map(mnt => {
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
          {EXTRA_CATEGORIES.map(cat => (
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
                    <PayRow label={t('summary.finalDelivery')} value={formatAUD(payments.balance)} last />
                  </>
                ) : (
                  <>
                    <PayRow label={t('summary.contractSigning')} value={formatAUD(payments.deposit35)} />
                    <PayRow label={t('summary.designReview')} value={formatAUD(payments.payment35)} />
                    <PayRow
                      label={t('summary.balanceFinanced', { rate: state.instalmentMonths === 3 ? '5' : '8' })}
                      value={formatAUD(payments.financed)}
                    />
                    <PayRow label={t('summary.monthlyInstalment')} value={`${formatAUD(payments.instalment)}/mo x ${state.instalmentMonths}`} bold accent />
                    {calc.monthly > 0 && (
                      <>
                        <PayRow label={t('summary.recurring')} value={`${formatAUD(calc.monthly)}/mo`} />
                        <PayRow label={t('summary.totalMonthly')} value={`${formatAUD(payments.instalment + calc.monthly)}/mo`} bold accent last />
                      </>
                    )}
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
          <button onClick={generatePDF} disabled={!hasItems}
            className={`w-full rounded-[9px] py-3 text-[13px] font-medium mb-1.5 flex items-center justify-center gap-1.5 transition-all border-none
              ${hasItems
                ? 'bg-gradient-to-br from-[#A601F1] to-[#7a00b8] text-white cursor-pointer shadow-[0_4px_12px_rgba(166,1,241,0.3)]'
                : 'bg-[rgba(29,46,86,0.09)] text-[#bbb] cursor-default'}`}>
            📄 {t('actions.downloadPdf')}
          </button>

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

          {!state.clientEmail && hasItems && (
            <p className="text-[11px] text-[#e57373] text-center mb-1.5">{t('actions.emailRequired')}</p>
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
