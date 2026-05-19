// app/api/payments/midtrans/create/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createMidtransSnapTransaction } from '@/lib/payments/midtrans';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sesi Anda telah berakhir. Silakan login kembali.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Fetch Order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // 2. Validate user ownership
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Akses ditolak. Anda bukan pemilik pesanan ini.' }, { status: 403 });
    }

    // 3. Prevent recreation for already paid orders
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Pesanan ini sudah dibayar.' }, { status: 400 });
    }

    // 4. Fetch buyer profile details
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', user.id)
      .maybeSingle();

    // 5. Look up midtrans_snap payment method id
    const { data: payMethod } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('code', 'midtrans_snap')
      .maybeSingle();

    // 6. Map order items
    const items = order.order_items.map((item: any) => ({
      id: item.product_id || item.id,
      price: Number(item.product_price || 0),
      quantity: Number(item.quantity || 1),
      name: item.product_name || 'Produk'
    }));

    // Add delivery shipping as a separate line item if present
    if (order.shipping_cost && Number(order.shipping_cost) > 0) {
      items.push({
        id: 'shipping-fee',
        price: Number(order.shipping_cost),
        quantity: 1,
        name: 'Biaya Pengiriman Kurir'
      });
    }

    // 7. Create transaction on Midtrans
    const midtransInput = {
      orderId: order.id,
      invoiceNumber: order.invoice_number,
      totalAmount: Number(order.total_amount),
      buyerName: buyerProfile?.name || user.email || 'Pembeli',
      buyerEmail: user.email || undefined,
      buyerPhone: order.customer_phone || buyerProfile?.phone || '08123456789',
      shippingAddress: order.shipping_address || 'Alamat',
      items
    };

    let snapResult;
    try {
      snapResult = await createMidtransSnapTransaction(midtransInput);
    } catch (midtransErr: any) {
      console.error('[MIDTRANS_SNAP_CREATION_FAILURE]', midtransErr.message);
      return NextResponse.json({ error: 'Gagal membuat transaksi Midtrans. Silakan gunakan metode transfer manual.' }, { status: 500 });
    }

    const midtransOrderId = `${order.invoice_number}-${Date.now()}`;

    // 8. Log the payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        buyer_id: user.id,
        payment_method_id: payMethod?.id || null,
        provider: 'midtrans',
        midtrans_order_id: midtransOrderId,
        snap_token: snapResult.token,
        redirect_url: snapResult.redirect_url,
        amount: Number(order.total_amount),
        status: 'pending',
        raw_response: snapResult
      });

    if (transactionError) {
      console.error('[MIDTRANS_LOG_TRANSACTION_ERROR]', transactionError.message);
    }

    // 9. Update the Order payment method status
    await supabase
      .from('orders')
      .update({
        payment_method: 'midtrans_snap',
        payment_status: 'pending'
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url
    });

  } catch (error: any) {
    console.error('[MIDTRANS_CREATE_TRANSACTION_ERROR]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem internal.' }, { status: 500 });
  }
}
