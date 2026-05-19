import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROMO_CODES } from '@/lib/data';
import Quoter from '@/components/quoter/Quoter';
import type { PromoCode } from '@/types/quoter';

export default async function QuoterPage() {
  let promoCodes: PromoCode[] = DEFAULT_PROMO_CODES;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('promo_codes')
      .select('id, code, type, value, active, note')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      promoCodes = data.map(row => ({
        id: row.id,
        code: row.code,
        type: row.type,
        value: row.value,
        active: row.active,
        note: row.note,
      }));
    }
  } catch {
    // Supabase not configured yet — use defaults
  }

  return <Quoter promoCodes={promoCodes} />;
}
