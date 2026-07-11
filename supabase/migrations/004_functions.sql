-- ============================================================
-- Migration 004: Database Functions & Triggers
-- Run after 003_rls_policies.sql
-- ============================================================

-- ── Auto-update timestamps ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_tradespeople_updated_at
  BEFORE UPDATE ON public.tradespeople
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_childcare_updated_at
  BEFORE UPDATE ON public.childcare_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New Member'),
    TRUE  -- phone auth means phone is already verified
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Auto-promote to Tier 2 after 2 accepted vouches ──────────────────────────

CREATE OR REPLACE FUNCTION public.check_vouch_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accepted_count INTEGER;
BEGIN
  IF NEW.status = 'accepted' THEN
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.vouches
    WHERE vouchee_id = NEW.vouchee_id AND status = 'accepted';

    -- Promote from Tier 1 → Tier 2 when 2 accepted vouches exist
    IF v_accepted_count >= 2 THEN
      UPDATE public.profiles
      SET tier = 'tier2_poster'
      WHERE id = NEW.vouchee_id AND tier = 'tier1_browser';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vouch_promotion
  AFTER UPDATE ON public.vouches
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.check_vouch_promotion();

-- ── Auto-promote to Tier 3 on VSC approval ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.promote_to_tier3()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.vsc_status = 'approved' AND (OLD.vsc_status IS NULL OR OLD.vsc_status != 'approved') THEN
    -- Promote Tier 2 → Tier 3
    UPDATE public.profiles
    SET tier = 'tier3_childcare', vsc_verified_at = NOW()
    WHERE id = NEW.id AND tier = 'tier2_poster';

    -- Also sync vsc_verified flag on childcare_providers
    UPDATE public.childcare_providers
    SET vsc_verified = TRUE
    WHERE profile_id = NEW.id;
  END IF;

  -- Handle VSC expiry / rejection
  IF NEW.vsc_status IN ('expired', 'rejected') AND OLD.vsc_status = 'approved' THEN
    UPDATE public.profiles
    SET tier = 'tier2_poster'
    WHERE id = NEW.id AND tier = 'tier3_childcare';

    UPDATE public.childcare_providers
    SET vsc_verified = FALSE
    WHERE profile_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vsc_promotion
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.vsc_status IS DISTINCT FROM OLD.vsc_status)
  EXECUTE FUNCTION public.promote_to_tier3();

-- ── Auto-recalculate tradesperson avg_rating ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.recalculate_tradesperson_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID := COALESCE(NEW.tradesperson_id, OLD.tradesperson_id);
BEGIN
  UPDATE public.tradespeople
  SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE tradesperson_id = v_id AND is_approved = TRUE
    ), 0.00),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE tradesperson_id = v_id AND is_approved = TRUE
    )
  WHERE id = v_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_review_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_tradesperson_rating();

-- ── Two-way handshake unlock trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_handshake_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When both timestamps are set → unlock
  IF NEW.requester_accepted_at IS NOT NULL AND NEW.responder_accepted_at IS NOT NULL THEN
    NEW.status    := 'unlocked';
    NEW.unlocked_at := NOW();
  ELSIF NEW.requester_accepted_at IS NOT NULL OR NEW.responder_accepted_at IS NOT NULL THEN
    NEW.status := 'accepted_by_one';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handshake_unlock
  BEFORE UPDATE ON public.handshake_requests
  FOR EACH ROW EXECUTE FUNCTION public.process_handshake_accept();

-- ── Fuzzy location generator (random 300-500m offset) ─────────────────────────

CREATE OR REPLACE FUNCTION public.generate_fuzzy_location(real_point GEOGRAPHY)
RETURNS GEOGRAPHY
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  offset_meters DOUBLE PRECISION;
  angle_radians DOUBLE PRECISION;
  dx            DOUBLE PRECISION;
  dy            DOUBLE PRECISION;
BEGIN
  offset_meters := 300 + (random() * 200);   -- Between 300m and 500m
  angle_radians := random() * 2 * PI();

  -- Approximate degree offsets at ~43.5°N (Halton Region latitude)
  dx := (offset_meters * cos(angle_radians)) / 111320.0;   -- degrees longitude
  dy := (offset_meters * sin(angle_radians)) / 110540.0;   -- degrees latitude

  RETURN ST_SetSRID(
    ST_MakePoint(
      ST_X(real_point::geometry) + dx,
      ST_Y(real_point::geometry) + dy
    ),
    4326
  )::geography;
END;
$$;

-- ── Secure contact unlock (SECURITY DEFINER) ─────────────────────────────────
-- Only reveals real contact details after handshake is unlocked.
-- Callers must be one of the two participants.

CREATE OR REPLACE FUNCTION public.get_unlocked_contact(handshake_uuid UUID)
RETURNS TABLE (
  display_name TEXT,
  phone        TEXT,
  real_lat     DOUBLE PRECISION,
  real_lng     DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID;
  v_responder UUID;
  v_status    handshake_status;
  v_caller    UUID := (SELECT auth.uid());
  v_other     UUID;
BEGIN
  SELECT h.requester_id, h.responder_id, h.status
  INTO   v_requester, v_responder, v_status
  FROM   public.handshake_requests h
  WHERE  h.id = handshake_uuid;

  -- Guard: must be unlocked
  IF v_status != 'unlocked' THEN
    RAISE EXCEPTION 'Handshake not unlocked — contact details unavailable';
  END IF;

  -- Guard: caller must be a participant
  IF v_caller NOT IN (v_requester, v_responder) THEN
    RAISE EXCEPTION 'Unauthorized: you are not a participant of this handshake';
  END IF;

  -- Identify the OTHER party
  v_other := CASE WHEN v_caller = v_requester THEN v_responder ELSE v_requester END;

  RETURN QUERY
  SELECT
    p.display_name,
    u.phone,
    ST_Y(p.real_location::geometry) AS real_lat,
    ST_X(p.real_location::geometry) AS real_lng
  FROM public.profiles p
  JOIN auth.users      u ON u.id = p.id
  WHERE p.id = v_other;
END;
$$;

-- ── Geospatial radius search for tradespeople ─────────────────────────────────
-- Uses bounding-box pre-filter (&&) before expensive ST_DWithin for performance.

CREATE OR REPLACE FUNCTION public.search_tradespeople_nearby(
  search_lat    DOUBLE PRECISION,
  search_lng    DOUBLE PRECISION,
  radius_km     DOUBLE PRECISION DEFAULT 25,
  p_category    trade_category   DEFAULT NULL,
  p_telugu      BOOLEAN          DEFAULT NULL,
  p_emergency   BOOLEAN          DEFAULT NULL,
  p_vouched     BOOLEAN          DEFAULT NULL
)
RETURNS TABLE (
  id                UUID,
  profile_id        UUID,
  business_name     TEXT,
  category          trade_category,
  speaks_telugu     BOOLEAN,
  emergency_24_7    BOOLEAN,
  community_vouched BOOLEAN,
  avg_rating        DECIMAL,
  total_reviews     INTEGER,
  display_name      TEXT,
  location_label    TEXT,
  halton_town       TEXT,
  avatar_url        TEXT,
  distance_km       DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_point GEOGRAPHY;
BEGIN
  search_point := ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography;

  RETURN QUERY
  SELECT
    t.id,
    t.profile_id,
    t.business_name,
    t.category,
    t.speaks_telugu,
    t.emergency_24_7,
    t.community_vouched,
    t.avg_rating,
    t.total_reviews,
    p.display_name,
    p.location_label,
    p.halton_town,
    p.avatar_url,
    ROUND((ST_Distance(p.fuzzy_location, search_point) / 1000)::numeric, 1)::float8 AS distance_km
  FROM public.tradespeople t
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE
    t.is_active = TRUE
    AND NOT p.is_suspended
    -- Bounding box pre-filter for index use
    AND p.fuzzy_location && ST_Buffer(search_point, radius_km * 1000)
    -- Precise radius check
    AND ST_DWithin(p.fuzzy_location, search_point, radius_km * 1000)
    -- Optional filters
    AND (p_category  IS NULL OR t.category       = p_category)
    AND (p_telugu    IS NULL OR t.speaks_telugu   = p_telugu)
    AND (p_emergency IS NULL OR t.emergency_24_7  = p_emergency)
    AND (p_vouched   IS NULL OR t.community_vouched = p_vouched)
  ORDER BY distance_km ASC, t.avg_rating DESC;
END;
$$;

-- ── Admin: safe profile view (never exposes real_location or vsc_file_path) ───

CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT
  id,
  display_name,
  phone_verified,
  tier,
  languages,
  fuzzy_location,
  location_label,
  halton_town,
  vsc_status,
  vsc_expiry,
  vsc_uploaded_at,
  vsc_verified_at,
  availability,
  emergency_note,
  avatar_url,
  bio,
  is_admin,
  is_suspended,
  created_at,
  updated_at
  -- real_location and vsc_file_path deliberately excluded
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;
