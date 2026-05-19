'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from '@/lib/notifications/createNotification';

export async function addToCart(productId: string, quantity: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity
      });
      
    if (error) throw error;
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
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);
    
  const commissionSetting = commissionSettings?.[0] || { commission_type: 'percentage', percentage_rate: 0, fixed_amount: 0 };

  for (const sellerId of Object.keys(itemsBySeller)) {
    const sellerItems = itemsBySeller[sellerId];
    
    // Calculate total safely
    const totalAmount = sellerItems.reduce((sum: number, item: any) => {
      const price = item.product.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate commission
    let commissionAmount = 0;
    if (commissionSetting.commission_type === 'percentage') {
      commissionAmount = (totalAmount * (commissionSetting.percentage_rate || 0)) / 100;
    } else {
      commissionAmount = commissionSetting.fixed_amount || 0;
    }
    
    const sellerNetAmount = totalAmount - commissionAmount;

    // Create Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        shipping_cost: 0, // Placeholder for future logic
        shipping_address: shippingAddress,
        customer_phone: customerPhone,
        notes: notes,
        status: 'pending'
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
        quantity: item.quantity,
        subtotal: price * item.quantity
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;
    
    // Create Commission Ledger
    await supabase.from('platform_commission_ledger').insert({
      order_id: orderData.id,
      seller_id: sellerId,
      buyer_id: user.id,
      gross_amount: totalAmount,
      commission_amount: commissionAmount,
      seller_net_amount: sellerNetAmount,
      status: 'pending'
    });

    // Create Order Status Log
    await supabase.from('order_status_logs').insert({
      order_id: orderData.id,
      status: 'pending',
      notes: 'Order placed',
      created_by: user.id
    });

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
