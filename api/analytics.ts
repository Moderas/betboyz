import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllPlayerUsernames,
  getClosedBetIds,
  getBet,
  getWagers,
  getGlobalAnalytics,
  getPlayer,
} from './_lib/redis.js';
import { calculatePayouts } from './_lib/payout.js';
import { handle } from './_lib/handler.js';
import type { PlayerAnalytics } from '../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [usernames, closedIds, global] = await Promise.all([
    getAllPlayerUsernames(),
    getClosedBetIds(),
    getGlobalAnalytics(),
  ]);

  // Fetch player records for updoot/downdoot/toy totals
  const playerRecords = await Promise.all(usernames.map((u) => getPlayer(u)));
  const recordMap: Record<string, {
    totalUpdootsReceived: number;
    totalDowndootsReceived: number;
    totalToysUsed: number;
    totalTaxPaid: number;
  }> = {};
  for (const p of playerRecords) {
    if (p) {
      recordMap[p.username] = {
        totalUpdootsReceived: p.totalUpdootsReceived ?? 0,
        totalDowndootsReceived: p.totalDowndootsReceived ?? 0,
        totalToysUsed: p.totalToysUsed ?? 0,
        totalTaxPaid: p.totalTaxPaid ?? 0,
      };
    }
  }

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
      totalUpdootsReceived: recordMap[u]?.totalUpdootsReceived ?? 0,
      totalDowndootsReceived: recordMap[u]?.totalDowndootsReceived ?? 0,
      totalToysUsed: recordMap[u]?.totalToysUsed ?? 0,
      totalTaxPaid: recordMap[u]?.totalTaxPaid ?? 0,
    };
  }

  for (const betId of closedIds) {
    const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);
    if (!bet) continue;

    // Always count bets placed and shekels wagered
    const playerWagers: Record<string, number> = {};
    for (const w of wagers) {
      playerWagers[w.player] = (playerWagers[w.player] ?? 0) + w.amount;
      const s = playerStats[w.player];
      if (!s) continue;
      s.totalBetsPlaced += 1;
      s.totalShekelsWagered += w.amount;
    }

    // Skip win/loss/P&L for nulled bets or bets with no winner
    if (bet.status === 'nulled' || bet.winningOptionIndex === null) continue;

    const { payouts } = calculatePayouts(bet, wagers);

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
});
