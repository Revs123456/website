import { getPublicSettings } from '@/lib/settings';
import ContactClient from './ContactClient';

export default async function ContactPage() {
  const settings = await getPublicSettings();
  return <ContactClient settings={settings} />;
}
