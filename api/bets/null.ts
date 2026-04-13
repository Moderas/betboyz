import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getBet,
  setBet,
  getWagers,
  getPlayer,
  setPlayer,
  moveToClose,
} from '../_lib/redis.js';
import { requireAuth } from '../_lib/auth.js';
import { handle } from '../_lib/handler.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const { betId } = req.body as { betId?: string };
  if (!betId) return res.status(400).json({ error: 'betId is required' });

  const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);

  if (!bet) return res.status(404).json({ error: 'Bet not found' });
  if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is not open' });
  if (bet.creator !== username) {
    return res.status(403).json({ error: 'Only the creator can null this bet' });
  }

  // Refund all wagers
  const refunds: Record<string, number> = {};
  for (const w of wagers) {
    refunds[w.player] = (refunds[w.player] ?? 0) + w.amount;
  }

  await Promise.all(
    Object.entries(refunds).map(async ([pUsername, amount]) => {
      const p = await getPlayer(pUsername);
      if (p) {
        p.balance += amount;
        await setPlayer(p);
      }
    }),
  );

  const nulledAt = Date.now();
  bet.status = 'nulled';
  bet.nulledAt = nulledAt;
  bet.closedAt = nulledAt;

  await Promise.all([setBet(bet), moveToClose(betId, nulledAt)]);

  return res.status(200).json({ ok: true, refunds });
});
