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
  const sellerId = formData.get('seller_id') as string;
  const orderId = formData.get('order_id') as string;

  if (!sellerId) {
    return NextResponse.redirect(new URL('/orders', req.url));
  }

  // Find existing conversation between this buyer and seller for this order (or general)
  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .single();

  if (existingConvo) {
    return NextResponse.redirect(new URL(`/messages/${existingConvo.id}`, req.url));
  }

  // Create new conversation
  const { data: newConvo, error } = await supabase
    .from('conversations')
    .insert({
      buyer_id: user.id,
      seller_id: sellerId,
      order_id: orderId || null
    })
    .select('id')
    .single();

  if (error || !newConvo) {
    console.error('[MESSAGES_NEW_ROUTE_ERROR]', error);
    return NextResponse.redirect(new URL('/orders?error=FailedToCreateChat', req.url));
  }

  return NextResponse.redirect(new URL(`/messages/${newConvo.id}`, req.url));
}
