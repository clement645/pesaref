import type { EmailMessage, EmailProvider } from './provider';
import { ConsoleEmailProvider } from './console.provider';

let provider: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (provider) return provider;

  const kind = process.env.EMAIL_PROVIDER ?? 'console';
  switch (kind) {
    // To enable Resend: implement resend.provider.ts using RESEND_API_KEY
    // and EMAIL_FROM, then wire it in here as `case 'resend':`.
    case 'console':
    default:
      provider = new ConsoleEmailProvider();
  }
  return provider;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await getProvider().send(message);
}
