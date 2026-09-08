import { Mail, Phone } from 'lucide-react';
import { getSetting, SETTING_KEYS } from '@/lib/services/settings.service';

export const metadata = { title: 'Contact - PesaRef' };

export default async function ContactPage() {
  const [supportEmail, supportPhone] = await Promise.all([
    getSetting(SETTING_KEYS.SUPPORT_EMAIL),
    getSetting(SETTING_KEYS.SUPPORT_PHONE),
  ]);

  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-3 text-muted-foreground">
        Have a question about your account, a payment, or a withdrawal? Reach out to our support
        team.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/50">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{supportEmail}</p>
          </div>
        </a>
        <a href={`tel:${supportPhone}`} className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/50">
          <Phone className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Phone</p>
            <p className="text-sm text-muted-foreground">{supportPhone}</p>
          </div>
        </a>
      </div>
    </div>
  );
}
