import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel = 'presencial', client, quote, sent_at } = body;

    const supabase = await createClient();

    // ── Save quote to Supabase ─────────────────────────────────────────────────
    const { data: savedQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_name:      client.name    || null,
        client_company:   client.company || null,
        client_email:     client.email,
        client_phone:     client.phone   || null,
        client_abn:       client.abn     || null,
        client_address:   client.address || null,
        channel,
        subtotal:         quote.subtotal,
        discount:         quote.discount,
        total_onetime:    quote.total_onetime,
        total_monthly:    quote.total_monthly,
        payment_plan:     quote.payment_plan,
        instalment_months:quote.instalment_months,
        instalment_amount:quote.instalment_amount,
        deposit_35:       quote.deposit_35,
        payment_35:       quote.payment_35,
        balance:          quote.balance_30,
        promo_code:       quote.promo_code,
        status:           'sent',
        webhook_sent_at:  sent_at,
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Quote insert error:', quoteError);
    }

    // ── Save quote items ───────────────────────────────────────────────────────
    if (savedQuote && quote.items?.length) {
      await supabase.from('quote_items').insert(
        quote.items.map((item: { name: string; price: number; recurring: boolean; estimated: boolean }, idx: number) => ({
          quote_id:     savedQuote.id,
          item_id:      `item_${idx}`,
          name:         item.name,
          price:        item.price,
          is_monthly:   item.recurring,
          is_estimated: item.estimated,
          sort_order:   idx,
        }))
      );
    }

    // ── Fire n8n webhook ──────────────────────────────────────────────────────
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          client,
          quote,
          sent_at,
          quote_id: savedQuote?.id ?? null,
        }),
      }).catch(err => console.error('Webhook error:', err));
    }

    return NextResponse.json({ success: true, id: savedQuote?.id }, { status: 200 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
