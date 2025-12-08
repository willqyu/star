import { Navbar } from '@/components/navbar';
import { ContactForm } from '@/components/forms/contact-form';

export default function NewContactPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Contact</h1>
        <ContactForm mode="create" />
      </main>
    </>
  );
}
