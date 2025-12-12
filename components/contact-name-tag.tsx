'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ContactNameTagProps {
  contactId: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  role?: string | null;
  variant?: 'default' | 'inline' | 'card';
}

interface ReferredByInfo {
  first_name: string;
  last_name: string;
}

export function ContactNameTag({
  contactId,
  firstName,
  lastName,
  company,
  role,
  variant = 'default',
}: ContactNameTagProps) {
  const [referredBy, setReferredBy] = useState<ReferredByInfo | null>(null);

  useEffect(() => {
    const fetchReferredBy = async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}/referred-by`);
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
  }, [contactId]);

  if (variant === 'inline') {
    // Simple inline version for use in relationship cards
    return (
      <Link href={`/contacts/${contactId}`}>
        <span className="font-medium text-sm text-blue-600 hover:underline cursor-pointer">
          {firstName} {lastName}
        </span>
      </Link>
    );
  }

  if (variant === 'card') {
    // Card variant for relationship cards with hover tooltip
    return (
      <div className="relative group inline-block">
        <Link href={`/contacts/${contactId}`}>
          <span className="font-medium text-sm text-blue-600 hover:underline cursor-pointer">
            {firstName} {lastName}
          </span>
        </Link>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-lg">
            <div className="font-semibold mb-2">
              {firstName} {lastName}
            </div>

            {company && (
              <div className="text-gray-200 mb-1">
                <span className="text-gray-400">Company:</span> {company}
              </div>
            )}

            {role && (
              <div className="text-gray-200 mb-1">
                <span className="text-gray-400">Role:</span> {role}
              </div>
            )}

            {referredBy && (
              <div className="text-gray-200 pt-1 border-t border-gray-700 mt-1">
                <span className="text-gray-400">Referred by:</span> {referredBy.first_name}{' '}
                {referredBy.last_name}
              </div>
            )}

            {!company && !role && !referredBy && (
              <div className="text-gray-400 italic">No additional details</div>
            )}

            {/* Arrow pointer */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - badge style with hover tooltip (original ContactHoverCard style)
  return (
    <div className="relative group inline-block">
      <Link href={`/contacts/${contactId}`}>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer">
          👤 {firstName} {lastName}
        </span>
      </Link>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-lg">
          <div className="font-semibold mb-2">
            {firstName} {lastName}
          </div>

          {company && (
            <div className="text-gray-200 mb-1">
              <span className="text-gray-400">Company:</span> {company}
            </div>
          )}

          {role && (
            <div className="text-gray-200 mb-1">
              <span className="text-gray-400">Role:</span> {role}
            </div>
          )}

          {referredBy && (
            <div className="text-gray-200 pt-1 border-t border-gray-700 mt-1">
              <span className="text-gray-400">Referred by:</span> {referredBy.first_name}{' '}
              {referredBy.last_name}
            </div>
          )}

          {!company && !role && !referredBy && (
            <div className="text-gray-400 italic">No additional details</div>
          )}

          {/* Arrow pointer */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
