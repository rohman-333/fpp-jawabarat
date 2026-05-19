-- Migration 046: Add Atomic Add-to-Cart RPC function
-- Safe, secure, and authenticated only execution

create or replace function public.add_to_cart(p_product_id uuid, p_quantity int default 1)
returns public.cart_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_seller_id uuid;
  v_item public.cart_items;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get product seller_id safely
  select seller_id into v_seller_id
  from public.products
  where id = p_product_id;

  -- Insert or increment quantity atomically on unique index conflict
  insert into public.cart_items (user_id, product_id, seller_id, quantity, created_at, updated_at)
  values (v_user_id, p_product_id, v_seller_id, greatest(p_quantity, 1), now(), now())
  on conflict (user_id, product_id)
  do update set
    quantity = public.cart_items.quantity + excluded.quantity,
    updated_at = now()
  returning * into v_item;

  return v_item;
end;
$$;

-- Grant execution permission to authenticated users
grant execute on function public.add_to_cart(uuid, int) to authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
