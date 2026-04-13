/**
 * One-off script to delete specific test users from Redis.
 * Run with: npx tsx scripts/delete-users.ts
 */
import { config } from 'dotenv';
config();

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const USERS_TO_DELETE = ['proxytest', 'testuser', 'testuser2', 'dotenvtest'];

async function main() {
  for (const username of USERS_TO_DELETE) {
    const key = `betboyz:player:${username}`;
    const exists = await redis.exists(key);
    if (exists) {
      await redis.del(key);
      await redis.srem('betboyz:players:index', username);
      console.log(`✅  Deleted ${username}`);
    } else {
      console.log(`⚠️   ${username} not found — skipping`);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
