import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getPlayer, setSession } from '../_lib/redis.js';
import { hashPin } from '../_lib/auth.js';
import { handle } from '../_lib/handler.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, pin } = req.body as { username?: string; pin?: string };

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username and PIN required' });
  }

  const player = await getPlayer(username);
  if (!player || player.pinHash !== hashPin(pin)) {
    return res.status(401).json({ error: 'Invalid username or PIN' });
  }

  const token = randomUUID();
  await setSession(token, username);

  return res.status(200).json({ token, username, balance: player.balance });
});
