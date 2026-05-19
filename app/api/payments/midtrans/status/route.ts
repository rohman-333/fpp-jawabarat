// app/api/payments/midtrans/status/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMidtransTransactionStatus } from '@/lib/payments/midtrans';
import { createNotification } from '@/lib/notifications/createNotification';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sesi Anda telah berakhir. Silakan login kembali.' }, { status: 401 });
    }

    // 1. Enforce Admin Access Rules
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Otoritas khusus Admin diperlukan.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { midtransOrderId } = body;

    if (!midtransOrderId) {
      return NextResponse.json({ error: 'Midtrans Order ID wajib disertakan.' }, { status: 400 });
    }

    // 2. Look up Midtrans Status directly
    let statusResponse;
    try {
      statusResponse = await getMidtransTransactionStatus(midtransOrderId);
    } catch (midtransErr: any) {
      console.error('[MIDTRANS_STATUS_QUERY_EXCEPTION]', midtransErr.message);
      return NextResponse.json({ error: 'Gagal menanyakan status ke API Midtrans.' }, { status: 500 });
    }

    const { transaction_status, fraud_status, payment_type, transaction_id } = statusResponse;

    // 3. Find matching transaction
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('midtrans_order_id', midtransOrderId)
      .maybeSingle();

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi pembayaran tidak ditemukan di database.' }, { status: 404 });
    }

    // 4. Map payment status and decide transaction resolution
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid';
        orderStatus = 'processing';
      } else {
        paymentStatus = 'deny';
        orderStatus = 'cancelled';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid';
      orderStatus = 'processing';
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
      paymentStatus = 'failed';
      orderStatus = 'cancelled';
    } else if (transaction_status === 'refund') {
      paymentStatus = 'refunded';
      orderStatus = 'cancelled';
    }

    // 5. Update payment transaction record
    await supabase
      .from('payment_transactions')
      .update({
        status: transaction_status,
        fraud_status: fraud_status || null,
        payment_type: payment_type || null,
        provider_transaction_id: transaction_id || null,
        raw_response: statusResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // 6. Update main Order details
    const { data: order } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)
      .select('*, order_items(*)')
      .single();

    // 7. Trigger success pipeline if paid
    if (paymentStatus === 'paid' && order) {
      // A. Activate deliveries
      try {
        await supabase
          .from('deliveries')
          .update({
            payment_status: 'paid',
            status: 'waiting_assignment'
          })
          .eq('order_id', order.id);
      } catch (deliveryErr) {
        console.error('[MIDTRANS_STATUS_DELIVERY_ACTIVATION_ERROR]', deliveryErr);
      }

      // B. Write to order status logs
      try {
        await supabase.from('order_status_logs').insert({
          order_id: order.id,
          status: orderStatus,
          notes: `Status pembayaran sinkron dengan Midtrans: ${transaction_status}.`,
          created_by: user.id
        });
      } catch (logErr) {
        console.error('[MIDTRANS_STATUS_LOG_ERROR]', logErr);
      }

      // C. Notify Buyer
      await createNotification({
        userId: order.buyer_id,
        type: 'order_status',
        title: 'Pembayaran Diterima!',
        body: `Pembayaran pesanan Anda ${order.invoice_number} telah terverifikasi via Midtrans.`,
        href: `/orders`
      }).catch(console.error);

      // D. Notify Seller
      await createNotification({
        userId: order.seller_id,
        type: 'new_order',
        title: 'Pesanan Telah Dibayar!',
        body: `Pesanan ${order.invoice_number} telah dibayar otomatis via Midtrans. Silakan proses.`,
        href: `/dashboard/orders`
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      transactionStatus: transaction_status,
      paymentStatus,
      orderStatus
    });

  } catch (error: any) {
    console.error('[MIDTRANS_STATUS_API_ERROR]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem internal.' }, { status: 500 });
  }
}
