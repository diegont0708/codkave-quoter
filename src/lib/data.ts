import type { Package, Addon, MaintenancePlan, ExtraCategory, PromoCode } from '@/types/quoter';

export const PACKAGES: Package[] = [
  {
    id: 'exp',
    name: 'Express',
    description: 'Fast online presence. AI-powered.',
    price: 599,
    deliveryTime: '48–72 hours',
    maintenanceTier: 'ess',
  },
  {
    id: 'str',
    name: 'Starter',
    description: 'Small businesses starting their digital journey.',
    price: 1800,
    deliveryTime: '~3 business days',
    maintenanceTier: 'ess',
  },
  {
    id: 'biz',
    name: 'Business',
    description: 'Established businesses ready to grow online.',
    price: 3200,
    deliveryTime: '~5 business days',
    maintenanceTier: 'std',
    isPopular: true,
  },
  {
    id: 'eco',
    name: 'E-Commerce',
    description: 'Professional WooCommerce store.',
    price: 5500,
    deliveryTime: '~8 business days',
    maintenanceTier: 'prm',
  },
];

export const ADDONS: Addon[] = [
  { id: 'a1', name: 'Blog section setup', price: 299 },
  { id: 'a2', name: 'Gallery / Portfolio', price: 199 },
  { id: 'a3', name: 'Booking system', price: 349 },
  { id: 'a4', name: 'Online payments', price: 399 },
  { id: 'a5', name: 'Extra page (individual)', price: 199 },
  { id: 'a6', name: 'Extra 5 pages (bundle)', price: 799 },
  { id: 'a7', name: 'Bilingual site (EN + ES)', price: 349 },
  { id: 'a8', name: 'SEO advanced setup', price: 199 },
  { id: 'a9', name: 'Newsletter integration', price: 149 },
  { id: 'a10', name: 'Social media setup', price: 99 },
  { id: 'a11', name: 'Logo design (basic)', price: 249 },
  { id: 'a12', name: 'Business card design', price: 99 },
  { id: 'a13', name: 'Domain registration', price: 49 },
  { id: 'a14', name: 'Content writing (per page)', price: 99 },
  { id: 'a15', name: 'Stock photos (up to 15)', price: 79 },
];

export const MAINTENANCE: MaintenancePlan[] = [
  { id: 'ess', name: 'Essential', description: 'Express & Starter sites', price: 49 },
  { id: 'std', name: 'Standard', description: 'Business sites', price: 119 },
  { id: 'prm', name: 'Premium', description: 'E-Commerce & advanced', price: 199 },
];

export const EXTRA_CATEGORIES: ExtraCategory[] = [
  {
    label: 'Process Automation',
    icon: '⚙️',
    items: [
      { id: 'p1', name: 'Volunteer / staff selection automation', description: 'JotForm + Google Drive + task assignment', price: 799, isFrom: true },
      { id: 'p2', name: 'Electronic signature workflow', description: 'Document generation + e-sign integration', price: 599, isFrom: true },
      { id: 'p3', name: 'Multi-form connected system', description: 'Conditional logic + automated notifications', price: 499, isFrom: true },
      { id: 'p4', name: 'Full suite for NGO / foundation', description: 'Registration to assignment to docs to signature', price: 1500, isFrom: true },
      { id: 'p5', name: 'Business process automation', description: 'HR, sales, client onboarding workflows', price: 1200, isFrom: true },
      { id: 'p6', name: 'Monthly automation support', description: 'Adjustments, improvements & monitoring', price: 99, isFrom: true, isMonthly: true },
    ],
  },
  {
    label: 'SEO & Local Visibility',
    icon: '🔍',
    items: [
      { id: 's1', name: 'Google Business Profile setup', description: 'Get found on Google Maps & local search', price: 199 },
      { id: 's2', name: 'Website SEO audit + report', description: 'Full analysis with actionable recommendations', price: 299 },
      { id: 's3', name: 'Local SEO Melbourne (monthly)', description: 'Ongoing optimisation + monthly reports', price: 299, isMonthly: true },
      { id: 's4', name: 'Google Analytics + Search Console', description: 'Full setup + dashboard configuration', price: 149 },
    ],
  },
  {
    label: 'Graphic Design & Branding',
    icon: '🎨',
    items: [
      { id: 'g1', name: 'Logo design (basic)', description: '3 concepts + final files (PNG, SVG)', price: 249 },
      { id: 'g2', name: 'Business card design', description: 'Print-ready PDF', price: 99 },
      { id: 'g3', name: 'Flyer / promotional material', description: 'For social media or print', price: 129 },
      { id: 'g4', name: 'Basic brand kit', description: 'Logo + colours + typography + usage guide', price: 499 },
    ],
  },
  {
    label: 'Content & Copywriting',
    icon: '✏️',
    items: [
      { id: 'c1', name: 'Website copywriting (5 pages)', description: 'English or Spanish', price: 399 },
      { id: 'c2', name: 'SEO blog article (per article)', description: '800-1,200 words, keyword optimised', price: 149 },
      { id: 'c3', name: 'Monthly blog pack (4 articles)', description: 'Strategy + writing + publishing', price: 449, isMonthly: true },
      { id: 'c4', name: 'Social media content (monthly)', description: '12 posts in English + Spanish', price: 299, isMonthly: true },
    ],
  },
  {
    label: 'Consulting & Training',
    icon: '🎓',
    items: [
      { id: 'q1', name: 'Free strategy session', description: '30 min call, no commitment required', price: 0 },
      { id: 'q2', name: 'Digital consulting (per hour)', description: 'Web strategy, SEO, online presence', price: 120 },
      { id: 'q3', name: 'WordPress training session', description: '1h — learn to manage your own website', price: 149 },
      { id: 'q4', name: 'Website audit report', description: 'SEO, speed, UX and conversion analysis', price: 199 },
    ],
  },
];

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  { id: '1', code: 'WELCOME10', type: 'percent', value: 10, active: true, note: 'New clients' },
  { id: '2', code: 'CK15', type: 'percent', value: 15, active: true, note: 'Standard negotiation' },
  { id: '3', code: 'CK20', type: 'percent', value: 20, active: true, note: 'Max standard discount' },
  { id: '4', code: 'VIP25', type: 'percent', value: 25, active: false, note: 'VIP only' },
  { id: '5', code: 'REF200', type: 'fixed', value: 200, active: true, note: 'Referral $200 off' },
  { id: '6', code: 'REF300', type: 'fixed', value: 300, active: true, note: 'Referral $300 off' },
  { id: '7', code: 'LANZAMIENTO', type: 'percent', value: 12, active: true, note: 'Launch promo' },
];

export function findExtraItem(id: string) {
  for (const cat of EXTRA_CATEGORIES) {
    const item = cat.items.find(i => i.id === id);
    if (item) return item;
  }
  return null;
}
