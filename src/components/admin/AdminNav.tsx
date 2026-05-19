'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminNavProps {
  locale: string;
  active: 'quotes' | 'codes' | 'prices';
}

export default function AdminNav({ locale, active }: AdminNavProps) {
  const t = useTranslations('admin.nav');
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  const navItem = (href: string, label: string, key: string) => (
    <Link href={href}
      className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors
        ${active === key
          ? 'bg-[rgba(166,1,241,0.15)] text-[#A601F1]'
          : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
      {label}
    </Link>
  );

  return (
    <header className="bg-[#1D2E56] px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span className="text-white font-medium mr-3">CodKave Admin</span>
        {navItem(`/${locale}/admin/dashboard`, t('quotes'), 'quotes')}
        {navItem(`/${locale}/admin/codes`, t('codes'), 'codes')}
        {navItem(`/${locale}/admin/prices`, t('prices'), 'prices')}
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/${locale}`} className="text-[11px] text-[#36A9E1]/80 hover:text-[#36A9E1] transition-colors">
          ← {t('back')}
        </Link>
        <button onClick={signOut}
          className="text-[11px] text-white/50 hover:text-white/80 transition-colors border border-white/20 rounded px-2 py-0.5 cursor-pointer bg-transparent">
          {t('signOut')}
        </button>
      </div>
    </header>
  );
}
