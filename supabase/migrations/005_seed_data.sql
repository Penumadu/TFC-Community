-- ============================================================
-- Migration 005: Seed Data (Pro-Tips & Sample Venues)
-- Run after 004_functions.sql
-- ============================================================

-- ── Pro-Tips: GTA Market Rates & Compliance Tips ─────────────────────────────

INSERT INTO public.pro_tips
  (category, title_en, title_te, body_en, tip_type, gta_avg_rate, sort_order)
VALUES

-- ELECTRICIAN
('electrician',
 'GTA Electrician Diagnostic Fee',
 'GTA ఎలెక్ట్రీషియన్ ఫీజు',
 'In the GTA (Halton/Peel/York), a licensed electrician''s service call + diagnostic fee typically ranges from $120–$180. Any quote below $80 is a red flag — unlicensed contractors often charge less upfront but can void your home insurance. Always ask: "Are you ESA-licensed?" (Electrical Safety Authority of Ontario).',
 'market_rate', 150.00, 1),

('electrician',
 'ESA Compliance: What to Ask Before Hiring',
 'ESA నియంత్రణ ప్రశ్నలు',
 'Before hiring an electrician in Ontario:
1. Ask for their ESA licence number (verify at esa.on.ca)
2. For work valued over $1,000, they must pull a permit — if they say no, walk away
3. Panel upgrades (100A→200A) require ESA inspection — budget $2,500–$4,500 in GTA
4. NEVER pay 100% upfront. Standard is 30% deposit, balance on completion.',
 'compliance', NULL, 2),

('electrician',
 'Bargaining Strategy for Electricians',
 'ఎలెక్ట్రీషియన్ అంగీకార వ్యూహం',
 'Community-tested tips:
• Get 3 quotes minimum. Show each contractor the lowest quote — most will match or beat it for repeat business
• Mid-week bookings (Tue–Thu) are often 10–15% cheaper than weekends
• Bundle small jobs (add outlets + install fixtures in one visit) to save the service call fee
• Ask: "What''s included in the hourly rate — materials, disposal?" Surprises add 20–40%',
 'bargaining_strategy', NULL, 3),

-- PLUMBER
('plumber',
 'GTA Plumber Service Call Rates',
 'GTA ప్లంబర్ రేట్లు',
 'GTA plumber service call fees (2024–2025):
• Standard service call: $100–$160
• After-hours / emergency: $180–$280
• Drain snaking: $150–$300
• Water heater replacement (40 gal tank): $1,200–$1,800 including unit
• Tip: Always ask if the diagnostic fee is waived if you proceed with the repair — most reputable plumbers say yes.',
 'market_rate', 130.00, 1),

('plumber',
 'What to Ask Your Plumber',
 'ప్లంబర్‌ని ఏమి అడగాలి',
 'Interview checklist for Halton plumbers:
1. Are you licensed with the Ontario College of Trades? (Mandatory for most plumbing work)
2. Do you pull permits for work over $300? (Required by Halton Region building code)
3. Is your estimate fixed-price or time-and-materials? (Prefer fixed-price)
4. Do you offer a warranty on labour? (Industry standard: 90 days minimum)
5. Are you insured for $2M general liability?',
 'interview_question', NULL, 2),

-- HVAC
('hvac',
 'GTA HVAC Pricing Guide',
 'GTA HVAC ధర గైడ్',
 'HVAC costs in Halton Region (2024–2025):
• AC service/tune-up: $120–$180
• Furnace inspection: $100–$150
• Refrigerant recharge (R-410A): $200–$350
• New central AC install (2-ton): $3,500–$5,500
• New furnace install (80,000 BTU): $3,000–$5,000
• Heat pump (replace both): $6,000–$12,000 (rebates available via Enbridge/HER+)
• Tip: Ontario Home Efficiency Rebate (HER+) offers up to $7,100 for heat pump upgrades.',
 'market_rate', 140.00, 1),

('hvac',
 'Halton HVAC Rebates & Incentives',
 'హాల్టన్ HVAC రిబేట్లు',
 'Don''t leave money on the table — available HVAC rebates for Halton homeowners:
• Canada Greener Homes Loan: Up to $40,000 interest-free for heat pumps, insulation, windows
• Enbridge HER+ Program: $1,000–$7,100 for heat pump installation
• Enbridge Gas rebate: $250–$1,000 for high-efficiency furnace
• Milton Hydro rebate: $300–$600 for smart thermostat
Ask your contractor: "Can you help with the rebate paperwork?" — licensed contractors often do this for free.',
 'compliance', NULL, 2),

-- HANDYMAN
('handyman',
 'GTA Handyman Hourly Rates',
 'GTA హ్యాండిమ్యాన్ రేట్లు',
 'Halton/GTA handyman rates (2024–2025):
• General handyman: $60–$100/hr
• Drywall repair (small): $150–$250 flat
• Fence installation (6ft cedar, per linear ft): $35–$55
• Deck staining (per sq ft): $2–$4
• Door installation (interior, including hardware): $200–$350
• Community tip: Many Telugu-speaking handymen in Milton/Oakville are available for weekend work at lower weekend surcharges — check the directory filters!',
 'market_rate', 80.00, 1),

-- CLEANER
('cleaner',
 'Halton House Cleaning Rates',
 'హాల్టన్ ఇంటి శుభ్రత రేట్లు',
 'House cleaning costs in Halton (2024–2025):
• Regular cleaning (3BR home): $120–$180 per visit
• Deep clean (first visit): $250–$400
• Move-in/move-out clean: $300–$500
• Window cleaning (interior+exterior, 20 windows): $200–$350
• Tip: Bi-weekly bookings are typically $20–$40 cheaper per visit than one-time cleans
• Ask about "Pure Vegetarian Household" protocols — many Telugu-speaking cleaners understand dietary cross-contamination concerns.',
 'market_rate', 150.00, 1);

-- ── Sample Venues in Halton Region ────────────────────────────────────────────

-- Note: These are representative examples. Real data should be verified.
-- Location coordinates use PostGIS geography point format (longitude, latitude)

INSERT INTO public.venues
  (name, venue_type, address, city, location,
   max_capacity, pricing_notes, full_day_rate, deposit_required,
   external_catering_allowed, vegetarian_kitchen, dedicated_veg_kitchen,
   alcohol_allowed, parking_capacity, noise_curfew, special_rules,
   admin_verified, is_active, photo_urls)
VALUES

('Milton Sports Centre — Banquet Room',
 'community_hall',
 '605 Santa Maria Blvd, Milton, ON L9T 8H4',
 'Milton',
 ST_SetSRID(ST_MakePoint(-79.8392, 43.5183), 4326)::geography,
 200,
 'Weekday: $600/day | Weekend: $1,100/day | Includes tables & chairs. Alcohol permit required separately.',
 1100.00, 300.00,
 TRUE, TRUE, FALSE, TRUE, 150,
 '23:00'::TIME,
 'External South Asian catering allowed with $100 kitchen deposit. No open flames — no havan/homa ceremonies. Quiet hours 11pm.',
 TRUE, TRUE,
 ARRAY[]::TEXT[]),

('Oakville Community Centre — Heritage Hall',
 'community_hall',
 '55 Navy St, Oakville, ON L6J 2Z3',
 'Oakville',
 ST_SetSRID(ST_MakePoint(-79.6677, 43.4675), 4326)::geography,
 350,
 'Weekday: $800/day | Weekend: $1,400/day | Additional: $200/hr for setup time.',
 1400.00, 500.00,
 TRUE, TRUE, TRUE, TRUE, 200,
 '23:00'::TIME,
 'Dedicated vegetarian prep area (separate from main kitchen). External South Asian caterers welcome with proof of food handler certification.',
 TRUE, TRUE,
 ARRAY[]::TEXT[]),

('Burlington Seniors Centre — Main Hall',
 'community_hall',
 '2285 New St, Burlington, ON L7R 1J4',
 'Burlington',
 ST_SetSRID(ST_MakePoint(-79.7825, 43.3255), 4326)::geography,
 120,
 'Weekday: $400/half-day | Weekend: $700/day | Kitchen access: $75 extra.',
 700.00, 200.00,
 FALSE, TRUE, FALSE, FALSE, 80,
 '22:00'::TIME,
 'No external catering — centre kitchen only. Vegetarian-friendly setup available on request. No alcohol permitted.',
 TRUE, TRUE,
 ARRAY[]::TEXT[]),

('Halton Hills Cultural Centre',
 'community_hall',
 '9 Church St, Georgetown, ON L7G 2A3',
 'Halton Hills',
 ST_SetSRID(ST_MakePoint(-79.9168, 43.6522), 4326)::geography,
 180,
 'Flexible pricing: contact venue. Approximate weekend rate $900/day.',
 900.00, 250.00,
 TRUE, TRUE, FALSE, TRUE, 120,
 '23:30'::TIME,
 'External catering permitted. Traditional South Asian ceremonial items (diyas, flower garlands) permitted. Fire permit required for any open-flame rituals.',
 FALSE, TRUE,
 ARRAY[]::TEXT[]);
