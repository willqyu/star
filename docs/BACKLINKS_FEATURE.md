# Backlinks & Network Visualization Feature

## Overview

This feature adds relationship tracking and network visualization to your Personal CRM. You can now:

- **Track who referred contacts to you** (referred_by relationships)
- **Record who each contact knows** (knows relationships)
- **Visualize your entire contact network** as an interactive node graph
- **See network statistics** for each contact
- **Manage and edit relationships** with an intuitive UI

## What Was Added

### Database Changes

A new `contact_relationships` table was created to track connections between contacts with:
- Relationship types: `referred_by`, `knows`, `works_with`, `friend`
- Bidirectional tracking (from/to contacts)
- Optional notes for each relationship
- Full Row Level Security (RLS) for user data isolation

**Migration file:** `/supabase/migrations/002_add_relationships.sql`

### Backend (Server Actions)

New file: `/app/actions/relationships.ts`

Available functions:
- `getBacklinks(contactId)` - Get who referred this contact
- `getKnownContacts(contactId)` - Get who this contact knows
- `getAllRelationships(contactId)` - Get all connections (bidirectional)
- `createRelationship()` - Add a new connection
- `updateRelationship()` - Edit a relationship
- `deleteRelationship()` - Remove a relationship
- `getNetworkGraphData()` - Get visualization data
- `getNetworkStats()` - Get network statistics

### Frontend Components

#### 1. RelationshipManager (`/components/relationship-manager.tsx`)
Interactive component for managing connections:
- Add new relationships with a dialog
- Edit existing relationships
- Delete relationships
- Displays incoming (referrers) and outgoing (knows) relationships
- Shows relationship type, company, and notes

#### 2. NetworkGraph (`/components/network-graph.tsx`)
Interactive canvas-based visualization:
- Force-directed layout with target contact in center
- Click and drag to pan
- Scroll to zoom
- Click nodes to view details
- Color-coded nodes (blue for target, gray for connections)
- Hover effects and relationship labels
- Reset view button

### Updated Contact Detail Page

`/app\contacts\[id]\page.tsx` now includes:
- Relationship Manager section for adding/editing/deleting connections
- Network Statistics dashboard showing:
  - Total Connections
  - People They Know
  - People Who Know Them
  - Referrers Count
- "View Graph" button to open interactive visualization

### Documentation

New file: `/docs/RELATIONSHIP_QUERIES.md`

Contains 8 ready-to-use SQL queries:
1. Create relationships table (setup)
2. Get all backlinks for a contact
3. Get all connections from a contact
4. Build a network graph for visualization
5. Get all relationships for export
6. Find paths between two contacts
7. Get network statistics
8. Find mutual connections

## Setup Instructions

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Click **SQL Editor** → **New Query**
3. Open `/supabase/migrations/002_add_relationships.sql`
4. Copy the entire content
5. Paste into the SQL Editor
6. Click **Run**

Alternatively, use the individual query from `/docs/RELATIONSHIP_QUERIES.md` (Query #1)

### Step 2: Verify Table Creation

1. Go to **Table Editor** in Supabase Dashboard
2. Verify you see the `contact_relationships` table
3. Check that RLS policies are enabled

### Step 3: Test the Feature

1. Run your app: `npm run dev`
2. Navigate to any contact's detail page
3. Click "Add Connection" button
4. Create a test relationship
5. Verify it appears in the list
6. Click "View Graph" to see the visualization

## Usage Guide

### Adding a Relationship

1. Go to a contact's detail page
2. Scroll to "Network Connections" section
3. Click **Add Connection** button
4. Select direction: "This person knows..." or "This person was referred by..."
5. Choose a contact from the dropdown
6. Select relationship type (knows, works_with, friend, referred_by)
7. Optionally add notes
8. Click **Add Connection**

### Viewing the Network Graph

1. Go to contact's detail page
2. Scroll to "Network Overview" section
3. Click **View Graph** button
4. Interact with the graph:
   - **Drag** to pan around
   - **Scroll** to zoom in/out
   - **Click** a node to see details
   - **Click buttons** to zoom or reset view

### Understanding Network Statistics

- **Total Connections**: Sum of all incoming and outgoing relationships
- **People They Know**: Contacts this person is connected to
- **People Who Know Them**: Contacts who referred them or are connected to them
- **Referrers**: Count of people who specifically referred this contact

### Editing Relationships

1. Scroll to "Who referred them" or "Who they know" sections
2. Click the **Edit** (pencil) icon on any relationship
3. Modify the relationship type or notes
4. Click **Update Connection**

### Deleting Relationships

1. Scroll to the relationship you want to remove
2. Click the **Delete** (trash) icon
3. Confirm when prompted

## Database Queries

### Quick Reference

For manual testing in Supabase SQL Editor:

```sql
-- See all relationships for a user
SELECT * FROM contact_relationships 
WHERE user_id = '<YOUR_USER_ID>'
ORDER BY created_at DESC;

-- See relationships for a specific contact
SELECT * FROM contact_relationships 
WHERE from_contact_id = '<CONTACT_ID>' 
   OR to_contact_id = '<CONTACT_ID>'
ORDER BY created_at DESC;

-- Count statistics
SELECT 
  COUNT(*) as total_relationships,
  COUNT(DISTINCT from_contact_id) as unique_from_contacts,
  COUNT(DISTINCT to_contact_id) as unique_to_contacts
FROM contact_relationships
WHERE user_id = '<YOUR_USER_ID>';
```

See `/docs/RELATIONSHIP_QUERIES.md` for more complex queries.

## API Reference

### Server Actions

All functions are in `/app/actions/relationships.ts` and are server-side only:

```typescript
// Get backlinks (who referred this person)
const backlinks = await getBacklinks(contactId: string);

// Get outgoing connections
const known = await getKnownContacts(contactId: string);

// Get all relationships (both directions)
const all = await getAllRelationships(contactId: string);

// Create new relationship
const rel = await createRelationship({
  from_contact_id: string;
  to_contact_id: string;
  relationship_type: 'referred_by' | 'knows' | 'works_with' | 'friend';
  notes?: string;
});

// Update relationship
await updateRelationship(relationshipId: string, {
  relationship_type?: string;
  notes?: string;
});

// Delete relationship
await deleteRelationship(relationshipId: string);

// Get graph visualization data
const graph = await getNetworkGraphData(contactId: string);
// Returns: { nodes: [...], edges: [...], targetContactId: string }

// Get network stats
const stats = await getNetworkStats(contactId: string);
// Returns: {
//   peopleTheyKnow: number,
//   peopleWhoKnowThem: number,
//   referrersCount: number,
//   totalConnections: number
// }
```

## Components

### RelationshipManager

```tsx
<RelationshipManager
  contactId={string}           // ID of the main contact
  allContacts={Contact[]}       // All available contacts
  relationships={...}           // Current relationships
  onRelationshipAdded={fn}      // Callback when relationship added
  onRelationshipDeleted={fn}    // Callback when relationship deleted
/>
```

### NetworkGraph

```tsx
<NetworkGraph
  nodes={Node[]}               // Contact nodes
  edges={Edge[]}               // Relationships as edges
  targetContactId={string}     // ID of main contact
  interactive={true}           // Enable pan/zoom/click
/>
```

## Types

### ContactRelationship

```typescript
interface ContactRelationship {
  id: string;
  user_id: string;
  from_contact_id: string;
  to_contact_id: string;
  relationship_type: 'referred_by' | 'knows' | 'works_with' | 'friend';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

## Troubleshooting

### Relationships not showing up
- Verify the migration was run successfully
- Check that you're logged in (RLS policies require user context)
- Verify contacts belong to the same user

### Graph not rendering
- Check browser console for errors
- Verify `networkGraphData` is not null
- Ensure contacts have names

### Slow queries with many relationships
- The table has indexes on `user_id`, `from_contact_id`, and `to_contact_id`
- For 1000+ relationships, consider archiving old relationships

### RLS Policy Errors
- Ensure you're authenticated
- Check that the user making the request matches the `user_id` in the table

## Performance Notes

- Queries are indexed for fast lookups
- Maximum 100 relationships recommended per contact for smooth graph rendering
- Network graph uses canvas rendering (performant even with 50+ nodes)
- All data is filtered by `user_id` via RLS policies (secure by default)

## Future Enhancements

Potential features to add:
- Export network as GraphML or JSON
- Find common connections between two people
- Network clustering analysis
- Path finding (degrees of separation)
- Relationship strength scoring
- Timeline view of network growth
- Import from LinkedIn/external contacts
- Network comparison (your network vs. theirs)

## Support

For issues or questions:
1. Check `/docs/RELATIONSHIP_QUERIES.md` for SQL examples
2. Review component props in the source files
3. Check browser console for error messages
4. Verify RLS policies in Supabase dashboard
