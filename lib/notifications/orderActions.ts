'use server';

import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/createNotification';

/**
 * Send order notifications to both buyer and seller.
 * Called after order is created on checkout.
 */
export async function sendOrderNotifications({
  orderId,
  buyerId,
  sellerId,
  invoiceNumber,
}: {
  orderId: string;
  buyerId: string;
  sellerId: string;
  invoiceNumber: string;
}) {
  try {
    const supabase = await createClient();

    // Buyer notification
    await createNotification({
      userId: buyerId,
      type: 'order_update',
      title: 'Pesanan Berhasil Dibuat',
      body: `Pesanan ${invoiceNumber} berhasil dibuat. Silakan hubungi seller untuk konfirmasi pembayaran.`,
      href: '/orders',
    });

    // Seller notification
    if (sellerId && sellerId !== buyerId) {
      const { data: buyer } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', buyerId)
        .single();
      const buyerName = buyer?.name || 'Pembeli';

      await createNotification({
        userId: sellerId,
        actorId: buyerId,
        type: 'order_update',
        title: 'Pesanan Baru Masuk 🛒',
        body: `${buyerName} memesan produk Anda. Invoice: ${invoiceNumber}`,
        href: '/dashboard/orders',
      });
    }
  } catch (err) {
    console.error('[SEND_ORDER_NOTIFICATIONS_ERROR]', err);
  }
}

/**
 * Notify buyer when order status changes.
 */
export async function sendOrderStatusNotification({
  buyerId,
  newStatus,
  invoiceNumber,
}: {
  buyerId: string;
  newStatus: string;
  invoiceNumber: string;
}) {
  try {
    const statusLabels: Record<string, string> = {
      paid: 'Pembayaran dikonfirmasi',
      processing: 'Pesanan sedang diproses',
      shipped: 'Pesanan sedang dikirim',
      delivered: 'Pesanan telah diterima',
      cancelled: 'Pesanan dibatalkan',
    };

    const label = statusLabels[newStatus] || `Status berubah: ${newStatus}`;

    await createNotification({
      userId: buyerId,
      type: 'order_update',
      title: label,
      body: `Update pesanan ${invoiceNumber}: ${label}.`,
      href: '/orders',
    });
  } catch (err) {
    console.error('[SEND_ORDER_STATUS_NOTIF_ERROR]', err);
  }
}
