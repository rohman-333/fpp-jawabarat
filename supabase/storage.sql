-- Create buckets for uploads
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('pesantren_logos', 'pesantren_logos', true);
insert into storage.buckets (id, name, public) values ('product_images', 'product_images', true);

-- Storage Policies
-- Avatars
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Anyone can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );

-- Pesantren Logos
create policy "Pesantren logos are publicly accessible." on storage.objects for select using ( bucket_id = 'pesantren_logos' );
create policy "Authenticated users can upload pesantren logos." on storage.objects for insert with check ( bucket_id = 'pesantren_logos' AND auth.role() = 'authenticated' );
create policy "Pesantren owners can update their own logos." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'pesantren_logos' );

-- Product Images
create policy "Product images are publicly accessible." on storage.objects for select using ( bucket_id = 'product_images' );
create policy "Authenticated users can upload product images." on storage.objects for insert with check ( bucket_id = 'product_images' AND auth.role() = 'authenticated' );
create policy "Users can update their own product images." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'product_images' );
