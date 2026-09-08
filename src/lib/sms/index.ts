import type { SmsMessage, SmsProvider } from './provider';
import { ConsoleSmsProvider } from './console.provider';

let provider: SmsProvider | null = null;

function getProvider(): SmsProvider {
  if (provider) return provider;

  const kind = process.env.SMS_PROVIDER ?? 'console';
  switch (kind) {
    // To enable Africa's Talking: implement africastalking.provider.ts using
    // AFRICASTALKING_API_KEY/USERNAME/SENDER_ID, then wire it in here.
    case 'console':
    default:
      provider = new ConsoleSmsProvider();
  }
  return provider;
}

export async function sendSms(message: SmsMessage): Promise<void> {
  await getProvider().send(message);
}
