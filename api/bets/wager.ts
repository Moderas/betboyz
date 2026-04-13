import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getBet,
  setBet,
  getWagers,
  setWagers,
  getPlayer,
  setPlayer,
  getGlobalAnalytics,
  setGlobalAnalytics,
} from '../_lib/redis.js';
import { requireAuth } from '../_lib/auth.js';
import type { WagerRecord } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const { betId, optionIndex, amount } = req.body as {
    betId?: string;
    optionIndex?: number;
    amount?: number;
  };

  if (!betId || optionIndex === undefined || !amount) {
    return res.status(400).json({ error: 'betId, optionIndex, and amount are required' });
  }

  const [bet, wagers, player] = await Promise.all([
    getBet(betId),
    getWagers(betId),
    getPlayer(username),
  ]);

  if (!bet) return res.status(404).json({ error: 'Bet not found' });
  if (bet.status !== 'open') return res.status(400).json({ error: 'Bet is no longer open' });
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (amount < bet.minimumBet) {
    return res.status(400).json({ error: `Minimum bet is ${bet.minimumBet} shekels` });
  }
  if (player.balance < amount) {
    return res.status(400).json({ error: 'Insufficient shekels' });
  }
  if (optionIndex < 0 || optionIndex >= bet.options.length) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  player.balance -= amount;

  const newWager: WagerRecord = {
    player: username,
    optionIndex,
    amount,
    placedAt: Date.now(),
  };
  wagers.push(newWager);

  bet.options[optionIndex].totalWagered += amount;
  bet.totalPool += amount;

  const analytics = await getGlobalAnalytics();
  analytics.totalShekelsWagered += amount;

  await Promise.all([
    setPlayer(player),
    setWagers(betId, wagers),
    setBet(bet),
    setGlobalAnalytics(analytics),
  ]);

  return res.status(200).json({ ok: true, balance: player.balance });
}
