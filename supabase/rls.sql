-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'operator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Pesantren Policies
CREATE POLICY "Pesantren viewable by everyone" ON public.pesantren FOR SELECT USING (true);
CREATE POLICY "Users can insert own pesantren" ON public.pesantren FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own pesantren" ON public.pesantren FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Admins can do anything on pesantren" ON public.pesantren FOR ALL USING (public.is_admin());

-- Product Categories Policies
CREATE POLICY "Categories viewable by everyone" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.product_categories FOR ALL USING (public.is_admin());

-- Products Policies
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Pesantren owners can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid())
);
CREATE POLICY "Pesantren owners can update own products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid())
);
CREATE POLICY "Pesantren owners can delete own products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid())
);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid()));
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid()));

-- Order Items Policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid())))
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
);

-- Forum Posts Policies
CREATE POLICY "Forum posts viewable by everyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can moderate posts" ON public.forum_posts FOR ALL USING (public.is_admin());

-- Forum Comments Policies
CREATE POLICY "Forum comments viewable by everyone" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.forum_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON public.forum_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.forum_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can moderate comments" ON public.forum_comments FOR ALL USING (public.is_admin());

-- Forum Likes Policies
CREATE POLICY "Likes viewable by everyone" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.forum_likes FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can unlike posts" ON public.forum_likes FOR DELETE USING (auth.uid() = profile_id);

-- Programs Policies
CREATE POLICY "Programs viewable by everyone" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL USING (public.is_admin());
CREATE POLICY "Pesantren can manage own programs" ON public.programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pesantren WHERE id = pesantren_id AND profile_id = auth.uid())
);

-- Donations Policies
CREATE POLICY "Donations viewable by everyone" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can update donation status" ON public.donations FOR UPDATE USING (public.is_admin());

-- App Settings Policies
CREATE POLICY "Settings viewable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings" ON public.app_settings FOR ALL USING (public.is_admin());
