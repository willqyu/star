'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, CheckSquare, Settings, BarChart3, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-xl text-blue-600">
              CRM
            </Link>

            <div className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                href="/contacts"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/contacts')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Contacts
              </Link>

              <Link
                href="/tasks"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/tasks')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Tasks
              </Link>

              <Link
                href="/settings"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
