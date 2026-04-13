import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, setPlayer } from './_lib/redis.js';
import { requireAuth } from './_lib/auth.js';
import { handle } from './_lib/handler.js';
import { SHOP_ITEMS_BY_ID } from '../src/utils/shopItems.js';
import type { ShopCategory } from '../src/types/index.js';

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

  return res.status(400).json({ error: 'action must be "buy" or "equip"' });
});
