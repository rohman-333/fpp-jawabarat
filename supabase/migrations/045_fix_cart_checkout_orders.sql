-- Migration 045: Fix Cart, Checkout, Orders, Payments and Platform Commissions schema
-- Highly safe, defensive table altering and creation

--------------------------------------------------------------------------------
-- 1. Alter profiles table to ensure seller status support exists
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_seller') THEN
    ALTER TABLE public.profiles ADD COLUMN is_seller boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='seller_status') THEN
    ALTER TABLE public.profiles ADD COLUMN seller_status text DEFAULT 'none'; -- none, pending, approved, rejected
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='shop_name') THEN
    ALTER TABLE public.profiles ADD COLUMN shop_name text;
  END IF;
END $$;

--------------------------------------------------------------------------------
-- 2. Alter products table to ensure status and category columns
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='status') THEN
    ALTER TABLE public.products ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category') THEN
    ALTER TABLE public.products ADD COLUMN category text DEFAULT 'Lainnya';
  END IF;
END $$;

--------------------------------------------------------------------------------
-- 3. Setup and alter cart_items
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cart_items' AND column_name='seller_id') THEN
    ALTER TABLE public.cart_items ADD COLUMN seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_seller_id ON public.cart_items(seller_id);

--------------------------------------------------------------------------------
-- 4. Setup and alter orders table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number text,
  total_amount numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'manual',
  shipping_address text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='invoice_number') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status text DEFAULT 'unpaid'; -- unpaid, waiting_payment, paid, rejected
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='subtotal') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='platform_fee') THEN
    ALTER TABLE public.orders ADD COLUMN platform_fee numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='buyer_name') THEN
    ALTER TABLE public.orders ADD COLUMN buyer_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='seller_id') THEN
    ALTER TABLE public.orders ADD COLUMN seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='shipping_cost') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_cost numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='total_amount') THEN
    ALTER TABLE public.orders ADD COLUMN total_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='shipping_address') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='customer_phone') THEN
    ALTER TABLE public.orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='notes') THEN
    ALTER TABLE public.orders ADD COLUMN notes text;
  END IF;
END $$;

-- Perform backfill
UPDATE public.orders
SET invoice_number = 'INV-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(id::text, 1, 8))
WHERE invoice_number IS NULL OR invoice_number = '';

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Unique index to prevent duplicate invoice numbers safely without hard constraint errors
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_invoice_number_unique
ON public.orders(invoice_number);

-- Regular index for fast invoice queries
CREATE INDEX IF NOT EXISTS idx_orders_invoice
ON public.orders(invoice_number);

--------------------------------------------------------------------------------
-- 5. Setup and alter order_items table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='seller_id') THEN
    ALTER TABLE public.order_items ADD COLUMN seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

--------------------------------------------------------------------------------
-- 6. Setup payment_confirmations table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_url text NOT NULL,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending', -- pending, approved, rejected
  note text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payment_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id ON public.payment_confirmations(buyer_id);

--------------------------------------------------------------------------------
-- 7. Platform Commission Schema Setup
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage numeric DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  gross_amount numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  seller_net_amount numeric DEFAULT 0,
  status text DEFAULT 'recorded', -- recorded, paid
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commission_ledger ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 8. Safe policies definition
--------------------------------------------------------------------------------
DO $$
BEGIN
  -- Re-create Cart items policy safely
  DROP POLICY IF EXISTS "user bisa membaca cart miliknya" ON public.cart_items;
  DROP POLICY IF EXISTS "user bisa update cart miliknya" ON public.cart_items;
  DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
  CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

  -- Re-create Orders policies safely
  DROP POLICY IF EXISTS "buyer bisa membaca order miliknya" ON public.orders;
  DROP POLICY IF EXISTS "seller bisa membaca order miliknya" ON public.orders;
  DROP POLICY IF EXISTS "admin bisa membaca semua order" ON public.orders;
  DROP POLICY IF EXISTS "user bisa membuat order" ON public.orders;
  DROP POLICY IF EXISTS "seller bisa update status order" ON public.orders;
  DROP POLICY IF EXISTS "admin bisa update semua order" ON public.orders;
  
  CREATE POLICY "Buyers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);
    
  CREATE POLICY "Buyers can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

  CREATE POLICY "Sellers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = seller_id);

  CREATE POLICY "Sellers/Admin can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')
    ));

  CREATE POLICY "Admin can view all orders" ON public.orders
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')
    ));

  -- Re-create Order Items policies safely
  DROP POLICY IF EXISTS "user bisa membaca order items yang ordernya dia bisa baca" ON public.order_items;
  DROP POLICY IF EXISTS "admin bisa membaca semua order items" ON public.order_items;
  DROP POLICY IF EXISTS "buyer bisa insert order items saat buat order" ON public.order_items;
  
  CREATE POLICY "Order items viewable by order participants" ON public.order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_items.order_id 
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')
      )
    );

  CREATE POLICY "Buyers can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

  -- Payment confirmations policies
  DROP POLICY IF EXISTS "Buyers can manage own payments" ON public.payment_confirmations;
  DROP POLICY IF EXISTS "Admin can manage all payments" ON public.payment_confirmations;
  
  CREATE POLICY "Buyers can manage own payments" ON public.payment_confirmations
    FOR ALL USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

  CREATE POLICY "Admin can manage all payments" ON public.payment_confirmations
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')
    ));

  -- Commission Ledger Policies
  DROP POLICY IF EXISTS "Admin can manage commissions ledger" ON public.platform_commission_ledger;
  DROP POLICY IF EXISTS "Sellers can view own commission ledger" ON public.platform_commission_ledger;
  
  CREATE POLICY "Admin can manage commissions ledger" ON public.platform_commission_ledger
    FOR ALL USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator')
    ));
    
  CREATE POLICY "Sellers can view own commission ledger" ON public.platform_commission_ledger
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.orders WHERE id = platform_commission_ledger.order_id AND seller_id = auth.uid()
      )
    );
END $$;

--------------------------------------------------------------------------------
-- 9. Seed default Platform Commission Setting
--------------------------------------------------------------------------------
INSERT INTO public.platform_commission_settings (commission_percentage, is_active)
VALUES (10, true)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- 10. Reload PostgREST Cache
--------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
