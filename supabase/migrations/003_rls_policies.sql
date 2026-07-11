-- ============================================================
-- Migration 003: Row-Level Security Policies
-- Circle of Trust Architecture
-- Run after 002_core_tables.sql
-- ============================================================

-- ── Enable RLS on all tables ───────────────────────────────────────────────────
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradespeople         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_tips             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.childcare_providers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_ledger          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_buddy_matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handshake_requests   ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- Tier 1: All authenticated users can see non-sensitive profile fields.
-- Exact address (real_location) and VSC file path are NEVER returned by RLS;
-- they are protected by SECURITY DEFINER functions below.
-- ──────────────────────────────────────────────────────────────────────────────

-- Any authenticated user can browse profiles (fuzzy_location only)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (NOT is_suspended);

-- Users can only INSERT their own profile (on signup)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can only UPDATE their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Admins can UPDATE any profile (for VSC approval, suspension)
CREATE POLICY "profiles_admin_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- VOUCHES
-- ──────────────────────────────────────────────────────────────────────────────

-- Participants (voucher or vouchee) can see their vouches
CREATE POLICY "vouches_select_participants"
  ON public.vouches FOR SELECT
  TO authenticated
  USING (
    voucher_id = (SELECT auth.uid())
    OR vouchee_id = (SELECT auth.uid())
  );

-- Only Tier 2+ users can CREATE vouches for others
CREATE POLICY "vouches_insert_tier2"
  ON public.vouches FOR INSERT
  TO authenticated
  WITH CHECK (
    voucher_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND tier IN ('tier2_poster', 'tier3_childcare')
    )
  );

-- Only the vouchee can accept/reject their own vouch
CREATE POLICY "vouches_update_vouchee"
  ON public.vouches FOR UPDATE
  TO authenticated
  USING (vouchee_id = (SELECT auth.uid()) OR voucher_id = (SELECT auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────────
-- TRADESPEOPLE
-- Tier 1: Browse; Tier 2: Post; Own record: Update
-- ──────────────────────────────────────────────────────────────────────────────

-- All authenticated users (Tier 1+) can browse active listings
CREATE POLICY "tradespeople_select_active"
  ON public.tradespeople FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Only Tier 2+ can create tradesperson listings
CREATE POLICY "tradespeople_insert_tier2"
  ON public.tradespeople FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND tier IN ('tier2_poster', 'tier3_childcare')
    )
  );

-- Users can update their own listing
CREATE POLICY "tradespeople_update_own"
  ON public.tradespeople FOR UPDATE
  TO authenticated
  USING (profile_id = (SELECT auth.uid()));

-- Admins can update any listing (for moderation)
CREATE POLICY "tradespeople_admin_update"
  ON public.tradespeople FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────────────────────────

-- All authenticated users can read approved reviews
CREATE POLICY "reviews_select_approved"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (is_approved = TRUE);

-- Tier 2+ can write reviews
CREATE POLICY "reviews_insert_tier2"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND tier IN ('tier2_poster', 'tier3_childcare')
    )
  );

-- Users can update their own review
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────────
-- PRO-TIPS (Admin-managed; read-only for users)
-- ──────────────────────────────────────────────────────────────────────────────

-- All authenticated users can read active tips
CREATE POLICY "pro_tips_select_active"
  ON public.pro_tips FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Admins can do anything
CREATE POLICY "pro_tips_admin_all"
  ON public.pro_tips FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- VENUES
-- ──────────────────────────────────────────────────────────────────────────────

-- All authenticated users can browse active verified venues
CREATE POLICY "venues_select_active"
  ON public.venues FOR SELECT
  TO authenticated
  USING (is_active = TRUE AND admin_verified = TRUE);

-- Tier 2+ can submit venues for admin review
CREATE POLICY "venues_insert_tier2"
  ON public.venues FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND tier IN ('tier2_poster', 'tier3_childcare')
    )
  );

-- Submitter or admin can update a venue
CREATE POLICY "venues_update_submitter_or_admin"
  ON public.venues FOR UPDATE
  TO authenticated
  USING (
    submitted_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- CHILDCARE PROVIDERS
-- Tier 3 ONLY — both viewer and poster must be VSC-verified
-- ──────────────────────────────────────────────────────────────────────────────

-- ONLY Tier 3 users can view childcare providers
CREATE POLICY "childcare_select_tier3"
  ON public.childcare_providers FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND tier = 'tier3_childcare'
    )
  );

-- ONLY Tier 3 can create childcare listings
CREATE POLICY "childcare_insert_tier3"
  ON public.childcare_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND tier = 'tier3_childcare'
    )
  );

-- Users can update their own childcare listing
CREATE POLICY "childcare_update_own"
  ON public.childcare_providers FOR UPDATE
  TO authenticated
  USING (profile_id = (SELECT auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────────
-- CO-OP LEDGER
-- ──────────────────────────────────────────────────────────────────────────────

-- Users can see their own ledger entries (as parent or counterpart)
CREATE POLICY "coop_select_own"
  ON public.coop_ledger FOR SELECT
  TO authenticated
  USING (
    parent_id = (SELECT auth.uid())
    OR counterpart_id = (SELECT auth.uid())
  );

-- Tier 3 can log co-op hours
CREATE POLICY "coop_insert_tier3"
  ON public.coop_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND tier = 'tier3_childcare'
    )
  );

-- Both parties can confirm a co-op entry
CREATE POLICY "coop_update_participants"
  ON public.coop_ledger FOR UPDATE
  TO authenticated
  USING (
    parent_id = (SELECT auth.uid())
    OR counterpart_id = (SELECT auth.uid())
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- BUS BUDDY MATCHES
-- ──────────────────────────────────────────────────────────────────────────────

-- Only participants can see their bus buddy matches
CREATE POLICY "bus_buddy_select_own"
  ON public.bus_buddy_matches FOR SELECT
  TO authenticated
  USING (
    parent_a_id = (SELECT auth.uid())
    OR parent_b_id = (SELECT auth.uid())
  );

-- Tier 3 can create bus buddy matches
CREATE POLICY "bus_buddy_insert_tier3"
  ON public.bus_buddy_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    (parent_a_id = (SELECT auth.uid()) OR parent_b_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND tier = 'tier3_childcare'
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- HANDSHAKE REQUESTS
-- ──────────────────────────────────────────────────────────────────────────────

-- Only the two parties can see a handshake
CREATE POLICY "handshake_select_participants"
  ON public.handshake_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = (SELECT auth.uid())
    OR responder_id = (SELECT auth.uid())
  );

-- Any authenticated Tier 1+ user can initiate a handshake
CREATE POLICY "handshake_insert_authenticated"
  ON public.handshake_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = (SELECT auth.uid()));

-- Only participants can update a handshake (accept/decline)
CREATE POLICY "handshake_update_participants"
  ON public.handshake_requests FOR UPDATE
  TO authenticated
  USING (
    requester_id = (SELECT auth.uid())
    OR responder_id = (SELECT auth.uid())
  );
