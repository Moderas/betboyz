import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, getClosedBetIds, getBet, getWagers } from '../_lib/redis.js';
import { calculatePayouts } from '../_lib/payout.js';
import { handle } from '../_lib/handler.js';
import type { PlayerPublic, PlayerAnalytics } from '../../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
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
    totalUpdootsReceived: player.totalUpdootsReceived ?? 0,
    totalDowndootsReceived: player.totalDowndootsReceived ?? 0,
    totalToysUsed: player.totalToysUsed ?? 0,
    totalTaxPaid: player.totalTaxPaid ?? 0,
  };

  for (const betId of closedIds) {
    const [bet, wagers] = await Promise.all([getBet(betId), getWagers(betId)]);
    if (!bet) continue;

    const myWagers = wagers.filter((w) => w.player === username);
    if (myWagers.length === 0) continue;

    // Always count bets placed/wagered
    for (const w of myWagers) {
      stats.totalBetsPlaced += 1;
      stats.totalShekelsWagered += w.amount;
    }

    // Skip win/loss/P&L for nulled bets or bets with no winner
    if (bet.status === 'nulled' || bet.winningOptionIndex === null) continue;

    const { payouts } = calculatePayouts(bet, wagers);
    const received = payouts[username] ?? 0;
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
    inventory: player.inventory ?? [],
    equippedItems: player.equippedItems ?? {},
    totalStickyPostsPosted: player.totalStickyPostsPosted ?? 0,
    totalUpdootsReceived: player.totalUpdootsReceived ?? 0,
    totalDowndootsReceived: player.totalDowndootsReceived ?? 0,
    activeToys: player.activeToys ?? [],
    totalToysUsed: player.totalToysUsed ?? 0,
    totalTaxPaid: player.totalTaxPaid ?? 0,
  };

  return res.status(200).json({ player: publicPlayer, stats });
});
