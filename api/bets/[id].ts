import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBet, getWagers } from '../_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query as { id: string };
  const [bet, wagers] = await Promise.all([getBet(id), getWagers(id)]);

  if (!bet) return res.status(404).json({ error: 'Bet not found' });

  return res.status(200).json({ bet, wagers });
}
