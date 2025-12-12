import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the relationship where this contact was referred by someone
    const { data, error } = await supabase
      .from('contact_relationships')
      .select(`
        id,
        from_contact_id,
        contacts!contact_relationships_from_contact_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('to_contact_id', id)
      .eq('relationship_type', 'referred_by')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const referredBy = data?.contacts || null;

    return NextResponse.json({ referredBy });
  } catch (error) {
    console.error('Error fetching referred by info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referred by info' },
      { status: 500 }
    );
  }
}
