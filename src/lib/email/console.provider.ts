import type { EmailMessage, EmailProvider } from './provider';

/**
 * Development/default provider - logs instead of sending. Swap
 * EMAIL_PROVIDER=resend (and implement resend.provider.ts) to go live.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.info(`[email:disabled] to=${message.to} subject="${message.subject}"`);
  }
}
