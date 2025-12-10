'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Network } from 'lucide-react';
import { listContacts, searchContacts } from '@/app/actions/contacts';
import { getAllNetworkRelationships } from '@/app/actions/relationships';
import { Contact } from '@/lib/validation/schemas';
import { formatDistanceToNow } from 'date-fns';
import { GlobalNetworkGraph } from '@/components/global-network-graph';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [showGraphDialog, setShowGraphDialog] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const [contactsData, relationshipsData] = await Promise.all([
          listContacts(),
          getAllNetworkRelationships(),
        ]);

        setContacts(contactsData);
        setFilteredContacts(contactsData);

        // Build graph data from relationships
        if (relationshipsData && relationshipsData.length > 0) {
          const nodesMap = new Map();

          // Add all contacts as nodes
          contactsData.forEach((contact) => {
            nodesMap.set(contact.id, {
              id: contact.id,
              name: `${contact.first_name} ${contact.last_name}`,
              email: contact.email,
              company: contact.company,
            });
          });

          // Build edges from relationships
          const edges = relationshipsData.map((rel: any) => ({
            id: rel.id,
            source: rel.from_contact_id,
            target: rel.to_contact_id,
            type: rel.relationship_type,
            notes: rel.notes,
          }));

          setGraphData({
            nodes: Array.from(nodesMap.values()),
            edges,
          });
        } else if (contactsData.length > 0) {
          // No relationships, just show contacts as nodes
          const nodes = contactsData.map((contact) => ({
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            company: contact.company,
          }));
          setGraphData({ nodes, edges: [] });
        }
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setFilteredContacts(contacts);
        return;
      }

      try {
        const results = await searchContacts(searchQuery);
        setFilteredContacts(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    handleSearch();
  }, [searchQuery, contacts]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading contacts...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">Manage and track your relationships</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showGraphDialog} onOpenChange={setShowGraphDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Network className="w-4 h-4 mr-2" />
                  Network Graph
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Your Contact Network</DialogTitle>
                </DialogHeader>
                <GlobalNetworkGraph
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  interactive={true}
                />
              </DialogContent>
            </Dialog>
            <Link href="/contacts/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Contact
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search contacts by name, email, or company..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first contact'}
            </p>
            {!searchQuery && (
              <Link href="/contacts/new">
                <Button>Create First Contact</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="block p-6 bg-white rounded-lg border border-border hover:shadow-lg hover:border-blue-300 transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {contact.first_name} {contact.last_name}
                </h3>

                {contact.company && (
                  <p className="text-sm text-gray-600 mt-1">{contact.company}</p>
                )}

                {contact.role && (
                  <p className="text-sm text-gray-500">{contact.role}</p>
                )}

                <div className="mt-4 space-y-2">
                  {contact.email && (
                    <p className="text-sm text-gray-600 truncate">📧 {contact.email}</p>
                  )}

                  {contact.phone && (
                    <p className="text-sm text-gray-600 truncate">📞 {contact.phone}</p>
                  )}
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Score: {contact.relationship_score}</span>
                    {contact.last_interaction_at && (
                      <span>
                        Last: {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
