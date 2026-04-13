import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, getClosedBetIds, getBet, getWagers } from '../_lib/redis.js';
import { calculatePayouts } from '../_lib/payout.js';
import type { PlayerPublic, PlayerAnalytics } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.query as { username: string };
  const player = await getPlayer(username);

  if (!player) return res.status(404).json({ error: 'Player not found' });

  const closedIds = await getClosedBetIds();
  const stats: PlayerAnalytics = {
    username,
    totalBetsPlaced: 0,
    totalShekelsWagered: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    netProfitLoss: 0,
  };

  for (const betId of closedIds) {
    const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);
    if (!bet || bet.winningOptionIndex === null) continue;

    const myWagers = wagers.filter((w) => w.player === username);
    if (myWagers.length === 0) continue;

    const { payouts } = calculatePayouts(bet, wagers);
    const received = payouts[username] ?? 0;

    for (const w of myWagers) {
      stats.totalBetsPlaced += 1;
      stats.totalShekelsWagered += w.amount;
    }

    const totalBetByMe = myWagers.reduce((s, w) => s + w.amount, 0);
    stats.netProfitLoss += received - totalBetByMe;

    if (received > 0) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }
  }

  stats.winRate =
    stats.totalBetsPlaced > 0 ? Math.round((stats.wins / stats.totalBetsPlaced) * 100) / 100 : 0;

  const publicPlayer: PlayerPublic = {
    username: player.username,
    balance: player.balance,
    embarrassingThings: player.embarrassingThings,
    bankRequestCount: player.bankRequestCount,
    createdAt: player.createdAt,
  };

  return res.status(200).json({ player: publicPlayer, stats });
}
