-- Migration 060: Add destination_zone_id column to public.deliveries
-- IDEMPOTENT: Safe to run multiple times.

ALTER TABLE public.deliveries 
  ADD COLUMN IF NOT EXISTS destination_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL;
