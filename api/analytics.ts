import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllPlayerUsernames,
  getClosedBetIds,
  getBet,
  getWagers,
  getGlobalAnalytics,
} from './_lib/redis.js';
import { calculatePayouts } from './_lib/payout.js';
import type { PlayerAnalytics } from '../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [usernames, closedIds, global] = await Promise.all([
    getAllPlayerUsernames(),
    getClosedBetIds(),
    getGlobalAnalytics(),
  ]);

  const playerStats: Record<string, PlayerAnalytics> = {};
  for (const u of usernames) {
    playerStats[u] = {
      username: u,
      totalBetsPlaced: 0,
      totalShekelsWagered: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      netProfitLoss: 0,
    };
  }

  for (const betId of closedIds) {
    const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);
    if (!bet || bet.winningOptionIndex === null) continue;

    const { payouts } = calculatePayouts(bet, wagers);

    // Group wagers by player for this bet
    const playerWagers: Record<string, number> = {};
    for (const w of wagers) {
      playerWagers[w.player] = (playerWagers[w.player] ?? 0) + w.amount;
      const s = playerStats[w.player];
      if (!s) continue;
      s.totalBetsPlaced += 1;
      s.totalShekelsWagered += w.amount;
    }

    // Determine wins/losses per player for this bet
    for (const [pUsername, totalBet] of Object.entries(playerWagers)) {
      const s = playerStats[pUsername];
      if (!s) continue;
      const received = payouts[pUsername] ?? 0;
      s.netProfitLoss += received - totalBet;
      if (received > 0) s.wins += 1;
      else s.losses += 1;
    }
  }

  for (const s of Object.values(playerStats)) {
    s.winRate =
      s.totalBetsPlaced > 0 ? Math.round((s.wins / s.totalBetsPlaced) * 100) / 100 : 0;
  }

  const players = Object.values(playerStats).sort(
    (a, b) => b.netProfitLoss - a.netProfitLoss,
  );

  return res.status(200).json({ global, players });
}
