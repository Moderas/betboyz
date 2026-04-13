/**
 * Local development API server.
 * Mounts all Vercel serverless handlers on Express so `npm run dev` works
 * without needing Vercel CLI authentication.
 * Vite proxies /api/* to this server (port 3001).
 */
import { config } from 'dotenv';
config(); // load .env before any Redis client is created

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('\n❌  Missing Redis env vars. Copy .env.example → .env and fill in your Upstash credentials.\n');
  process.exit(1);
}

import express from 'express';
import type { Request, Response } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// API handlers
import auth from './api/auth.js';
import betsIndex from './api/bets/index.js';
import betsId from './api/bets/[id].js';
import betsWager from './api/bets/wager.js';
import betsClose from './api/bets/close.js';
import shop from './api/shop.js';
import playersIndex from './api/players/index.js';
import playersUsername from './api/players/[username].js';
import bank from './api/bank.js';
import analytics from './api/analytics.js';
import stickyposts from './api/stickyposts.js';

const app = express();
app.use(express.json());

// Wrap a Vercel handler for Express — they're compatible since VercelRequest
// extends IncomingMessage and VercelResponse extends ServerResponse.
// Also catches any unhandled errors and returns JSON so the client never
// receives an HTML error page.
function wrap(handler: (req: VercelRequest, res: VercelResponse) => unknown) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (err) {
      console.error('[api error]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  };
}

// Auth
app.post('/api/auth', wrap(auth));

// Bets — order matters: specific routes before dynamic ones
app.post('/api/bets/wager', wrap(betsWager));
app.post('/api/bets/close', wrap(betsClose));
app.get('/api/bets', wrap(betsIndex));
app.post('/api/bets', wrap(betsIndex));
app.get('/api/bets/:id', (req, res) => {
  (req as unknown as VercelRequest).query = { id: req.params.id };
  return betsId(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

// Players
app.get('/api/players', wrap(playersIndex));
app.get('/api/players/:username', (req, res) => {
  (req as unknown as VercelRequest).query = { username: req.params.username };
  return playersUsername(req as unknown as VercelRequest, res as unknown as VercelResponse);
});

// Shop
app.post('/api/shop', wrap(shop));

// Bank & analytics
app.post('/api/bank', wrap(bank));
app.get('/api/analytics', wrap(analytics));

// Sticky posts
app.get('/api/stickyposts', wrap(stickyposts));
app.delete('/api/stickyposts', wrap(stickyposts));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
