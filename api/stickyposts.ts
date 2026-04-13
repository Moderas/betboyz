import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getStickyPosts,
  getStickyPost,
  deleteStickyPost,
  getPlayer,
} from './_lib/redis.js';
import { requireAuth } from './_lib/auth.js';
import { handle } from './_lib/handler.js';
import type { StickyPostWithPlayer } from '../src/types/index.js';

export default handle(async function handler(req: VercelRequest, res: VercelResponse) {
  // GET — list the 5 most recent posts with author cosmetic data
  if (req.method === 'GET') {
    const posts = await getStickyPosts();
    const enriched: StickyPostWithPlayer[] = await Promise.all(
      posts.map(async (post) => {
        const player = await getPlayer(post.author);
        return {
          ...post,
          authorEquippedItems: player?.equippedItems ?? {},
        };
      }),
    );
    return res.status(200).json({ posts: enriched });
  }

  // DELETE — remove own post
  if (req.method === 'DELETE') {
    const username = await requireAuth(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const postId = req.query.id as string;
    if (!postId) return res.status(400).json({ error: 'id is required' });

    const post = await getStickyPost(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author !== username) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    await deleteStickyPost(postId);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
