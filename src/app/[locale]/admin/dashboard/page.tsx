import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import AdminNav from '@/components/admin/AdminNav';
import { formatAUD, formatDateTime } from '@/lib/calc';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('admin');
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <AdminNav locale={locale} active="quotes" />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-[21px] font-medium text-[#1D2E56]">{t('dashboard.title')}</h1>
          <p className="text-[13px] text-[#888]">{t('dashboard.subtitle')}</p>
        </div>

        <div className="pnl">
          {!quotes?.length ? (
            <p className="text-[13px] text-[#aaa] text-center py-8">{t('dashboard.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[rgba(29,46,86,0.08)]">
                    <th className="text-left pb-2 font-medium text-[#888] text-[11px] uppercase tracking-wider">{t('dashboard.client')}</th>
                    <th className="text-right pb-2 font-medium text-[#888] text-[11px] uppercase tracking-wider">{t('dashboard.total')}</th>
                    <th className="text-center pb-2 font-medium text-[#888] text-[11px] uppercase tracking-wider">{t('dashboard.status')}</th>
                    <th className="text-right pb-2 font-medium text-[#888] text-[11px] uppercase tracking-wider">{t('dashboard.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} className="border-b border-[rgba(29,46,86,0.05)] hover:bg-[rgba(166,1,241,0.02)]">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-[#1D2E56]">{q.client_name || '—'}</p>
                        <p className="text-[11px] text-[#888]">{q.client_email}</p>
                        {q.client_company && <p className="text-[11px] text-[#aaa]">{q.client_company}</p>}
                      </td>
                      <td className="py-3 text-right">
                        <p className="font-medium text-[#1D2E56]">{formatAUD(q.total_onetime)}</p>
                        {q.total_monthly > 0 && <p className="text-[11px] text-[#888]">+{formatAUD(q.total_monthly)}/mo</p>}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`ck-tag ${q.status === 'sent' ? 'bg-[rgba(54,169,225,0.12)] text-[#1D7EA6]' : 'bg-[rgba(29,46,86,0.07)] text-[#888]'}`}>
                          {q.status === 'sent' ? t('dashboard.sent') : t('dashboard.draft')}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[11px] text-[#888]">
                        {formatDateTime(new Date(q.created_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
