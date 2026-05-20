export type MaintenanceTier = 'ess' | 'std' | 'prm';
export type PaymentPlan = 'full' | 'inst';
export type PromoType = 'percent' | 'fixed';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: string;
  maintenanceTier: MaintenanceTier;
  isPopular?: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface MaintenancePlan {
  id: MaintenanceTier;
  name: string;
  description: string;
  price: number;
}

export interface ExtraItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isMonthly?: boolean;
  isFrom?: boolean;
}

export interface ExtraCategory {
  label: string;
  icon: string;
  items: ExtraItem[];
}

export interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  active: boolean;
  note?: string;
}

export interface QuoteState {
  packageId: string | null;
  addonIds: Set<string>;
  maintenanceId: string | null;
  extraIds: Set<string>;
  paymentPlan: PaymentPlan;
  instalmentMonths: 3 | 6;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAbn: string;
  clientAddress: string;
  projectName: string;
  timeline: string;
  notes: string;
  promoCode: PromoCode | null;
  promoInput: string;
  promoError: string;
}

export interface CalcResult {
  oneTime: number;
  monthly: number;
  discount: number;
  net: number;
}

export interface QuoteLineItem {
  name: string;
  price: number;
  isMonthly: boolean;
  isEstimated: boolean;
}

export interface QuotePayload {
  client: {
    name: string;
    company: string;
    email: string;
  };
  quote: {
    items: Array<{ name: string; price: number; recurring: boolean; estimated: boolean }>;
    subtotal: number;
    discount: number;
    total_onetime: number;
    total_monthly: number;
    payment_plan: PaymentPlan;
    instalment_months: number | null;
    instalment_amount: number | null;
    deposit_35: number;
    payment_35: number;
    balance: number;
    promo_code: string | null;
  };
  sent_at: string;
}
