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
import { calculatePayouts } from '../_lib/payout.js';
import { handle } from '../_lib/handler.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const { betId, winningOptionIndex } = req.body as {
    betId?: string;
    winningOptionIndex?: number;
  };

  if (!betId || winningOptionIndex === undefined) {
    return res.status(400).json({ error: 'betId and winningOptionIndex are required' });
  }

  const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);

  if (!bet) return res.status(404).json({ error: 'Bet not found' });
  if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is already closed' });
  if (bet.creator !== username) {
    return res.status(403).json({ error: 'Only the creator can close this bet' });
  }
  if (winningOptionIndex < 0 || winningOptionIndex >= bet.options.length) {
    return res.status(400).json({ error: 'Invalid winning option' });
  }

  const closedAt = Date.now();
  bet.status = 'closed';
  bet.winningOptionIndex = winningOptionIndex;
  bet.closedAt = closedAt;

  const { payouts } = calculatePayouts(bet, wagers);

  await Promise.all(
    Object.entries(payouts).map(async ([pUsername, amount]) => {
      const p = await getPlayer(pUsername);
      if (p) {
        p.balance += amount;
        await setPlayer(p);
      }
    }),
  );

  await Promise.all([setBet(bet), moveToClose(betId, closedAt)]);

  return res.status(200).json({ ok: true, payouts });
});
