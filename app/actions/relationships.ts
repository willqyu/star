'use server';

import { createClient } from '@/lib/supabase/server';
import { ContactRelationship, ContactRelationshipInput } from '@/lib/validation/schemas';

/**
 * Get all backlinks (who referred this contact to you)
 */
export async function getBacklinks(contactId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('contact_relationships') as any)
    .select(
      `
      id,
      relationship_type,
      notes,
      created_at,
      from_contact_id,
      from_contact:from_contact_id (
        id,
        first_name,
        last_name,
        email,
        company,
        linkedin_url
      )
    `
    )
    .eq('to_contact_id', contactId)
    .eq('relationship_type', 'referred_by')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching backlinks:', error);
    throw error;
  }

  return data;
}

/**
 * Get all contacts this contact knows
 */
export async function getKnownContacts(contactId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('contact_relationships') as any)
    .select(
      `
      id,
      relationship_type,
      notes,
      created_at,
      from_contact_id,
      to_contact:to_contact_id (
        id,
        first_name,
        last_name,
        email,
        company,
        linkedin_url
      )
    `
    )
    .eq('from_contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching known contacts:', error);
    throw error;
  }

  return data;
}

/**
 * Get all relationships for a contact (both incoming and outgoing)
 */
export async function getAllRelationships(contactId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('contact_relationships') as any)
    .select(
      `
      id,
      from_contact_id,
      to_contact_id,
      relationship_type,
      notes,
      created_at,
      from_contact:from_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      ),
      to_contact:to_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      )
    `
    )
    .or(`from_contact_id.eq.${contactId},to_contact_id.eq.${contactId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new relationship between two contacts
 */
export async function createRelationship(input: ContactRelationshipInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await (supabase
    .from('contact_relationships') as any)
    .insert([{
      user_id: user.id,
      from_contact_id: input.from_contact_id,
      to_contact_id: input.to_contact_id,
      relationship_type: input.relationship_type,
      notes: input.notes || null,
    }])
    .select();

  if (error) {
    console.error('Error creating relationship:', error);
    throw error;
  }

  return data[0] as ContactRelationship;
}

/**
 * Update a relationship
 */
export async function updateRelationship(
  relationshipId: string,
  input: Partial<ContactRelationshipInput>
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.relationship_type) updateData.relationship_type = input.relationship_type;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await (supabase
    .from('contact_relationships') as any)
    .update(updateData)
    .eq('id', relationshipId)
    .select();

  if (error) {
    console.error('Error updating relationship:', error);
    throw error;
  }

  return data[0] as ContactRelationship;
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(relationshipId: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from('contact_relationships') as any).delete().eq('id', relationshipId);

  if (error) {
    console.error('Error deleting relationship:', error);
    throw error;
  }
}

/**
 * Get network graph data for visualization
 * Returns all connections for a contact and their connected contacts
 */
export async function getNetworkGraphData(contactId: string) {
  const supabase = await createClient();

  // Get the target contact
  const { data: targetContact, error: contactError } = await (supabase
    .from('contacts') as any)
    .select('*')
    .eq('id', contactId)
    .single();

  if (contactError || !targetContact) {
    throw new Error('Contact not found');
  }

  // Get all relationships for this contact
  const { data: relationships, error: relationshipsError } = await (supabase
    .from('contact_relationships') as any)
    .select(
      `
      id,
      from_contact_id,
      to_contact_id,
      relationship_type,
      notes,
      from_contact:from_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      ),
      to_contact:to_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      )
    `
    )
    .or(`from_contact_id.eq.${contactId},to_contact_id.eq.${contactId}`);

  if (relationshipsError) {
    throw relationshipsError;
  }

  // Build nodes set (unique contacts)
  const nodesMap = new Map();
  nodesMap.set(contactId, {
    id: targetContact.id,
    name: `${targetContact.first_name} ${targetContact.last_name}`,
    email: targetContact.email,
    company: targetContact.company,
    type: 'target',
  });

  // Build edges and collect connected nodes
  const edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    notes?: string;
  }> = [];

  relationships?.forEach((rel: any) => {
    const fromId = rel.from_contact_id;
    const toId = rel.to_contact_id;

    // Add nodes if not already present
    if (!nodesMap.has(fromId) && rel.from_contact) {
      nodesMap.set(fromId, {
        id: rel.from_contact.id,
        name: `${rel.from_contact.first_name} ${rel.from_contact.last_name}`,
        email: rel.from_contact.email,
        company: rel.from_contact.company,
        type: 'connected',
      });
    }

    if (!nodesMap.has(toId) && rel.to_contact) {
      nodesMap.set(toId, {
        id: rel.to_contact.id,
        name: `${rel.to_contact.first_name} ${rel.to_contact.last_name}`,
        email: rel.to_contact.email,
        company: rel.to_contact.company,
        type: 'connected',
      });
    }

    // Add edge
    edges.push({
      id: rel.id,
      source: fromId,
      target: toId,
      type: rel.relationship_type,
      notes: rel.notes || undefined,
    });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
    targetContactId: contactId,
  };
}

/**
 * Get network statistics for a contact
 */
export async function getNetworkStats(contactId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_network_stats', {
    p_contact_id: contactId,
  });

  if (error) {
    // If the function doesn't exist, calculate manually
    console.warn('get_network_stats function not found, calculating manually');

    const { data: relationships } = await (supabase
      .from('contact_relationships') as any)
      .select('from_contact_id, to_contact_id, relationship_type')
      .or(`from_contact_id.eq.${contactId},to_contact_id.eq.${contactId}`);

    if (!relationships) {
      return {
        peopleTheyKnow: 0,
        peopleWhoKnowThem: 0,
        referrersCount: 0,
        totalConnections: 0,
      };
    }

    const peopleTheyKnow = new Set(
      relationships
        .filter((r) => r.from_contact_id === contactId)
        .map((r) => r.to_contact_id)
    ).size;

    const peopleWhoKnowThem = new Set(
      relationships
        .filter((r) => r.to_contact_id === contactId)
        .map((r) => r.from_contact_id)
    ).size;

    const referrersCount = relationships.filter(
      (r) => r.to_contact_id === contactId && r.relationship_type === 'referred_by'
    ).length;

    return {
      peopleTheyKnow,
      peopleWhoKnowThem,
      referrersCount,
      totalConnections: peopleTheyKnow + peopleWhoKnowThem,
    };
  }

  return data;
}

/**
 * Get all relationships for the entire contact network (for global graph visualization)
 */
export async function getAllNetworkRelationships() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Not authenticated');
    return [];
  }

  const { data: relationships, error } = await (supabase
    .from('contact_relationships') as any)
    .select(
      `
      id,
      from_contact_id,
      to_contact_id,
      relationship_type,
      notes,
      from_contact:from_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      ),
      to_contact:to_contact_id (
        id,
        first_name,
        last_name,
        email,
        company
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all relationships:', error);
    return [];
  }

  return relationships || [];
}
