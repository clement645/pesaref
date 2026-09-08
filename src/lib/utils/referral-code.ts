import { randomInt } from 'crypto';

// Excludes ambiguous characters (0/O, 1/I) to keep codes easy to read aloud/type.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCodeCandidate(fullName: string): string {
  const namePart = fullName
    .split(/\s+/)[0]
    ?.replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 5) || 'USER';

  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `${namePart}${suffix}`.slice(0, 12);
}
