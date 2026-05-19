import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const formData = await req.formData();
  const buyerId = formData.get('buyer_id') as string;
  const orderId = formData.get('order_id') as string;

  if (!buyerId) {
    return NextResponse.redirect(new URL('/dashboard/orders', req.url));
  }

  // Find existing conversation between this seller and buyer for this order (or general)
  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('seller_id', user.id)
    .eq('buyer_id', buyerId)
    .single();

  if (existingConvo) {
    return NextResponse.redirect(new URL(`/messages/${existingConvo.id}`, req.url));
  }

  // Create new conversation
  const { data: newConvo, error } = await supabase
    .from('conversations')
    .insert({
      seller_id: user.id,
      buyer_id: buyerId,
      order_id: orderId || null
    })
    .select('id')
    .single();

  if (error || !newConvo) {
    console.error('[MESSAGES_NEW_ROUTE_ERROR]', error);
    return NextResponse.redirect(new URL('/dashboard/orders?error=FailedToCreateChat', req.url));
  }

  return NextResponse.redirect(new URL(`/messages/${newConvo.id}`, req.url));
}
