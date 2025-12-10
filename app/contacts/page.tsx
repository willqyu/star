'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, RotateCcw, Linkedin } from 'lucide-react';
import { listContacts, searchContacts } from '@/app/actions/contacts';
import { Contact } from '@/lib/validation/schemas';
import { formatDistanceToNow } from 'date-fns';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadContacts = async (skipCache = false) => {
    try {
      if (skipCache) {
        setIsReloading(true);
      }
      const contactsData = await listContacts();
      setContacts(contactsData);
      setFilteredContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
      setIsReloading(false);
    }
  };

  const handleReload = () => {
    loadContacts(true);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(async () => {
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
    }, 300); // 300ms debounce delay

    // Cleanup timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, contacts]);

  if (loading) {
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
              disabled
            />
          </div>

          <div className="text-center py-12 bg-white rounded-lg border border-border">
            <p className="text-gray-500">Loading contacts...</p>
          </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              disabled={isReloading}
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isReloading ? 'animate-spin' : ''}`} />
              {isReloading ? 'Reloading...' : 'Reload'}
            </Button>
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
              <div
                key={contact.id}
                className="relative p-6 bg-white rounded-lg border border-border hover:shadow-lg hover:border-blue-300 transition-all"
              >
                <Link
                  href={`/contacts/${contact.id}`}
                  className="block"
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
                    {contact.last_interaction_at && (
                      <p className="text-xs text-gray-500">
                        Last: {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </Link>

                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Open LinkedIn profile"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
