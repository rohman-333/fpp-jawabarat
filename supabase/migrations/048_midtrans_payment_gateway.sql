-- Migration: 048_midtrans_payment_gateway.sql
-- Description: Creates payment_methods, payment_transactions, and payment_callback_logs tables for Midtrans Snap integration.

-- 1. Create payment_methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT DEFAULT 'manual', -- 'manual', 'midtrans'
    is_active BOOLEAN DEFAULT false,
    is_production BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Payment Methods
INSERT INTO public.payment_methods (code, name, description, provider, is_active, is_production, sort_order)
VALUES 
    ('manual_transfer', 'Transfer Bank Manual', 'Bayar langsung ke penjual dengan mengirimkan bukti transfer manual.', 'manual', true, false, 1),
    ('midtrans_snap', 'Pembayaran Instan (Midtrans)', 'Bayar otomatis via QRIS, Virtual Account, Kartu Kredit, atau GoPay.', 'midtrans', true, false, 2),
    ('qris', 'QRIS Mandiri', 'Bayar instan pakai kode QRIS.', 'midtrans', false, false, 3),
    ('virtual_account', 'Virtual Account Bank', 'Bayar instan via VA bank Mandiri, BNI, BRI, BCA, BJB.', 'midtrans', false, false, 4),
    ('e_wallet', 'E-Wallet (Gopay / ShopeePay)', 'Bayar instan via aplikasi e-wallet.', 'midtrans', false, false, 5),
    ('cod', 'Bayar di Tempat (COD)', 'Pembayaran tunai langsung ketika barang diterima.', 'manual', false, false, 6)
ON CONFLICT (code) DO NOTHING;

-- 2. Create payment_transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    provider TEXT,
    provider_transaction_id TEXT,
    midtrans_order_id TEXT,
    snap_token TEXT,
    redirect_url TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, settlement, capture, deny, cancel, expire, failure, refund
    fraud_status TEXT,
    payment_type TEXT,
    raw_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create payment_callback_logs Table
CREATE TABLE IF NOT EXISTS public.payment_callback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT DEFAULT 'midtrans',
    order_id TEXT,
    transaction_status TEXT,
    fraud_status TEXT,
    signature_key TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    is_valid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_callback_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies for payment_methods
CREATE POLICY "Public read active payment_methods"
    ON public.payment_methods
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin full access to payment_methods"
    ON public.payment_methods
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'operator')
        )
    );

-- 6. Policies for payment_transactions
CREATE POLICY "Buyer can select own payment_transactions"
    ON public.payment_transactions
    FOR SELECT
    TO authenticated
    USING (buyer_id = auth.uid());

CREATE POLICY "Admin full access to payment_transactions"
    ON public.payment_transactions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'operator')
        )
    );

-- 7. Policies for payment_callback_logs (Restricted)
CREATE POLICY "Admin full access to payment_callback_logs"
    ON public.payment_callback_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'operator')
        )
    );
