import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getBet,
  setBet,
  getWagers,
  setWagers,
  getPlayer,
  setPlayer,
  moveToClose,
  getGlobalAnalytics,
  setGlobalAnalytics,
} from '../_lib/redis.js';
import { requireAuth } from '../_lib/auth.js';
import { calculatePayouts } from '../_lib/payout.js';
import { handle } from '../_lib/handler.js';
import type { WagerRecord } from '../../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  // ── GET — fetch bet + wagers ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const [bet, wagers] = await Promise.all([getBet(id), getWagers(id)]);
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    return res.status(200).json({ bet, wagers });
  }

  // ── POST — wager or close ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const username = await requireAuth(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const { action } = req.body as { action?: string };

    // ── Wager ───────────────────────────────────────────────────────────────
    if (action === 'wager') {
      const { optionIndex, amount } = req.body as { optionIndex?: number; amount?: number };

      if (optionIndex === undefined || !amount) {
        return res.status(400).json({ error: 'optionIndex and amount are required' });
      }

      const [bet, wagers, player] = await Promise.all([
        getBet(id),
        getWagers(id),
        getPlayer(username),
      ]);

      if (!bet) return res.status(404).json({ error: 'Bet not found' });
      if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is no longer open' });
      if (!player) return res.status(404).json({ error: 'Player not found' });
      if (amount < bet.minimumBet) {
        return res.status(400).json({ error: `Minimum bet is ${bet.minimumBet} shekels` });
      }
      if (player.balance < amount) return res.status(400).json({ error: 'Insufficient shekels' });
      if (optionIndex < 0 || optionIndex >= bet.options.length) {
        return res.status(400).json({ error: 'Invalid option' });
      }

      player.balance -= amount;
      const newWager: WagerRecord = { player: username, optionIndex, amount, placedAt: Date.now() };
      wagers.push(newWager);
      bet.options[optionIndex].totalWagered += amount;
      bet.totalPool += amount;

      const analytics = await getGlobalAnalytics();
      analytics.totalShekelsWagered += amount;

      await Promise.all([setPlayer(player), setWagers(id, wagers), setBet(bet), setGlobalAnalytics(analytics)]);
      return res.status(200).json({ ok: true, balance: player.balance });
    }

    // ── Close / Null ────────────────────────────────────────────────────────
    if (action === 'close') {
      const { winningOptionIndex, nullBet } = req.body as {
        winningOptionIndex?: number;
        nullBet?: boolean;
      };

      const [bet, wagers] = await Promise.all([getBet(id), getWagers(id)]);
      if (!bet) return res.status(404).json({ error: 'Bet not found' });
      if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is not open' });
      if (bet.creator !== username) return res.status(403).json({ error: 'Only the creator can close this bet' });

      const now = Date.now();

      if (nullBet) {
        const refunds: Record<string, number> = {};
        for (const w of wagers) refunds[w.player] = (refunds[w.player] ?? 0) + w.amount;
        await Promise.all(
          Object.entries(refunds).map(async ([u, amount]) => {
            const p = await getPlayer(u);
            if (p) { p.balance += amount; await setPlayer(p); }
          }),
        );
        bet.status = 'nulled';
        bet.nulledAt = now;
        bet.closedAt = now;
        await Promise.all([setBet(bet), moveToClose(id, now)]);
        return res.status(200).json({ ok: true, refunds });
      }

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
        Object.entries(payouts).map(async ([u, amount]) => {
          const p = await getPlayer(u);
          if (p) { p.balance += amount; await setPlayer(p); }
        }),
      );
      await Promise.all([setBet(bet), moveToClose(id, now)]);
      return res.status(200).json({ ok: true, payouts });
    }

    return res.status(400).json({ error: 'action must be "wager" or "close"' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
