import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveEffects } from './_lib/redis.js';
import { handle } from './_lib/handler.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const effects = await getActiveEffects();
  return res.status(200).json({ effects });
});
