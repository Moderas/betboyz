import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import {
  getActiveBetIds,
  getClosedBetIds,
  getBet,
  setBet,
  addToActive,
  getGlobalAnalytics,
  setGlobalAnalytics,
} from '../_lib/redis.js';
import { requireAuth } from '../_lib/auth.js';
import type { BetRecord } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const status = (req.query.status as string) || 'all';
    let ids: string[] = [];

    if (status === 'open') {
      ids = await getActiveBetIds();
    } else if (status === 'closed') {
      ids = await getClosedBetIds();
    } else {
      const [active, closed] = await Promise.all([getActiveBetIds(), getClosedBetIds()]);
      ids = [...active, ...closed];
    }

    const bets = (await Promise.all(ids.map((id) => getBet(id)))).filter(
      (b): b is BetRecord => b !== null,
    );
    return res.status(200).json({ bets });
  }

  if (req.method === 'POST') {
    const username = await requireAuth(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const { description, minimumBet, options } = req.body as {
      description?: string;
      minimumBet?: number;
      options?: string[];
    };

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Description must be at least 5 characters' });
    }
    if (!minimumBet || minimumBet < 1) {
      return res.status(400).json({ error: 'Minimum bet must be at least 1' });
    }
    if (!options || options.length < 2 || options.length > 8) {
      return res.status(400).json({ error: 'Need between 2 and 8 options' });
    }
    if (options.some((o) => !o || o.trim().length === 0)) {
      return res.status(400).json({ error: 'All options must be non-empty' });
    }

    const now = Date.now();
    const bet: BetRecord = {
      id: randomUUID(),
      creator: username,
      description: description.trim(),
      minimumBet: Math.floor(minimumBet),
      options: options.map((label) => ({ label: label.trim(), totalWagered: 0 })),
      status: 'open',
      winningOptionIndex: null,
      totalPool: 0,
      createdAt: now,
      closedAt: null,
    };

    const analytics = await getGlobalAnalytics();
    analytics.totalBetsCreated += 1;

    await Promise.all([setBet(bet), addToActive(bet.id, now), setGlobalAnalytics(analytics)]);

    return res.status(201).json({ bet });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
