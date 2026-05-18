-- Migration 024: Marketplace Business Model

CREATE TABLE IF NOT EXISTS public.platform_commission_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    percentage_rate numeric DEFAULT 0,
    fixed_amount numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_commission_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL, -- references orders
    seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    gross_amount numeric NOT NULL DEFAULT 0,
    commission_amount numeric NOT NULL DEFAULT 0,
    seller_net_amount numeric NOT NULL DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_boosts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL DEFAULT 0,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admin access platform commission settings"
ON public.platform_commission_settings
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'team'))
);

CREATE POLICY "Admin access ledger"
ON public.platform_commission_ledger
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'team'))
);

CREATE POLICY "Sellers can see their own ledger"
ON public.platform_commission_ledger FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Everyone can see active boosts"
ON public.product_boosts FOR SELECT
USING (status = 'active');

CREATE POLICY "Sellers can manage their boosts"
ON public.product_boosts
USING (auth.uid() = seller_id);
