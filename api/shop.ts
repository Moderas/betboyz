import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getPlayer, setPlayer, addStickyPost, addEffect, getAllPlayerUsernames } from './_lib/redis.js';
import { requireAuth } from './_lib/auth.js';
import { handle } from './_lib/handler.js';
import { SHOP_ITEMS_BY_ID, TOYS_BY_ID } from '../src/utils/shopItems.js';
import type { ShopCategory, StickyPost, EffectRecord } from '../src/types/index.js';

const STICKYPOST_PRICE = 10;

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const { action, itemId, category } = req.body as {
    action?: string;
    itemId?: string | null;
    category?: ShopCategory;
  };

  const player = await getPlayer(username);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const inventory = player.inventory ?? [];
  const equippedItems = { ...(player.equippedItems ?? {}) };

  // ── Buy ──────────────────────────────────────────────────────────────────
  if (action === 'buy') {
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const item = SHOP_ITEMS_BY_ID[itemId];
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (inventory.includes(itemId)) return res.status(400).json({ error: 'You already own this item' });
    if (player.balance < item.price) return res.status(400).json({ error: 'Insufficient shekels' });

    player.balance -= item.price;
    player.inventory = [...inventory, itemId];
    player.equippedItems = { ...equippedItems, [item.category]: itemId };

    await setPlayer(player);
    return res.status(200).json({
      ok: true,
      balance: player.balance,
      inventory: player.inventory,
      equippedItems: player.equippedItems,
    });
  }

  // ── Equip / Unequip ───────────────────────────────────────────────────────
  if (action === 'equip') {
    if (!itemId) {
      // Unequip
      if (!category) return res.status(400).json({ error: 'category is required to unequip' });
      delete equippedItems[category];
    } else {
      const item = SHOP_ITEMS_BY_ID[itemId];
      if (!item) return res.status(404).json({ error: 'Item not found' });
      if (!inventory.includes(itemId)) return res.status(400).json({ error: 'You do not own this item' });
      equippedItems[item.category] = itemId;
    }

    player.equippedItems = equippedItems;
    await setPlayer(player);
    return res.status(200).json({ ok: true, equippedItems: player.equippedItems });
  }

  // ── StickyPost (consumable) ───────────────────────────────────────────────
  if (action === 'stickypost') {
    const { text } = req.body as { text?: string };
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (text.length > 255) {
      return res.status(400).json({ error: 'Text must be 255 characters or fewer' });
    }
    if (player.balance < STICKYPOST_PRICE) {
      return res.status(400).json({ error: 'Insufficient shekels' });
    }

    const post: StickyPost = {
      id: randomUUID(),
      author: username,
      text: text.trim(),
      createdAt: Date.now(),
      updoots: 0,
      downdoots: 0,
      votes: {},
    };

    player.balance -= STICKYPOST_PRICE;
    player.totalStickyPostsPosted = (player.totalStickyPostsPosted ?? 0) + 1;

    const [, evicted] = await Promise.all([setPlayer(player), addStickyPost(post)]);

    // Subtract vote totals for any posts that were pushed off the board
    if (evicted.length > 0) {
      await Promise.all(
        evicted.map(async (old) => {
          if ((old.updoots ?? 0) === 0 && (old.downdoots ?? 0) === 0) return;
          const oldAuthor = await getPlayer(old.author);
          if (!oldAuthor) return;
          oldAuthor.totalUpdootsReceived = Math.max(
            0,
            (oldAuthor.totalUpdootsReceived ?? 0) - (old.updoots ?? 0),
          );
          oldAuthor.totalDowndootsReceived = Math.max(
            0,
            (oldAuthor.totalDowndootsReceived ?? 0) - (old.downdoots ?? 0),
          );
          await setPlayer(oldAuthor);
        }),
      );
    }

    return res.status(200).json({ ok: true, balance: player.balance, post });
  }

  // ── Buy Toy ───────────────────────────────────────────────────────────────
  if (action === 'toy') {
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const toy = TOYS_BY_ID[itemId];
    if (!toy) return res.status(404).json({ error: 'Toy not found' });
    if (player.balance < toy.price) return res.status(400).json({ error: 'Insufficient shekels' });

    const inventory = player.inventory ?? [];
    const alreadyOwned = inventory.includes(itemId);

    // Persistent toys: buy once then use via toggletoy
    if (toy.kind === 'persistent' && alreadyOwned) {
      return res.status(400).json({ error: 'You already own this toy' });
    }

    player.balance -= toy.price;
    player.totalToysUsed = (player.totalToysUsed ?? 0) + 1;

    if (toy.kind === 'persistent') {
      // Buy and auto-activate
      player.inventory = [...inventory, itemId];
      player.activeToys = [...(player.activeToys ?? []), itemId];
      await setPlayer(player);
      return res.status(200).json({
        ok: true,
        balance: player.balance,
        inventory: player.inventory,
        activeToys: player.activeToys,
      });
    }

    // Consumable toys — broadcast effect or run server-side logic
    if (toy.id === 'toy_tax_man') {
      const usernames = await getAllPlayerUsernames();
      const taxResults: Record<string, number> = {};
      await Promise.all(
        usernames.map(async (u) => {
          if (u === username) return;
          const target = await getPlayer(u);
          if (!target || target.balance <= 0) return;
          const tax = Math.max(1, Math.floor(target.balance * 0.01));
          target.balance -= tax;
          target.totalTaxPaid = (target.totalTaxPaid ?? 0) + tax;
          taxResults[u] = tax;
          await setPlayer(target);
        }),
      );
      await setPlayer(player);
      return res.status(200).json({ ok: true, balance: player.balance, taxResults });
    }

    // Storm / BigHead — broadcast as effect
    if (toy.effectType) {
      const DURATIONS: Record<string, number> = { storm: 30_000, bighead: 20_000 };
      const duration = DURATIONS[toy.effectType] ?? 30_000;
      const effect: EffectRecord = {
        id: randomUUID(),
        type: toy.effectType,
        triggeredBy: username,
        expiresAt: Date.now() + duration,
      };
      await addEffect(effect);
      await setPlayer(player);
      return res.status(200).json({ ok: true, balance: player.balance, effect });
    }

    await setPlayer(player);
    return res.status(200).json({ ok: true, balance: player.balance });
  }

  // ── Toggle Toy (persistent on/off) ────────────────────────────────────────
  if (action === 'toggletoy') {
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const toy = TOYS_BY_ID[itemId];
    if (!toy || toy.kind !== 'persistent') return res.status(400).json({ error: 'Not a toggleable toy' });

    const ownedInventory = player.inventory ?? [];
    if (!ownedInventory.includes(itemId)) return res.status(400).json({ error: 'You do not own this toy' });

    const activeToys = player.activeToys ?? [];
    if (activeToys.includes(itemId)) {
      player.activeToys = activeToys.filter((t) => t !== itemId);
    } else {
      player.activeToys = [...activeToys, itemId];
    }

    await setPlayer(player);
    return res.status(200).json({ ok: true, activeToys: player.activeToys });
  }

  return res.status(400).json({ error: 'action must be "buy", "equip", "stickypost", "toy", or "toggletoy"' });
});
