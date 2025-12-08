import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-8">
          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Reminders</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive email notifications for upcoming tasks
                  </p>
                </div>
                <select className="w-20 px-3 py-2 border border-input rounded-md bg-white">
                  <option>On</option>
                  <option>Off</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <Label className="text-base">Digest Frequency</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    How often you want to receive summary emails
                  </p>
                </div>
                <select className="px-3 py-2 border border-input rounded-md bg-white">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cold Contacts</h2>

            <div className="space-y-4">
              <div>
                <Label>Cold Contact Threshold (days)</Label>
                <Input
                  type="number"
                  defaultValue="90"
                  placeholder="Number of days before a contact is marked as cold"
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Contacts without interactions for this many days will be flagged
                </p>
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Preferences</h2>

            <div className="space-y-4">
              <div>
                <Label>Timezone</Label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-white mt-2">
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>America/Chicago</option>
                  <option>America/Denver</option>
                  <option>America/Los_Angeles</option>
                  <option>Europe/London</option>
                  <option>Europe/Paris</option>
                  <option>Asia/Tokyo</option>
                  <option>Asia/Hong_Kong</option>
                  <option>Australia/Sydney</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
      </main>
    </>
  );
}
