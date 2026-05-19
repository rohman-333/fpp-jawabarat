// lib/payments/midtrans.ts

export interface MidtransOrderInput {
  orderId: string;
  invoiceNumber: string;
  totalAmount: number;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone: string;
  shippingAddress: string;
  items: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export async function createMidtransSnapTransaction(input: MidtransOrderInput): Promise<MidtransSnapResponse> {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    console.warn('[MIDTRANS_CONFIG_WARNING] Midtrans Server Key or Client Key is missing. Falling back to simulated response.');
    throw new Error('Midtrans belum dikonfigurasi.');
  }

  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  // Format request payload for Midtrans
  const payload = {
    transaction_details: {
      order_id: `${input.invoiceNumber}-${Date.now()}`,
      gross_amount: Math.round(input.totalAmount)
    },
    item_details: input.items.map(item => ({
      id: item.id.substring(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.substring(0, 50)
    })),
    customer_details: {
      first_name: input.buyerName.substring(0, 50),
      email: input.buyerEmail || `${input.buyerPhone}@wibawa-nusantara.com`,
      phone: input.buyerPhone,
      shipping_address: {
        first_name: input.buyerName.substring(0, 50),
        phone: input.buyerPhone,
        address: input.shippingAddress
      }
    },
    credit_card: {
      secure: true
    }
  };

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[MIDTRANS_API_ERROR_BODY]', errorText);
      throw new Error(`Midtrans API responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      token: data.token,
      redirect_url: data.redirect_url
    };
  } catch (error: any) {
    console.error('[MIDTRANS_REQUEST_EXCEPTION]', error.message);
    throw error;
  }
}

export async function getMidtransTransactionStatus(midtransOrderId: string): Promise<any> {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error('Midtrans Server Key is missing.');
  }

  const baseUrl = isProduction
    ? `https://api.midtrans.com/v2/${midtransOrderId}/status`
    : `https://api.sandbox.midtrans.com/v2/${midtransOrderId}/status`;

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  const res = await fetch(baseUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': authHeader
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to query Midtrans status for order ${midtransOrderId}`);
  }

  return res.json();
}
