-- Migration 017: E-commerce Orders & Cart

-- 1. Create cart_items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- 2. Create orders
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    invoice_number text UNIQUE NOT NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    shipping_cost numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_method text DEFAULT 'manual',
    shipping_address text,
    customer_phone text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_price numeric NOT NULL,
    quantity int NOT NULL CHECK (quantity > 0),
    subtotal numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. Create order_status_logs
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    notes text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Add Stock column to products if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock int DEFAULT 0;

-- 5. Set up RLS for all these tables
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

-- cart_items policies
CREATE POLICY "user bisa membaca cart miliknya" 
ON public.cart_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user bisa update cart miliknya" 
ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- orders policies
CREATE POLICY "buyer bisa membaca order miliknya" 
ON public.orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "seller bisa membaca order miliknya" 
ON public.orders FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "admin bisa membaca semua order" 
ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

CREATE POLICY "user bisa membuat order" 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "seller bisa update status order" 
ON public.orders FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "admin bisa update semua order" 
ON public.orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

-- order_items policies
CREATE POLICY "user bisa membaca order items yang ordernya dia bisa baca"
ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

CREATE POLICY "admin bisa membaca semua order items"
ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

CREATE POLICY "buyer bisa insert order items saat buat order"
ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.buyer_id = auth.uid()
  )
);

-- order_status_logs policies
CREATE POLICY "semua pihak order bisa membaca logs"
ON public.order_status_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_logs.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

CREATE POLICY "admin bisa membaca semua logs"
ON public.order_status_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

CREATE POLICY "seller/admin bisa membuat log"
ON public.order_status_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_logs.order_id 
    AND (orders.seller_id = auth.uid() OR orders.buyer_id = auth.uid())
  )
);
