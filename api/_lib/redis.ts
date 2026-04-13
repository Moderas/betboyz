import { Redis } from '@upstash/redis';
import type {
  PlayerRecord,
  BetRecord,
  WagerRecord,
  GlobalAnalytics,
  StickyPost,
} from '../../src/types/index.js';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

// ── Key helpers ─────────────────────────────────────────────────────────────
const PK = (u: string) => `betboyz:player:${u}`;
const BK = (id: string) => `betboyz:bet:${id}`;
const WK = (id: string) => `betboyz:bet:${id}:wagers`;
const SK = (token: string) => `betboyz:session:${token}`;
const SPZK = () => 'betboyz:stickyposts';
const SPK = (id: string) => `betboyz:stickypost:${id}`;

const MAX_STICKY_POSTS = 5;

// ── Players ──────────────────────────────────────────────────────────────────
export async function getPlayer(username: string): Promise<PlayerRecord | null> {
  return getRedis().get<PlayerRecord>(PK(username));
}

export async function setPlayer(p: PlayerRecord): Promise<void> {
  await getRedis().set(PK(p.username), p);
}

export async function getAllPlayerUsernames(): Promise<string[]> {
  return getRedis().smembers('betboyz:players:index');
}

export async function addPlayerToIndex(username: string): Promise<void> {
  await getRedis().sadd('betboyz:players:index', username);
}

// ── Bets ─────────────────────────────────────────────────────────────────────
export async function getBet(id: string): Promise<BetRecord | null> {
  return getRedis().get<BetRecord>(BK(id));
}

export async function setBet(b: BetRecord): Promise<void> {
  await getRedis().set(BK(b.id), b);
}

export async function getActiveBetIds(): Promise<string[]> {
  return getRedis().zrange('betboyz:bets:active', 0, -1, { rev: true });
}

export async function getClosedBetIds(): Promise<string[]> {
  return getRedis().zrange('betboyz:bets:closed', 0, -1, { rev: true });
}

export async function addToActive(betId: string, score: number): Promise<void> {
  await getRedis().zadd('betboyz:bets:active', { score, member: betId });
}

export async function moveToClose(betId: string, score: number): Promise<void> {
  const r = getRedis();
  await Promise.all([
    r.zrem('betboyz:bets:active', betId),
    r.zadd('betboyz:bets:closed', { score, member: betId }),
  ]);
}

// ── Wagers ───────────────────────────────────────────────────────────────────
export async function getWagers(betId: string): Promise<WagerRecord[]> {
  return (await getRedis().get<WagerRecord[]>(WK(betId))) ?? [];
}

export async function setWagers(betId: string, wagers: WagerRecord[]): Promise<void> {
  await getRedis().set(WK(betId), wagers);
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export async function getSession(token: string): Promise<string | null> {
  return getRedis().get<string>(SK(token));
}

export async function setSession(token: string, username: string): Promise<void> {
  await getRedis().set(SK(token), username, { ex: 60 * 60 * 24 * 30 });
}

// ── Sticky posts ──────────────────────────────────────────────────────────────
export async function getStickyPosts(): Promise<StickyPost[]> {
  const r = getRedis();
  const ids = await r.zrange(SPZK(), 0, -1, { rev: true });
  if (ids.length === 0) return [];
  const posts = await Promise.all(ids.map((id) => r.get<StickyPost>(SPK(id as string))));
  return posts.filter(Boolean) as StickyPost[];
}

export async function getStickyPost(postId: string): Promise<StickyPost | null> {
  return getRedis().get<StickyPost>(SPK(postId));
}

export async function addStickyPost(post: StickyPost): Promise<void> {
  const r = getRedis();
  await r.set(SPK(post.id), post);
  await r.zadd(SPZK(), { score: post.createdAt, member: post.id });
  // Trim to MAX_STICKY_POSTS: zrange returns oldest first (no rev)
  const allIds = await r.zrange(SPZK(), 0, -1);
  if (allIds.length > MAX_STICKY_POSTS) {
    const toDelete = allIds.slice(0, allIds.length - MAX_STICKY_POSTS);
    await Promise.all(
      toDelete.map(async (id) => {
        await r.zrem(SPZK(), id as string);
        await r.del(SPK(id as string));
      }),
    );
  }
}

export async function deleteStickyPost(postId: string): Promise<void> {
  const r = getRedis();
  await Promise.all([r.zrem(SPZK(), postId), r.del(SPK(postId))]);
}

// ── Global analytics ─────────────────────────────────────────────────────────
export async function getGlobalAnalytics(): Promise<GlobalAnalytics> {
  return (
    (await getRedis().get<GlobalAnalytics>('betboyz:analytics:global')) ?? {
      totalBetsCreated: 0,
      totalShekelsWagered: 0,
    }
  );
}

export async function setGlobalAnalytics(a: GlobalAnalytics): Promise<void> {
  await getRedis().set('betboyz:analytics:global', a);
}
