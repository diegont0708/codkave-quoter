'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = locale === 'en' ? 'es' : 'en';
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white/90 transition-colors border border-white/20 rounded px-2 py-0.5"
    >
      <span className={locale === 'en' ? 'text-white font-medium' : ''}>EN</span>
      <span className="text-white/30">|</span>
      <span className={locale === 'es' ? 'text-white font-medium' : ''}>ES</span>
    </button>
  );
}
