import 'server-only';
import { headers } from 'next/headers';

export function getRequestContext(): { ipAddress: string | null; userAgent: string | null } {
  const headerList = headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0]?.trim() ?? null : headerList.get('x-real-ip');
  const userAgent = headerList.get('user-agent');
  return { ipAddress, userAgent };
}
