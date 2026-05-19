'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from '@/lib/notifications/createNotification';

export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnUrl=/marketplace');
  }

  let finalError: any = null;

  try {
    // 1. Try calling add_to_cart_v2 as the primary RPC
    const { error: rpcErrorV2 } = await supabase.rpc('add_to_cart_v2', {
      p_product_id: productId,
      p_quantity: quantity
    });

    if (rpcErrorV2) {
      console.warn('RPC add_to_cart_v2 failed, trying fallback add_to_cart...', rpcErrorV2.message);
      
      // 2. Fallback to add_to_cart RPC
      const { error: rpcErrorV1 } = await supabase.rpc('add_to_cart', {
        p_product_id: productId,
        p_quantity: quantity
      });

      if (rpcErrorV1) {
        finalError = rpcErrorV1;
      }
    }
  } catch (rpcErr: any) {
    finalError = rpcErr;
  }

  // 3. Fallback Update if RPC failed or unique key constraint was encountered
  if (finalError) {
    console.warn('RPC addition failed, triggering manual fallback update strategy...', finalError.message);
    try {
      // Find existing item
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: (existingItem.quantity || 0) + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);
        
        if (updateError) throw updateError;
      } else {
        // Safe manual insert
        const { data: product } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', productId)
          .maybeSingle();

        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            seller_id: product?.seller_id || null,
            quantity: quantity
          });

        if (insertError) {
          // If a race condition occurred and unique constraint violation (23505) occurs
          if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
            const { data: retryItem } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('user_id', user.id)
              .eq('product_id', productId)
              .maybeSingle();
            
            if (retryItem) {
              const { error: finalUpdateError } = await supabase
                .from('cart_items')
                .update({ 
                  quantity: (retryItem.quantity || 0) + quantity,
                  updated_at: new Date().toISOString()
                })
                .eq('id', retryItem.id);
              if (finalUpdateError) throw finalUpdateError;
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }
    } catch (manualErr: any) {
      console.error('Centralized addToCart manual fallback failure:', manualErr);
      return { error: 'Gagal menambahkan ke keranjang. Coba lagi.' };
    }
  }

  revalidatePath('/cart');
  return { success: true };
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id);

  if (error) throw error;
  revalidatePath('/cart');
  return { success: true };
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id);

  if (error) throw error;
  revalidatePath('/cart');
  return { success: true };
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const shippingAddress = formData.get('shipping_address') as string;
  const customerPhone = formData.get('customer_phone') as string;
  const notes = formData.get('notes') as string;

  // 1. Get cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`
      id, quantity,
      product:product_id (
        id, name, price, seller_id
      )
    `)
    .eq('user_id', user.id);

  if (!cartItems || cartItems.length === 0) {
    return { error: 'Cart is empty' };
  }

  // Filter out any invalid items without valid products or valid seller_id
  const validCartItems = cartItems.filter((item: any) => item?.product && item?.product?.seller_id);

  if (validCartItems.length === 0) {
    return { error: 'Keranjang belanja tidak memiliki produk yang valid' };
  }

  // Group by seller to create multiple orders if items are from different sellers
  const itemsBySeller = validCartItems.reduce((acc: any, item: any) => {
    const sellerId = item.product.seller_id;
    if (!acc[sellerId]) acc[sellerId] = [];
    acc[sellerId].push(item);
    return acc;
  }, {});

  // Get active commission setting
  const { data: commissionSettings } = await supabase
    .from('platform_commission_settings')
    .select('commission_percentage')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);
    
  const commissionPercentage = commissionSettings?.[0]?.commission_percentage ?? 10; // Default 10% platform fee

  for (const sellerId of Object.keys(itemsBySeller)) {
    const sellerItems = itemsBySeller[sellerId];
    
    // Calculate total safely
    const totalAmount = sellerItems.reduce((sum: number, item: any) => {
      const price = item.product.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate commission
    const commissionAmount = (totalAmount * commissionPercentage) / 100;
    const sellerNetAmount = totalAmount - commissionAmount;

    // Create Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        subtotal: totalAmount,
        platform_fee: commissionAmount,
        shipping_cost: 0, // Placeholder for future logic
        shipping_address: shippingAddress,
        customer_phone: customerPhone,
        notes: notes,
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // Create Order Items
    const orderItemsToInsert = sellerItems.map((item: any) => {
      const price = item.product.price || 0;
      return {
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: price,
        seller_id: sellerId,
        quantity: item.quantity,
        subtotal: price * item.quantity
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;
    
    // Create Commission Ledger
    try {
      await supabase.from('platform_commission_ledger').insert({
        order_id: orderData.id,
        gross_amount: totalAmount,
        commission_amount: commissionAmount,
        seller_net_amount: sellerNetAmount,
        status: 'recorded'
      });
    } catch (e) {
      console.error('Failed to create platform_commission_ledger record:', e);
    }

    // Create Order Status Log
    try {
      await supabase.from('order_status_logs').insert({
        order_id: orderData.id,
        status: 'pending',
        notes: 'Order placed',
        created_by: user.id
      });
    } catch (e) {
      console.error('Failed to create order_status_logs record:', e);
    }

    // Notify Buyer
    await createNotification({
      userId: user.id,
      type: 'order_status',
      title: 'Pesanan Dibuat',
      body: `Pesanan Anda ${invoiceNumber} berhasil dibuat dan menunggu konfirmasi.`,
      href: `/orders`
    });

    // Notify Seller
    await createNotification({
      userId: sellerId,
      type: 'new_order',
      title: 'Pesanan Baru Masuk!',
      body: `Anda mendapat pesanan baru ${invoiceNumber}. Segera proses pesanan ini.`,
      href: `/dashboard/orders`
    });
  }

  // Clear Cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  revalidatePath('/orders');
  redirect('/orders');
}
