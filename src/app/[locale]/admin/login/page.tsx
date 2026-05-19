'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const t = useTranslations('admin.login');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(t('invalidCredentials'));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin/dashboard`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col">
      <header className="bg-[#1D2E56] px-5 py-4 flex items-center justify-between">
        <p className="text-[21px] font-medium text-white">{t('title')}</p>
        <span className="text-[12px] text-[#36A9E1]/80">{t('subtitle')}</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="pnl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-[34px] h-[34px] rounded-full bg-[rgba(166,1,241,0.12)] flex items-center justify-center text-[17px]">🔒</div>
              <p className="text-[15px] font-medium text-[#1D2E56]">{t('cardTitle')}</p>
            </div>
            <p className="text-[13px] text-[#666] mb-3">{t('cardDesc')}</p>

            <form onSubmit={handleSubmit}>
              <input
                className="ck-input"
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <input
                className="ck-input"
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-[12px] text-[#e53935] mb-2">{error}</p>}
              <div className="flex gap-2 mt-1">
                <Link href={`/${locale}`}
                  className="flex-1 py-2 rounded-[7px] border border-[rgba(29,46,86,0.2)] bg-white text-[#1D2E56] text-[13px] text-center cursor-pointer hover:bg-[#f4f6fb] transition-colors">
                  {t('cancel')}
                </Link>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-[7px] border-none bg-[#A601F1] text-white text-[13px] font-medium cursor-pointer hover:bg-[#8e00cc] transition-colors disabled:opacity-60">
                  {loading ? '...' : t('signIn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
