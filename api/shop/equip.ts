import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayer, setPlayer } from '../_lib/redis.js';
import { requireAuth } from '../_lib/auth.js';
import { handle } from '../_lib/handler.js';
import { SHOP_ITEMS_BY_ID } from '../../src/utils/shopItems.js';
import type { ShopCategory } from '../../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = await requireAuth(req);
  if (!username) return res.status(401).json({ error: 'Unauthorized' });

  const { itemId, category } = req.body as { itemId?: string | null; category?: ShopCategory };

  const player = await getPlayer(username);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const equippedItems = { ...(player.equippedItems ?? {}) };

  if (!itemId) {
    // Unequip
    if (!category) return res.status(400).json({ error: 'category is required to unequip' });
    delete equippedItems[category];
  } else {
    const item = SHOP_ITEMS_BY_ID[itemId];
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const inventory = player.inventory ?? [];
    if (!inventory.includes(itemId)) {
      return res.status(400).json({ error: 'You do not own this item' });
    }
    equippedItems[item.category] = itemId;
  }

  player.equippedItems = equippedItems;
  await setPlayer(player);

  return res.status(200).json({ ok: true, equippedItems: player.equippedItems });
});
