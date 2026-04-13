import { createHash } from 'node:crypto';
import { getSession } from './redis.js';
import type { IncomingMessage } from 'node:http';

export function hashPin(pin: string): string {
  return createHash('sha256').update(`betboyz:${pin}`).digest('hex');
}

export async function requireAuth(req: IncomingMessage): Promise<string | null> {
  const header = (req.headers as Record<string, string>)['authorization'];
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  return getSession(token);
}
