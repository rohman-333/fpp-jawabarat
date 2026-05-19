import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Select-and-update approach (idempotent, safe, requires zero RPC configurations)
    const { data: ad } = await supabase
      .from('site_banners')
      .select('click_count')
      .eq('id', id)
      .single();

    if (ad) {
      await supabase
        .from('site_banners')
        .update({ click_count: (ad.click_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ADS_CLICK_API_ERR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
