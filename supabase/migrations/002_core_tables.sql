-- ============================================================
-- Migration 002: Core Tables
-- Run after 001_extensions.sql
-- ============================================================

-- ── Custom Enum Types ─────────────────────────────────────────────────────────

CREATE TYPE user_tier AS ENUM ('tier1_browser', 'tier2_poster', 'tier3_childcare');
CREATE TYPE vouch_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE vsc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE handshake_status AS ENUM ('requested', 'accepted_by_one', 'unlocked', 'declined', 'expired');
CREATE TYPE trade_category AS ENUM (
  'plumber', 'electrician', 'hvac', 'carpenter', 'painter',
  'landscaper', 'cleaner', 'mover', 'handyman', 'appliance_repair',
  'locksmith', 'pest_control', 'roofing', 'flooring', 'other'
);
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'emergency_available', 'offline');
CREATE TYPE childcare_type AS ENUM ('babysitter', 'nanny', 'auntie', 'student', 'co_op_parent');
CREATE TYPE coop_transaction_type AS ENUM ('credit', 'debit');

-- ── Profiles (extends auth.users) ─────────────────────────────────────────────

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  phone_verified  BOOLEAN DEFAULT FALSE,
  tier            user_tier DEFAULT 'tier1_browser',
  languages       TEXT[] DEFAULT ARRAY['english'],

  -- Fuzzy geolocation: randomly offset 300-500m from real address
  fuzzy_location  GEOGRAPHY(Point, 4326),
  -- Real location: only revealed after two-way handshake unlock (via DB function)
  real_location   GEOGRAPHY(Point, 4326),
  location_label  TEXT,  -- e.g. "Near Louis St. Laurent & Thompson Rd, Milton"
  halton_town     TEXT CHECK (
    halton_town IN ('Milton', 'Oakville', 'Burlington', 'Halton Hills', 'GTA-Other')
  ),

  -- VSC Verification (Tier 3 requirement)
  vsc_status      vsc_status DEFAULT NULL,
  vsc_uploaded_at TIMESTAMPTZ,
  vsc_verified_at TIMESTAMPTZ,
  vsc_expiry      DATE,       -- VSC documents expire; track this
  vsc_file_path   TEXT,       -- Encrypted storage path (admin access only)

  -- One-tap availability toggle
  availability    availability_status DEFAULT 'offline',
  emergency_note  TEXT CHECK (char_length(emergency_note) <= 200),

  -- Profile content
  avatar_url      TEXT,
  bio             TEXT CHECK (char_length(bio) <= 500),

  -- Admin flags
  is_admin        BOOLEAN DEFAULT FALSE,
  is_suspended    BOOLEAN DEFAULT FALSE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_fuzzy_location ON public.profiles USING GIST (fuzzy_location);
CREATE INDEX idx_profiles_halton_town    ON public.profiles (halton_town);
CREATE INDEX idx_profiles_tier           ON public.profiles (tier);
CREATE INDEX idx_profiles_availability   ON public.profiles (availability)
  WHERE availability != 'offline';
CREATE INDEX idx_profiles_vsc            ON public.profiles (vsc_status)
  WHERE vsc_status IS NOT NULL;

-- ── Peer Vouching System ────────────────────────────────────────────────────

CREATE TABLE public.vouches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vouchee_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        vouch_status DEFAULT 'pending',
  vouch_message TEXT CHECK (char_length(vouch_message) <= 300),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,

  CONSTRAINT unique_vouch  UNIQUE (voucher_id, vouchee_id),
  CONSTRAINT no_self_vouch CHECK  (voucher_id != vouchee_id)
);

CREATE INDEX idx_vouches_vouchee ON public.vouches (vouchee_id, status);
CREATE INDEX idx_vouches_voucher ON public.vouches (voucher_id);

-- ── Tradesperson Directory ─────────────────────────────────────────────────

CREATE TABLE public.tradespeople (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name       TEXT,
  category            trade_category NOT NULL,
  subcategories       TEXT[],

  speaks_telugu       BOOLEAN DEFAULT FALSE,
  emergency_24_7      BOOLEAN DEFAULT FALSE,
  community_vouched   BOOLEAN DEFAULT FALSE, -- Updated via trigger

  description         TEXT CHECK (char_length(description) <= 1000),
  service_area        TEXT[],
  years_experience    SMALLINT CHECK (years_experience >= 0),
  license_number      TEXT,    -- e.g. ESA license for electricians
  insurance_verified  BOOLEAN DEFAULT FALSE,

  diagnostic_fee      DECIMAL(8,2),
  hourly_rate         DECIMAL(8,2),

  -- Denormalized aggregates (updated by trigger)
  avg_rating          DECIMAL(3,2) DEFAULT 0.00 CHECK (avg_rating BETWEEN 0 AND 5),
  total_reviews       INTEGER DEFAULT 0,

  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tradespeople_category  ON public.tradespeople (category);
CREATE INDEX idx_tradespeople_telugu    ON public.tradespeople (speaks_telugu)       WHERE speaks_telugu = TRUE;
CREATE INDEX idx_tradespeople_emergency ON public.tradespeople (emergency_24_7)      WHERE emergency_24_7 = TRUE;
CREATE INDEX idx_tradespeople_vouched   ON public.tradespeople (community_vouched)   WHERE community_vouched = TRUE;
CREATE INDEX idx_tradespeople_rating    ON public.tradespeople (avg_rating DESC);
CREATE INDEX idx_tradespeople_profile   ON public.tradespeople (profile_id);
CREATE INDEX idx_tradespeople_active    ON public.tradespeople (is_active)           WHERE is_active = TRUE;

-- ── Reviews ───────────────────────────────────────────────────────────────

CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES public.tradespeople(id) ON DELETE CASCADE,
  reviewer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT CHECK (char_length(title) <= 120),
  body            TEXT CHECK (char_length(body) <= 2000),
  is_flagged      BOOLEAN DEFAULT FALSE,
  is_approved     BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_review UNIQUE (tradesperson_id, reviewer_id)
);

CREATE INDEX idx_reviews_tradesperson ON public.reviews (tradesperson_id, is_approved);
CREATE INDEX idx_reviews_reviewer     ON public.reviews (reviewer_id);

-- ── Pro-Tips ──────────────────────────────────────────────────────────────

CREATE TABLE public.pro_tips (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category     trade_category NOT NULL,
  title_en     TEXT NOT NULL,
  title_te     TEXT,
  body_en      TEXT NOT NULL CHECK (char_length(body_en) <= 3000),
  body_te      TEXT,
  tip_type     TEXT CHECK (
    tip_type IN ('market_rate','interview_question','bargaining_strategy','compliance','general')
  ),
  gta_avg_rate DECIMAL(8,2),
  source_url   TEXT,
  sort_order   SMALLINT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_tips_category ON public.pro_tips (category, is_active);

-- ── Venues (Community Halls, Banquets) ────────────────────────────────────

CREATE TABLE public.venues (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                       TEXT NOT NULL,
  venue_type                 TEXT CHECK (
    venue_type IN ('community_hall','school_auditorium','banquet_hall','temple_hall','park_pavilion','other')
  ),
  address                    TEXT NOT NULL,
  city                       TEXT NOT NULL CHECK (
    city IN ('Milton','Oakville','Burlington','Halton Hills','Mississauga','Brampton','Toronto','Other')
  ),
  location                   GEOGRAPHY(Point, 4326),

  max_capacity               INTEGER,
  pricing_notes              TEXT CHECK (char_length(pricing_notes) <= 2000),
  hourly_rate                DECIMAL(8,2),
  full_day_rate              DECIMAL(8,2),
  deposit_required           DECIMAL(8,2),

  -- South Asian event specifics
  external_catering_allowed  BOOLEAN DEFAULT FALSE,
  vegetarian_kitchen         BOOLEAN DEFAULT FALSE,
  dedicated_veg_kitchen      BOOLEAN DEFAULT FALSE,
  alcohol_allowed            BOOLEAN DEFAULT FALSE,
  fire_permit_available      BOOLEAN DEFAULT FALSE,
  parking_capacity           INTEGER,
  accessibility_compliant    BOOLEAN DEFAULT TRUE,

  noise_curfew               TIME,
  special_rules              TEXT CHECK (char_length(special_rules) <= 3000),

  contact_phone              TEXT,
  contact_email              TEXT,
  website_url                TEXT,
  photo_urls                 TEXT[],

  avg_rating                 DECIMAL(3,2) DEFAULT 0.00,
  total_reviews              INTEGER DEFAULT 0,
  is_active                  BOOLEAN DEFAULT TRUE,
  submitted_by               UUID REFERENCES public.profiles(id),
  admin_verified             BOOLEAN DEFAULT FALSE,

  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_city        ON public.venues (city, is_active);
CREATE INDEX idx_venues_location    ON public.venues USING GIST (location);
CREATE INDEX idx_venues_type        ON public.venues (venue_type);
CREATE INDEX idx_venues_veg_kitchen ON public.venues (dedicated_veg_kitchen)      WHERE dedicated_veg_kitchen = TRUE;
CREATE INDEX idx_venues_ext_catering ON public.venues (external_catering_allowed) WHERE external_catering_allowed = TRUE;

-- ── Childcare Providers ────────────────────────────────────────────────────

CREATE TABLE public.childcare_providers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_type       childcare_type NOT NULL,

  languages_spoken    TEXT[] DEFAULT ARRAY['english'],
  pure_vegetarian     BOOLEAN DEFAULT FALSE,
  peanut_free         BOOLEAN DEFAULT FALSE,
  other_dietary_notes TEXT CHECK (char_length(other_dietary_notes) <= 500),

  first_aid_certified BOOLEAN DEFAULT FALSE,
  cpr_certified       BOOLEAN DEFAULT FALSE,
  age_groups_served   TEXT[],
  max_children        SMALLINT DEFAULT 2,

  hourly_rate         DECIMAL(8,2),
  is_volunteer        BOOLEAN DEFAULT FALSE,

  available_days      TEXT[],
  available_hours     TEXT,
  emergency_available BOOLEAN DEFAULT FALSE,

  -- Derived from profile.vsc_status = 'approved'
  vsc_verified        BOOLEAN DEFAULT FALSE,

  description         TEXT CHECK (char_length(description) <= 1000),
  avg_rating          DECIMAL(3,2) DEFAULT 0.00,
  total_reviews       INTEGER DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_childcare_profile   ON public.childcare_providers (profile_id);
CREATE INDEX idx_childcare_type      ON public.childcare_providers (provider_type);
CREATE INDEX idx_childcare_veg       ON public.childcare_providers (pure_vegetarian)     WHERE pure_vegetarian = TRUE;
CREATE INDEX idx_childcare_peanut    ON public.childcare_providers (peanut_free)         WHERE peanut_free = TRUE;
CREATE INDEX idx_childcare_emergency ON public.childcare_providers (emergency_available) WHERE emergency_available = TRUE;
CREATE INDEX idx_childcare_vsc       ON public.childcare_providers (vsc_verified)        WHERE vsc_verified = TRUE;

-- ── Co-op Time Banking Ledger ─────────────────────────────────────────────

CREATE TABLE public.coop_ledger (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  counterpart_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type         coop_transaction_type NOT NULL,
  hours                    DECIMAL(4,1) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description              TEXT CHECK (char_length(description) <= 500),

  confirmed_by_parent      BOOLEAN DEFAULT FALSE,
  confirmed_by_counterpart BOOLEAN DEFAULT FALSE,

  session_date             DATE NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_trade CHECK (parent_id != counterpart_id)
);

CREATE INDEX idx_coop_parent      ON public.coop_ledger (parent_id);
CREATE INDEX idx_coop_counterpart ON public.coop_ledger (counterpart_id);

-- Balance summary view
CREATE VIEW public.coop_balances AS
SELECT
  parent_id,
  SUM(CASE
    WHEN transaction_type = 'credit'
    AND confirmed_by_parent
    AND confirmed_by_counterpart THEN hours ELSE 0 END) AS hours_earned,
  SUM(CASE
    WHEN transaction_type = 'debit'
    AND confirmed_by_parent
    AND confirmed_by_counterpart THEN hours ELSE 0 END) AS hours_spent,
  SUM(CASE
    WHEN transaction_type = 'credit'
    AND confirmed_by_parent
    AND confirmed_by_counterpart THEN hours ELSE 0
  END) - SUM(CASE
    WHEN transaction_type = 'debit'
    AND confirmed_by_parent
    AND confirmed_by_counterpart THEN hours ELSE 0 END) AS balance
FROM public.coop_ledger
GROUP BY parent_id;

-- ── School Bus Buddy Matching ─────────────────────────────────────────────

CREATE TABLE public.bus_buddy_matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_a_id      UUID NOT NULL REFERENCES public.profiles(id),
  parent_b_id      UUID NOT NULL REFERENCES public.profiles(id),
  school_board     TEXT CHECK (school_board IN ('HDSB', 'HDCSB', 'Other')),
  school_name      TEXT,
  pickup_zone_label TEXT,
  days_matched     TEXT[],
  notes            TEXT CHECK (char_length(notes) <= 500),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_match CHECK (parent_a_id != parent_b_id)
);

CREATE INDEX idx_bus_buddy_parent_a ON public.bus_buddy_matches (parent_a_id);
CREATE INDEX idx_bus_buddy_parent_b ON public.bus_buddy_matches (parent_b_id);
CREATE INDEX idx_bus_buddy_school   ON public.bus_buddy_matches (school_board, school_name);

-- ── Two-Way Handshake Requests ────────────────────────────────────────────

CREATE TABLE public.handshake_requests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id            UUID NOT NULL REFERENCES public.profiles(id),
  responder_id            UUID NOT NULL REFERENCES public.profiles(id),
  context_type            TEXT NOT NULL CHECK (
    context_type IN ('tradesperson','childcare','coop','bus_buddy','venue')
  ),
  context_id              UUID,
  status                  handshake_status DEFAULT 'requested',

  requester_message       TEXT CHECK (char_length(requester_message) <= 500),
  responder_message       TEXT CHECK (char_length(responder_message) <= 500),

  requester_accepted_at   TIMESTAMPTZ,
  responder_accepted_at   TIMESTAMPTZ,
  unlocked_at             TIMESTAMPTZ,

  -- Auto-expire after 72 hours
  expires_at              TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),

  created_at              TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_handshake CHECK (requester_id != responder_id)
);

CREATE INDEX idx_handshake_requester ON public.handshake_requests (requester_id, status);
CREATE INDEX idx_handshake_responder ON public.handshake_requests (responder_id, status);
CREATE INDEX idx_handshake_expires   ON public.handshake_requests (expires_at)
  WHERE status NOT IN ('unlocked', 'declined');
