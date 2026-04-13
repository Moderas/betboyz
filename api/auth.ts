import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getPlayer, setPlayer, addPlayerToIndex, setSession } from './_lib/redis.js';
import { hashPin } from './_lib/auth.js';
import { handle } from './_lib/handler.js';
import type { PlayerRecord } from '../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, username, pin } = req.body as {
    action?: string;
    username?: string;
    pin?: string;
  };

  // ── Register ──────────────────────────────────────────────────────────────
  if (action === 'register') {
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3–20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username: letters, numbers, underscores only' });
    }
    if (!pin || !/^\d{5}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 5 digits' });
    }

    const existing = await getPlayer(username);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const player: PlayerRecord = {
      username,
      pinHash: hashPin(pin),
      balance: 500,
      embarrassingThings: [],
      bankRequestCount: 0,
      lastBankRequest: null,
      createdAt: Date.now(),
      inventory: [],
      equippedItems: {},
      totalStickyPostsPosted: 0,
    };

    await setPlayer(player);
    await addPlayerToIndex(username);

    const token = randomUUID();
    await setSession(token, username);

    return res.status(201).json({ token, username, balance: player.balance });
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and PIN required' });
    }

    const player = await getPlayer(username);
    if (!player || player.pinHash !== hashPin(pin)) {
      return res.status(401).json({ error: 'Invalid username or PIN' });
    }

    const token = randomUUID();
    await setSession(token, username);

    return res.status(200).json({ token, username, balance: player.balance });
  }

  return res.status(400).json({ error: 'action must be "register" or "login"' });
});
