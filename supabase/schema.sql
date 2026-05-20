-- ─────────────────────────────────────────────────────────────────────────────
-- CodKave Quoter — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. prices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prices (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('package', 'addon', 'maintenance', 'extra')),
  subcategory TEXT,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_monthly  BOOLEAN DEFAULT false,
  is_from     BOOLEAN DEFAULT false,
  is_popular  BOOLEAN DEFAULT false,
  mnt_tier    TEXT,
  delivery    TEXT,
  sort_order  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. quotes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name       TEXT,
  client_company    TEXT,
  client_email      TEXT NOT NULL,
  client_phone      TEXT,
  channel           TEXT DEFAULT 'presencial' CHECK (channel IN ('presencial', 'web')),
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount          NUMERIC(10,2) DEFAULT 0,
  total_onetime     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_monthly     NUMERIC(10,2) DEFAULT 0,
  payment_plan      TEXT NOT NULL DEFAULT 'full' CHECK (payment_plan IN ('full', 'inst')),
  instalment_months INTEGER,
  instalment_amount NUMERIC(10,2),
  deposit_35        NUMERIC(10,2),
  payment_35        NUMERIC(10,2),
  balance           NUMERIC(10,2),
  promo_code        TEXT,
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  webhook_sent_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. quote_items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     UUID REFERENCES quotes(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_monthly   BOOLEAN DEFAULT false,
  is_estimated BOOLEAN DEFAULT false,
  sort_order   INTEGER DEFAULT 0
);

-- ── 4. promo_codes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value      NUMERIC(10,2) NOT NULL,
  active     BOOLEAN DEFAULT true,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE prices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- prices: anyone can read
CREATE POLICY "prices_select_public" ON prices FOR SELECT USING (true);
-- prices: only authenticated users can write
CREATE POLICY "prices_write_admin" ON prices FOR ALL USING (auth.role() = 'authenticated');

-- quotes: anyone can insert (quoter creates them)
CREATE POLICY "quotes_insert_public" ON quotes FOR INSERT WITH CHECK (true);
-- quotes: only authenticated users can read/update
CREATE POLICY "quotes_select_admin" ON quotes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quotes_update_admin" ON quotes FOR UPDATE USING (auth.role() = 'authenticated');

-- quote_items: same as quotes
CREATE POLICY "items_insert_public"  ON quote_items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_select_admin"   ON quote_items FOR SELECT USING (auth.role() = 'authenticated');

-- promo_codes: anon can read active codes (quoter validation), admin can do everything
CREATE POLICY "codes_select_active_public" ON promo_codes FOR SELECT USING (active = true);
CREATE POLICY "codes_select_all_admin"     ON promo_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "codes_insert_admin"         ON promo_codes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "codes_update_admin"         ON promo_codes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "codes_delete_admin"         ON promo_codes FOR DELETE USING (auth.role() = 'authenticated');

-- ── 6. Seed: prices ──────────────────────────────────────────────────────────
INSERT INTO prices (id, category, name, description, price, mnt_tier, delivery, is_popular, sort_order) VALUES
  ('exp', 'package', 'Express',    'Fast online presence. AI-powered.',                  599,  'ess', '48–72 hours',        false, 1),
  ('str', 'package', 'Starter',    'Small businesses starting their digital journey.',   1800, 'ess', '~3 business days',   false, 2),
  ('biz', 'package', 'Business',   'Established businesses ready to grow online.',       3200, 'std', '~5 business days',   true,  3),
  ('eco', 'package', 'E-Commerce', 'Professional WooCommerce store.',                    5500, 'prm', '~8 business days',   false, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prices (id, category, name, price, sort_order) VALUES
  ('a1',  'addon', 'Blog section setup',         299, 1),
  ('a2',  'addon', 'Gallery / Portfolio',         199, 2),
  ('a3',  'addon', 'Booking system',              349, 3),
  ('a4',  'addon', 'Online payments',             399, 4),
  ('a5',  'addon', 'Extra page (individual)',     199, 5),
  ('a6',  'addon', 'Extra 5 pages (bundle)',      799, 6),
  ('a7',  'addon', 'Bilingual site (EN + ES)',    349, 7),
  ('a8',  'addon', 'SEO advanced setup',          199, 8),
  ('a9',  'addon', 'Newsletter integration',      149, 9),
  ('a10', 'addon', 'Social media setup',          99,  10),
  ('a11', 'addon', 'Logo design (basic)',         249, 11),
  ('a12', 'addon', 'Business card design',        99,  12),
  ('a13', 'addon', 'Domain registration',         49,  13),
  ('a14', 'addon', 'Content writing (per page)', 99,  14),
  ('a15', 'addon', 'Stock photos (up to 15)',    79,  15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prices (id, category, name, description, price, is_monthly, sort_order) VALUES
  ('ess', 'maintenance', 'Essential', 'Express & Starter sites', 49,  false, 1),
  ('std', 'maintenance', 'Standard',  'Business sites',          119, false, 2),
  ('prm', 'maintenance', 'Premium',   'E-Commerce & advanced',   199, false, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prices (id, category, subcategory, name, description, price, is_monthly, is_from, sort_order) VALUES
  ('p1', 'extra', 'automation', 'Volunteer / staff selection automation', 'JotForm + Google Drive + task assignment',          799,  false, true, 1),
  ('p2', 'extra', 'automation', 'Electronic signature workflow',          'Document generation + e-sign integration',          599,  false, true, 2),
  ('p3', 'extra', 'automation', 'Multi-form connected system',            'Conditional logic + automated notifications',       499,  false, true, 3),
  ('p4', 'extra', 'automation', 'Full suite for NGO / foundation',        'Registration to assignment to docs to signature',   1500, false, true, 4),
  ('p5', 'extra', 'automation', 'Business process automation',            'HR, sales, client onboarding workflows',            1200, false, true, 5),
  ('p6', 'extra', 'automation', 'Monthly automation support',             'Adjustments, improvements & monitoring',            99,   true,  true, 6),
  ('s1', 'extra', 'seo',        'Google Business Profile setup',          'Get found on Google Maps & local search',           199,  false, false, 7),
  ('s2', 'extra', 'seo',        'Website SEO audit + report',             'Full analysis with actionable recommendations',     299,  false, false, 8),
  ('s3', 'extra', 'seo',        'Local SEO Melbourne (monthly)',          'Ongoing optimisation + monthly reports',            299,  true,  false, 9),
  ('s4', 'extra', 'seo',        'Google Analytics + Search Console',      'Full setup + dashboard configuration',              149,  false, false, 10),
  ('g1', 'extra', 'design',     'Logo design (basic)',                    '3 concepts + final files (PNG, SVG)',               249,  false, false, 11),
  ('g2', 'extra', 'design',     'Business card design',                   'Print-ready PDF',                                   99,   false, false, 12),
  ('g3', 'extra', 'design',     'Flyer / promotional material',           'For social media or print',                         129,  false, false, 13),
  ('g4', 'extra', 'design',     'Basic brand kit',                        'Logo + colours + typography + usage guide',         499,  false, false, 14),
  ('c1', 'extra', 'content',    'Website copywriting (5 pages)',          'English or Spanish',                                399,  false, false, 15),
  ('c2', 'extra', 'content',    'SEO blog article (per article)',         '800-1,200 words, keyword optimised',                149,  false, false, 16),
  ('c3', 'extra', 'content',    'Monthly blog pack (4 articles)',         'Strategy + writing + publishing',                   449,  true,  false, 17),
  ('c4', 'extra', 'content',    'Social media content (monthly)',         '12 posts in English + Spanish',                     299,  true,  false, 18),
  ('q1', 'extra', 'consulting', 'Free strategy session',                  '30 min call, no commitment required',               0,    false, false, 19),
  ('q2', 'extra', 'consulting', 'Digital consulting (per hour)',          'Web strategy, SEO, online presence',                120,  false, false, 20),
  ('q3', 'extra', 'consulting', 'WordPress training session',             '1h — learn to manage your own website',             149,  false, false, 21),
  ('q4', 'extra', 'consulting', 'Website audit report',                   'SEO, speed, UX and conversion analysis',            199,  false, false, 22)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Seed: promo_codes ─────────────────────────────────────────────────────
INSERT INTO promo_codes (code, type, value, active, note) VALUES
  ('WELCOME10',   'percent', 10,  true,  'New clients'),
  ('CK15',        'percent', 15,  true,  'Standard negotiation'),
  ('CK20',        'percent', 20,  true,  'Max standard discount'),
  ('VIP25',       'percent', 25,  false, 'VIP only'),
  ('REF200',      'fixed',   200, true,  'Referral $200 off'),
  ('REF300',      'fixed',   300, true,  'Referral $300 off'),
  ('LANZAMIENTO', 'percent', 12,  true,  'Launch promo')
ON CONFLICT (code) DO NOTHING;

-- ── 8. updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at      BEFORE UPDATE ON quotes      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER prices_updated_at      BEFORE UPDATE ON prices      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
