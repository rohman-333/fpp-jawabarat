'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Apply as Courier
export async function applyAsCourier(data: {
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_plate: string;
  service_area: string;
  zone_id: string | null;
  identity_card_url: string | null;
  driver_license_url: string | null;
  vehicle_registration_url: string | null;
  selfie_url: string | null;
  can_deliver_goods: boolean;
  can_deliver_food: boolean;
  can_do_errand: boolean;
  can_ride_passenger: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login terlebih dahulu.' };

  try {
    const { error: profileError } = await supabase
      .from('courier_profiles')
      .upsert({
        user_id: user.id,
        full_name: data.full_name,
        phone: data.phone,
        vehicle_type: data.vehicle_type,
        vehicle_brand: data.vehicle_brand,
        vehicle_plate: data.vehicle_plate,
        service_area: data.service_area,
        zone_id: data.zone_id,
        status: 'pending',
        is_online: false,
        identity_card_url: data.identity_card_url,
        driver_license_url: data.driver_license_url,
        vehicle_registration_url: data.vehicle_registration_url,
        selfie_url: data.selfie_url,
        can_deliver_goods: data.can_deliver_goods,
        can_deliver_food: data.can_deliver_food,
        can_do_errand: data.can_do_errand,
        can_ride_passenger: data.can_ride_passenger,
        safety_verified: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    // Update profile status indicators
    const { error: userProfileError } = await supabase
      .from('profiles')
      .update({
        is_courier: false,
        courier_status: 'pending'
      })
      .eq('id', user.id);

    if (userProfileError) throw userProfileError;

    revalidatePath('/dashboard/courier');
    return { success: true };
  } catch (err: any) {
    console.error('[APPLY_COURIER_ERR]', err);
    return { error: 'Gagal mengajukan pendaftaran kurir. Coba lagi.' };
  }
}

// Toggle Online Status
export async function toggleOnlineStatus(isOnline: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login.' };

  try {
    const { error } = await supabase
      .from('courier_profiles')
      .update({ is_online: isOnline })
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/dashboard/courier');
    return { success: true };
  } catch (err) {
    return { error: 'Gagal merubah status online.' };
  }
}

// Calculate Shipping / Delivery Fee
export async function calculateShippingFee(
  originZoneId: string | null,
  destinationZoneId: string | null,
  serviceTypeCode: string,
  distanceKm: number = 0
) {
  const supabase = await createClient();

  try {
    // 1. Get Service Type ID
    const { data: serviceType } = await supabase
      .from('service_types')
      .select('id')
      .eq('code', serviceTypeCode)
      .maybeSingle();

    if (!serviceType) return { fare: 0, platformFee: 0, total: 0 };

    // 2. Query Fare Rules
    let query = supabase
      .from('delivery_fare_rules')
      .select('*')
      .eq('service_type_id', serviceType.id)
      .eq('is_active', true);

    if (originZoneId && destinationZoneId) {
      // Check zone-to-zone first
      const { data: zoneToZone } = await query
        .eq('origin_zone_id', originZoneId)
        .eq('destination_zone_id', destinationZoneId)
        .maybeSingle();
      
      if (zoneToZone) {
        return calculateFromRule(zoneToZone, distanceKm);
      }
    }

    // Fallback to single destination zone rule
    if (destinationZoneId) {
      const { data: destZone } = await supabase
        .from('delivery_fare_rules')
        .select('*')
        .eq('service_type_id', serviceType.id)
        .eq('zone_id', destinationZoneId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (destZone) {
        return calculateFromRule(destZone, distanceKm);
      }
    }

    // Default global fare rule (no zones specified)
    const { data: globalRule } = await supabase
      .from('delivery_fare_rules')
      .select('*')
      .eq('service_type_id', serviceType.id)
      .is('zone_id', null)
      .is('origin_zone_id', null)
      .is('destination_zone_id', null)
      .eq('is_active', true)
      .maybeSingle();

    if (globalRule) {
      return calculateFromRule(globalRule, distanceKm);
    }

    // Fallback default if no rules found
    return { fare: 10000, platformFee: 2000, total: 12000 };
  } catch (err) {
    console.error('[CALC_SHIPPING_ERR]', err);
    return { fare: 0, platformFee: 0, total: 0 };
  }
}

function calculateFromRule(rule: any, distanceKm: number) {
  const base = Number(rule.base_fare || 0);
  const perKm = Number(rule.per_km_fare || 0);
  const min = Number(rule.minimum_fare || 0);
  const max = rule.maximum_fare ? Number(rule.maximum_fare) : null;
  const platform = Number(rule.platform_fee || 0);

  let fare = base + (perKm * distanceKm);
  if (fare < min) fare = min;
  if (max !== null && fare > max) fare = max;

  return {
    fare,
    platformFee: platform,
    total: fare + platform,
    ruleId: rule.id
  };
}

// Request Courier Payout / Cashout
export async function requestPayout(data: {
  amount: number;
  method: string;
  account_name: string;
  account_number: string;
  note?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login.' };

  try {
    // 1. Get Wallet Balance
    const { data: txs } = await supabase
      .from('courier_wallet_transactions')
      .select('amount')
      .eq('courier_id', user.id)
      .eq('status', 'recorded');

    const totalEarning = txs?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0;

    // Get active payouts to see frozen / pending cashouts
    const { data: pendingPayouts } = await supabase
      .from('courier_payouts')
      .select('amount')
      .eq('courier_id', user.id)
      .eq('status', 'pending');

    const totalPending = pendingPayouts?.reduce((sum, po) => sum + Number(po.amount || 0), 0) || 0;

    const available = totalEarning - totalPending;

    if (data.amount <= 0) return { error: 'Nominal pencairan harus lebih besar dari nol.' };
    if (data.amount > available) return { error: 'Saldo Anda tidak mencukupi untuk pencairan ini.' };

    const { error } = await supabase
      .from('courier_payouts')
      .insert({
        courier_id: user.id,
        amount: data.amount,
        method: data.method,
        account_name: data.account_name,
        account_number: data.account_number,
        note: data.note || '',
        status: 'pending'
      });

    if (error) throw error;
    revalidatePath('/dashboard/courier/payouts');
    return { success: true };
  } catch (err: any) {
    console.error('[REQ_PAYOUT_ERR]', err);
    return { error: 'Gagal mengajukan pencairan. Coba lagi.' };
  }
}

// Admin Update Courier Status
export async function updateCourierStatus(
  courierId: string,
  status: 'approved' | 'rejected' | 'suspended',
  options: {
    can_ride_passenger: boolean;
    safety_verified: boolean;
    can_deliver_goods: boolean;
    can_deliver_food: boolean;
    can_do_errand: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Otorisasi gagal.' };

  // Verify Admin Role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'superadmin')) {
    return { error: 'Hanya Administrator yang diizinkan.' };
  }

  try {
    const { error: profileError } = await supabase
      .from('courier_profiles')
      .update({
        status,
        can_ride_passenger: options.can_ride_passenger,
        safety_verified: options.safety_verified,
        can_deliver_goods: options.can_deliver_goods,
        can_deliver_food: options.can_deliver_food,
        can_do_errand: options.can_do_errand,
        updated_at: new Date().toISOString()
      })
      .eq('id', courierId);

    if (profileError) throw profileError;

    // Get user id from courier profile
    const { data: cp } = await supabase
      .from('courier_profiles')
      .select('user_id')
      .eq('id', courierId)
      .single();

    if (cp) {
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          is_courier: status === 'approved',
          courier_status: status
        })
        .eq('id', cp.user_id);

      if (userError) throw userError;

      // Log notification
      await supabase.from('notifications').insert({
        user_id: cp.user_id,
        title: status === 'approved' ? 'Akun Kurir Disetujui! 🎉' : 'Pengajuan Kurir Ditinjau ⚠️',
        content: status === 'approved' 
          ? 'Selamat! Pendaftaran kurir Anda telah disetujui. Silakan masuk ke dashboard kurir untuk mengaktifkan status online.'
          : `Pengajuan kurir Anda berstatus: ${status.toUpperCase()}. Silakan periksa dokumen Anda atau hubungi Admin.`,
        type: 'system',
        is_read: false
      });
    }

    revalidatePath('/admin/couriers');
    return { success: true };
  } catch (err: any) {
    console.error('[ADMIN_COURIER_ERR]', err);
    return { error: 'Gagal memperbarui status kurir.' };
  }
}

// Admin Process Payout
export async function processPayout(payoutId: string, status: 'approved' | 'paid' | 'rejected', note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Otorisasi gagal.' };

  // Verify Admin Role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'superadmin')) {
    return { error: 'Akses ditolak.' };
  }

  try {
    const { data: payout } = await supabase
      .from('courier_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (!payout) return { error: 'Data pencairan tidak ditemukan.' };

    const { error: poError } = await supabase
      .from('courier_payouts')
      .update({
        status,
        note: note || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId);

    if (poError) throw poError;

    if (status === 'paid') {
      // Record negative transaction to lock the balance payout
      await supabase.from('courier_wallet_transactions').insert({
        courier_id: payout.courier_id,
        amount: -Number(payout.amount),
        type: 'payout',
        status: 'recorded',
        description: `Pencairan dana sukses ke ${payout.method} (${payout.account_number})`
      });

      // Notify courier
      await supabase.from('notifications').insert({
        user_id: payout.courier_id,
        title: 'Pencairan Dana Berhasil! 💸',
        content: `Dana pencairan sebesar Rp ${Number(payout.amount).toLocaleString('id-ID')} telah dikirim ke rekening Anda.`,
        type: 'system',
        is_read: false
      });
    }

    revalidatePath('/admin/courier-payouts');
    return { success: true };
  } catch (err: any) {
    console.error('[ADMIN_PAYOUT_ERR]', err);
    return { error: 'Gagal memproses transaksi pencairan.' };
  }
}

// Create General Multi-Service Request
export async function createServiceRequest(data: {
  service_type_code: string;
  origin_name: string;
  origin_phone: string;
  origin_address: string;
  origin_zone_id: string | null;
  destination_name: string;
  destination_phone: string;
  destination_address: string;
  destination_zone_id: string | null;
  item_description: string;
  item_weight: number;
  passenger_count?: number;
  pickup_note?: string;
  delivery_note?: string;
  payment_method: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login terlebih dahulu.' };

  try {
    // 1. Get Service Type
    const { data: st } = await supabase
      .from('service_types')
      .select('*')
      .eq('code', data.service_type_code)
      .single();

    if (!st) return { error: 'Tipe layanan tidak ditemukan.' };
    if (!st.is_active) return { error: 'Layanan ini belum diaktifkan oleh administrator.' };

    // Calculate shipping
    const feeRes = await calculateShippingFee(
      data.origin_zone_id,
      data.destination_zone_id,
      data.service_type_code,
      2.5 // fallback MVP distance if not calculated
    );

    // Insert Delivery order
    const { data: delivery, error: dError } = await supabase
      .from('deliveries')
      .insert({
        service_type_id: st.id,
        buyer_id: user.id,
        origin_name: data.origin_name,
        origin_phone: data.origin_phone,
        origin_address: data.origin_address,
        destination_name: data.destination_name,
        destination_phone: data.destination_phone,
        destination_address: data.destination_address,
        pickup_note: data.pickup_note || '',
        delivery_note: data.delivery_note || '',
        item_description: data.item_description,
        item_weight: data.item_weight,
        passenger_count: data.passenger_count || 1,
        fare_amount: feeRes.fare,
        platform_fee: feeRes.platformFee,
        courier_earning: Math.round(feeRes.fare * 0.8), // 80% default commission
        payment_status: data.payment_method === 'cash' ? 'unpaid' : 'paid',
        status: 'waiting_assignment'
      })
      .select('id')
      .single();

    if (dError) throw dError;

    // Log status log
    await supabase.from('delivery_status_logs').insert({
      delivery_id: delivery.id,
      status: 'waiting_assignment',
      note: 'Permintaan mobilitas dibuat oleh user, mencari kurir terdekat.',
      actor_id: user.id
    });

    return { success: true, deliveryId: delivery.id };
  } catch (err: any) {
    console.error('[SERVICE_REQ_ERR]', err);
    return { error: 'Gagal membuat permintaan mobilitas. Coba lagi.' };
  }
}

// Courier Accept Delivery Job
export async function acceptDeliveryJob(deliveryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login.' };

  try {
    const { data: cp } = await supabase
      .from('courier_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (!cp || cp.status !== 'approved') return { error: 'Akun Anda belum disetujui sebagai kurir.' };

    const { data: d } = await supabase
      .from('deliveries')
      .select('status, buyer_id')
      .eq('id', deliveryId)
      .single();

    if (!d) return { error: 'Pesanan pengiriman tidak ditemukan.' };
    if (d.status !== 'waiting_assignment' && d.status !== 'assigned') {
      return { error: 'Pesanan ini sudah diterima oleh kurir lain.' };
    }

    const { error: updateError } = await supabase
      .from('deliveries')
      .update({
        courier_id: user.id,
        courier_profile_id: cp.id,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (updateError) throw updateError;

    // Write Log
    await supabase.from('delivery_status_logs').insert({
      delivery_id: deliveryId,
      status: 'accepted',
      note: 'Pesanan diterima oleh kurir.',
      actor_id: user.id
    });

    // Create automatic chat between buyer and courier
    if (d.buyer_id) {
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', d.buyer_id)
        .eq('seller_id', user.id) // courier acts as seller
        .maybeSingle();

      if (!existingConvo) {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({
            buyer_id: d.buyer_id,
            seller_id: user.id,
            last_message: 'Halo, saya kurir Anda. Saya telah menerima tugas pengiriman ini dan akan segera memprosesnya.',
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .maybeSingle();

        if (newConvo) {
          await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: newConvo.id,
              sender_id: user.id,
              message: 'Halo, saya kurir Anda. Saya telah menerima tugas pengiriman ini dan akan segera memprosesnya.'
            });
        }
      }
    }

    revalidatePath(`/dashboard/courier/jobs`);
    revalidatePath(`/dashboard/courier/jobs/${deliveryId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[COURIER_ACCEPT_ERR]', err);
    return { error: 'Gagal menerima pesanan.' };
  }
}


// Courier Update Delivery Status Step-by-Step
export async function updateDeliveryStep(deliveryId: string, status: string, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Silakan login.' };

  try {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (!delivery) return { error: 'Pengiriman tidak ditemukan.' };

    const updateFields: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'picked_up') {
      updateFields.picked_up_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateFields.completed_at = new Date().toISOString();
      updateFields.payment_status = 'paid';
    }

    const { error } = await supabase
      .from('deliveries')
      .update(updateFields)
      .eq('id', deliveryId);

    if (error) throw error;

    // Status log record
    await supabase.from('delivery_status_logs').insert({
      delivery_id: deliveryId,
      status,
      note: note || `Status pengiriman dirubah oleh kurir ke ${status}`,
      actor_id: user.id
    });

    // Handle completed payout / earning record
    if (status === 'completed') {
      // 1. Record courier earning transaction
      const earning = Number(delivery.courier_earning || Math.round(delivery.fare_amount * 0.8));
      await supabase.from('courier_wallet_transactions').insert({
        courier_id: delivery.courier_id,
        courier_profile_id: delivery.courier_profile_id,
        delivery_id: deliveryId,
        type: 'earning',
        amount: earning,
        status: 'recorded',
        description: `Pendapatan tugas pengiriman #${deliveryId.substring(0, 8)}`
      });

      // 2. Increment total courier jobs
      const { data: cpData } = await supabase
        .from('courier_profiles')
        .select('total_jobs')
        .eq('id', delivery.courier_profile_id)
        .maybeSingle();

      await supabase
        .from('courier_profiles')
        .update({ total_jobs: (cpData?.total_jobs || 0) + 1 })
        .eq('id', delivery.courier_profile_id);

      // 3. Update related order delivery status if any
      if (delivery.order_id) {
        await supabase
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', delivery.order_id);
      }
    }

    revalidatePath(`/dashboard/courier/jobs/${deliveryId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[UPDATE_STEP_ERR]', err);
    return { error: 'Gagal memperbarui status pengiriman.' };
  }
}

// Admin Manually Assign Delivery Courier
export async function adminAssignCourier(deliveryId: string, courierId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Otorisasi gagal.' };

  // Verify Admin Role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'superadmin')) {
    return { error: 'Akses ditolak.' };
  }

  try {
    const { data: cp } = await supabase
      .from('courier_profiles')
      .select('id')
      .eq('user_id', courierId)
      .single();

    if (!cp) return { error: 'Profil kurir tidak ditemukan.' };

    const { error } = await supabase
      .from('deliveries')
      .update({
        courier_id: courierId,
        courier_profile_id: cp.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', deliveryId);

    if (error) throw error;

    await supabase.from('delivery_status_logs').insert({
      delivery_id: deliveryId,
      status: 'assigned',
      note: 'Kurir ditugaskan secara manual oleh Administrator.',
      actor_id: user.id
    });

    // Notify Courier
    await supabase.from('notifications').insert({
      user_id: courierId,
      title: 'Tugas Kurir Baru! 📦',
      content: 'Administrator telah menugaskan pengiriman baru kepada Anda. Silakan buka tugas kurir untuk merespons.',
      type: 'system',
      is_read: false
    });

    revalidatePath('/admin/deliveries');
    return { success: true };
  } catch (err) {
    return { error: 'Gagal menugaskan kurir.' };
  }
}
