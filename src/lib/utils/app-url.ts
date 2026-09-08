import 'server-only';
import { headers } from 'next/headers';

/** Prefers the configured APP_URL; falls back to the current request's host. */
export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');

  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export function buildReferralLink(referralCode: string): string {
  return `${getAppUrl()}/register?ref=${referralCode}`;
}
