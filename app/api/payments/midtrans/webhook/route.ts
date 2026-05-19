// app/api/payments/midtrans/webhook/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createNotification } from '@/lib/notifications/createNotification';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let body: any = {};
  
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    payment_type
  } = body;

  console.log('[MIDTRANS_WEBHOOK_RECEIVED]', { order_id, transaction_status, gross_amount });

  // 1. Verify Midtrans Signature Key
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const payloadToHash = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const calculatedSignature = crypto.createHash('sha512').update(payloadToHash).digest('hex');
  const isValidSignature = calculatedSignature === signature_key;

  // 2. Log callback payload for audit trail
  const { data: logRecord } = await supabase
    .from('payment_callback_logs')
    .insert({
      provider: 'midtrans',
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      payload: body,
      is_valid: isValidSignature
    })
    .select('id')
    .single();

  if (!isValidSignature) {
    console.error('[MIDTRANS_WEBHOOK_SIGNATURE_INVALID]', {
      received: signature_key,
      calculated: calculatedSignature
    });
    return NextResponse.json({ error: 'Signature key tidak valid.' }, { status: 403 });
  }

  // 3. Find matching transaction
  let { data: transaction } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('midtrans_order_id', order_id)
    .maybeSingle();

  let orderId = transaction?.order_id;

  // Fallback: If not found, split by invoice prefix
  if (!orderId && order_id) {
    const invoiceParts = order_id.split('-');
    if (invoiceParts.length >= 2) {
      const invoiceNumber = invoiceParts.slice(0, 3).join('-'); // e.g. INV-XXXXX-XXXX
      const { data: orderLookup } = await supabase
        .from('orders')
        .select('id')
        .eq('invoice_number', invoiceNumber)
        .maybeSingle();
      if (orderLookup) {
        orderId = orderLookup.id;
      }
    }
  }

  if (!orderId) {
    console.warn('[MIDTRANS_WEBHOOK_ORDER_NOT_FOUND] No matching order found for ID:', order_id);
    return NextResponse.json({ success: true, message: 'Webhook logged, but no matching order found.' });
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

  // 5. Update payment transactions status
  if (transaction) {
    await supabase
      .from('payment_transactions')
      .update({
        status: transaction_status,
        fraud_status: fraud_status || null,
        payment_type: payment_type || null,
        provider_transaction_id: body.transaction_id || null,
        raw_response: body,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);
  }

  // 6. Update main Order details
  const { data: order } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single();

  // 7. If payment succeeded, run post-payment triggers (activate delivery, notify users, record commissions)
  if (paymentStatus === 'paid' && order) {
    // A. Activate matching deliveries
    try {
      await supabase
        .from('deliveries')
        .update({
          payment_status: 'paid',
          status: 'waiting_assignment'
        })
        .eq('order_id', orderId);
    } catch (deliveryErr) {
      console.error('[MIDTRANS_WEBHOOK_DELIVERIES_ACTIVATION_ERROR]', deliveryErr);
    }

    // B. Log to order status logs
    try {
      await supabase.from('order_status_logs').insert({
        order_id: orderId,
        status: orderStatus,
        notes: `Pembayaran berhasil terverifikasi otomatis via Midtrans (${payment_type || 'snap'}).`,
        created_by: order.buyer_id
      });
    } catch (logErr) {
      console.error('[MIDTRANS_WEBHOOK_STATUS_LOG_ERROR]', logErr);
    }

    // C. Notify Buyer
    await createNotification({
      userId: order.buyer_id,
      type: 'order_status',
      title: 'Pembayaran Diterima!',
      body: `Pembayaran untuk pesanan ${order.invoice_number} berhasil diverifikasi. Pesanan sedang diproses.`,
      href: `/orders`
    }).catch(console.error);

    // D. Notify Seller
    await createNotification({
      userId: order.seller_id,
      type: 'new_order',
      title: 'Pesanan Telah Dibayar!',
      body: `Pesanan ${order.invoice_number} telah dibayar otomatis via Midtrans. Silakan siapkan pengiriman.`,
      href: `/dashboard/orders`
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
