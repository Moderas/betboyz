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

  const { betId, winningOptionIndex, nullBet } = req.body as {
    betId?: string;
    winningOptionIndex?: number;
    nullBet?: boolean;
  };

  if (!betId) return res.status(400).json({ error: 'betId is required' });

  const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);

  if (!bet) return res.status(404).json({ error: 'Bet not found' });
  if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is not open' });
  if (bet.creator !== username) {
    return res.status(403).json({ error: 'Only the creator can close this bet' });
  }

  const now = Date.now();

  // ── Null ──────────────────────────────────────────────────────────────────
  if (nullBet) {
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

    bet.status = 'nulled';
    bet.nulledAt = now;
    bet.closedAt = now;

    await Promise.all([setBet(bet), moveToClose(betId, now)]);
    return res.status(200).json({ ok: true, refunds });
  }

  // ── Close with winner ─────────────────────────────────────────────────────
  if (winningOptionIndex === undefined) {
    return res.status(400).json({ error: 'winningOptionIndex is required' });
  }
  if (winningOptionIndex < 0 || winningOptionIndex >= bet.options.length) {
    return res.status(400).json({ error: 'Invalid winning option' });
  }

  bet.status = 'closed';
  bet.winningOptionIndex = winningOptionIndex;
  bet.closedAt = now;

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

  await Promise.all([setBet(bet), moveToClose(betId, now)]);
  return res.status(200).json({ ok: true, payouts });
});
