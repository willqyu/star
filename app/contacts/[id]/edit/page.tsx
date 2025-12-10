import { Navbar } from '@/components/navbar';
import { ContactForm } from '@/components/forms/contact-form';
import { getContact } from '@/app/actions/contacts';
import { use } from 'react';

interface EditContactPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditContactPage({ params }: EditContactPageProps) {
  const { id } = use(params);
  const contact = use(getContact(id));

  if (!contact) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Contact not found</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Edit {contact.first_name} {contact.last_name}
        </h1>
        <ContactForm contact={contact} mode="edit" />
      </main>
    </>
  );
}
