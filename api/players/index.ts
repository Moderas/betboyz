import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllPlayerUsernames, getPlayer } from '../_lib/redis.js';
import type { PlayerPublic } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const usernames = await getAllPlayerUsernames();
  const records = await Promise.all(usernames.map((u) => getPlayer(u)));

  const players: PlayerPublic[] = records
    .filter((p) => p !== null)
    .map((p) => ({
      username: p!.username,
      balance: p!.balance,
      embarrassingThings: p!.embarrassingThings,
      bankRequestCount: p!.bankRequestCount,
      createdAt: p!.createdAt,
    }))
    .sort((a, b) => b.balance - a.balance);

  return res.status(200).json({ players });
}
