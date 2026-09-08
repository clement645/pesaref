import type { SmsMessage, SmsProvider } from './provider';

/**
 * Development/default provider - logs instead of sending. Swap
 * SMS_PROVIDER=africastalking (and implement africastalking.provider.ts) to
 * go live.
 */
export class ConsoleSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    console.info(`[sms:disabled] to=${message.to} message="${message.message}"`);
  }
}
