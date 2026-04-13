import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, setPlayer } from './_lib/redis.js';
import { requireAuth } from './_lib/auth.js';
import { handle } from './_lib/handler.js';
import { BANK_AMOUNT, EMBARRASSING_PHRASES } from './_lib/bank.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const player = await getPlayer(username);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const available = EMBARRASSING_PHRASES.filter(
    (p) => !player.embarrassingThings.includes(p),
  );

  // Cycle through phrases if all have been used
  const pool = available.length > 0 ? available : EMBARRASSING_PHRASES;
  const phrase = pool[Math.floor(Math.random() * pool.length)];

  player.balance += BANK_AMOUNT;
  player.bankRequestCount += 1;
  player.lastBankRequest = Date.now();
  player.embarrassingThings.push(phrase);

  await setPlayer(player);

  return res.status(200).json({
    ok: true,
    balance: player.balance,
    embarrassingThing: phrase,
  });
});
