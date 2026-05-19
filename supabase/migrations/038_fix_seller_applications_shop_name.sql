-- Fix seller_applications shop_name
-- If store_name exists but shop_name is null, update shop_name
UPDATE public.seller_applications
SET shop_name = store_name
WHERE shop_name IS NULL AND store_name IS NOT NULL;

-- Also update business_category if category exists
UPDATE public.seller_applications
SET business_category = category
WHERE business_category IS NULL AND category IS NOT NULL;

NOTIFY pgrst, 'reload schema';
