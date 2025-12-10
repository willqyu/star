import { Navbar } from '@/components/navbar';
import { listContacts } from '@/app/actions/contacts';
import { listTasks } from '@/app/actions/tasks';
import { listRecentInteractions } from '@/app/actions/interactions';
import { Button } from '@/components/ui/button';
import { QuickInteractionLogger } from '@/components/quick-interaction-logger';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Calendar, MessageSquare, Phone } from 'lucide-react';

export default async function DashboardPage() {
  const contacts = await listContacts();
  const tasks = await listTasks('open');
  const interactions = await listRecentInteractions(5);

  const recentContacts = contacts.slice(0, 5);
  const upcomingTasks = tasks.filter((t) => t.due_at).slice(0, 5);

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's an overview of your relationships and tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-border">
            <div className="text-sm font-medium text-gray-500">Total Contacts</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{contacts.length}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-border">
            <div className="text-sm font-medium text-gray-500">Open Tasks</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-border">
            <div className="text-sm font-medium text-gray-500">Recent Interactions</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{interactions.length}</div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-100">
            <div className="text-sm font-medium text-blue-600 mb-2">Quick Add</div>
            <div className="space-y-2">
              <QuickInteractionLogger contacts={contacts} />
              <Link href="/contacts/new" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Contact
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Tasks */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow border border-border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
            ) : (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.due_at && (
                        <p className="text-sm text-gray-500">
                          Due {formatDistanceToNow(new Date(task.due_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 2
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow border border-border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>

            {interactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent interactions</p>
            ) : (
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                    <div className="flex-shrink-0 mt-1 text-gray-400">
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {interaction.type}
                      </p>
                      {interaction.notes && (
                        <p className="text-xs text-gray-500 truncate">{interaction.notes}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="mt-8 bg-white rounded-lg shadow border border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Contacts</h2>
            <Link href="/contacts">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {recentContacts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contacts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {recentContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="p-4 border border-border rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <h3 className="font-medium text-gray-900 truncate">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  {contact.company && (
                    <p className="text-sm text-gray-500 truncate">{contact.company}</p>
                  )}
                  {contact.email && (
                    <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                  )}
                  {contact.last_interaction_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last: {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
