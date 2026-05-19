'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const id = formData.get('id') as string;
  
  let category_id = formData.get('category_id') as string;
  let category_name = 'Lainnya';
  
  if (!category_id || category_id === '') {
    category_id = null as any;
  } else {
    // If category_id is provided, try to fetch its name or just rely on a hidden input if we had one.
    // For now we'll do a quick query, or just let category be Lainnya if not found.
    const { data: catData } = await supabase.from('product_categories').select('name').eq('id', category_id).maybeSingle();
    if (catData?.name) {
      category_name = catData.name;
    }
  }
  
  const payload = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string || (formData.get('name') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
    category_id: category_id,
    category: category_name,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    stock: parseInt(formData.get('stock') as string) || 0,
    image_url: formData.get('image_url') as string || null,
    pesantren_id: pesantren?.id || null,
    seller_id: user.id,
    status: formData.get('status') as string || 'pending'
  };

  try {
    if (id) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .eq('seller_id', user.id); // Protect RLS
      if (error) {
        console.error('[UPDATE_PRODUCT_ERROR]', error);
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([payload]);
      if (error) {
        console.error('[CREATE_PRODUCT_ERROR]', error);
        throw new Error(error.message);
      }
    }
  } catch (err) {
    console.error('[SAVE_PRODUCT_EXCEPTION]', err);
    throw err;
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/marketplace');
  redirect('/dashboard/products');
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const id = formData.get('id') as string;

  if (id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', user.id); // Protect RLS
    
    if (error) throw new Error(error.message);
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/marketplace');
  redirect('/dashboard/products');
}
