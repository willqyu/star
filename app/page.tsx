import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4 w-full">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          STAR: Personal CRM
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Never lose track of your relationships. Manage contacts, log interactions,
          track tasks, and automate reminders—all in one place.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/login">
            <Button size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-lg mb-2">Manage Contacts</h3>
            <p className="text-gray-600 text-sm">
              Store contact information with notes, tags, and relationship scores
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-lg mb-2">Log Interactions</h3>
            <p className="text-gray-600 text-sm">
              Record every touchpoint: calls, emails, meetings, and more
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">⏰</div>
            <h3 className="font-semibold text-lg mb-2">Stay Organized</h3>
            <p className="text-gray-600 text-sm">
              Manage tasks, set reminders, and follow-up on cadences automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
