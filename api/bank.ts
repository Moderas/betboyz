import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, setPlayer } from './_lib/redis.js';
import { requireAuth } from './_lib/auth.js';
import { BANK_AMOUNT, BANK_LIFETIME_LIMIT, EMBARRASSING_PHRASES } from './_lib/bank.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const player = await getPlayer(username);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  if (player.bankRequestCount >= BANK_LIFETIME_LIMIT) {
    return res.status(400).json({
      error: `You've used all ${BANK_LIFETIME_LIMIT} bank requests. No more bailouts.`,
    });
  }

  const available = EMBARRASSING_PHRASES.filter(
    (p) => !player.embarrassingThings.includes(p),
  );
  const phrase = available[Math.floor(Math.random() * available.length)];

  player.balance += BANK_AMOUNT;
  player.bankRequestCount += 1;
  player.lastBankRequest = Date.now();
  player.embarrassingThings.push(phrase);

  await setPlayer(player);

  return res.status(200).json({
    ok: true,
    balance: player.balance,
    embarrassingThing: phrase,
    requestsRemaining: BANK_LIFETIME_LIMIT - player.bankRequestCount,
  });
}
