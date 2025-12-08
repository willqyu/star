import { Navbar } from '@/components/navbar';
import { ContactForm } from '@/components/forms/contact-form';
import { getContact } from '@/app/actions/contacts';

interface EditContactPageProps {
  params: {
    id: string;
  };
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const contact = await getContact(params.id);

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
