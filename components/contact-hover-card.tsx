import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ContactHoverCardProps {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    company?: string | null;
    role?: string | null;
  };
}

interface ReferredByInfo {
  first_name: string;
  last_name: string;
}

export function ContactHoverCard({ contact }: ContactHoverCardProps) {
  const [referredBy, setReferredBy] = useState<ReferredByInfo | null>(null);

  useEffect(() => {
    const fetchReferredBy = async () => {
      try {
        // Fetch relationship info for this contact
        const response = await fetch(`/api/contacts/${contact.id}/referred-by`);
        if (response.ok) {
          const data = await response.json();
          if (data.referredBy) {
            setReferredBy(data.referredBy);
          }
        }
      } catch (error) {
        console.error('Failed to fetch referred by info:', error);
      }
    };

    fetchReferredBy();
  }, [contact.id]);

  return (
    <div className="relative group inline-block">
      <Link href={`/contacts/${contact.id}`}>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer">
          👤 {contact.first_name} {contact.last_name}
        </span>
      </Link>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-lg">
          <div className="font-semibold mb-2">
            {contact.first_name} {contact.last_name}
          </div>
          
          {contact.company && (
            <div className="text-gray-200 mb-1">
              <span className="text-gray-400">Company:</span> {contact.company}
            </div>
          )}
          
          {contact.role && (
            <div className="text-gray-200 mb-1">
              <span className="text-gray-400">Role:</span> {contact.role}
            </div>
          )}
          
          {referredBy && (
            <div className="text-gray-200 pt-1 border-t border-gray-700 mt-1">
              <span className="text-gray-400">Referred by:</span> {referredBy.first_name} {referredBy.last_name}
            </div>
          )}

          {!contact.company && !contact.role && !referredBy && (
            <div className="text-gray-400 italic">No additional details</div>
          )}

          {/* Arrow pointer */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
