import type { ShopCategory, EffectType } from '../types';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  price: number;
  preview: string; // emoji or CSS class name
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Name Emojis ────────────────────────────────────────────────────────────
  { id: 'emoji_fire',      category: 'emoji', name: 'Hot Streak',     description: 'You\'re on fire. Show it.', price: 50,  preview: '🔥' },
  { id: 'emoji_skull',     category: 'emoji', name: 'Deathwish',      description: 'Living on the edge.', price: 50,  preview: '💀' },
  { id: 'emoji_crown',     category: 'emoji', name: 'Royalty',        description: 'Born to win.', price: 75,  preview: '👑' },
  { id: 'emoji_lightning', category: 'emoji', name: 'Electric',       description: 'Shock the competition.', price: 50,  preview: '⚡' },
  { id: 'emoji_slots',     category: 'emoji', name: 'Slots God',      description: 'Pure gambling energy.', price: 75,  preview: '🎰' },
  { id: 'emoji_diamond',   category: 'emoji', name: 'Diamond Hands',  description: 'Never fold.', price: 100, preview: '💎' },
  { id: 'emoji_dragon',    category: 'emoji', name: 'Dragon',         description: 'Fear no one.', price: 150, preview: '🐉' },
  { id: 'emoji_snake',     category: 'emoji', name: 'Snake',          description: 'Patient. Calculated. Dangerous.', price: 75,  preview: '🐍' },
  { id: 'emoji_target',    category: 'emoji', name: 'Dead Eye',       description: 'You never miss.', price: 50,  preview: '🎯' },
  { id: 'emoji_money',     category: 'emoji', name: 'Cash Out',       description: 'Always profitable.', price: 100, preview: '💸' },
  { id: 'emoji_goat',      category: 'emoji', name: 'The GOAT',       description: 'Greatest of all time.', price: 200, preview: '🐐' },
  { id: 'emoji_wolf',      category: 'emoji', name: 'Wolf',           description: 'Lone predator.', price: 100, preview: '🐺' },

  // ── Profile Titles ────────────────────────────────────────────────────────
  { id: 'title_gambler',  category: 'profileTitle', name: 'The Gambler',   description: 'Classic.', price: 50,  preview: '🎲' },
  { id: 'title_oracle',   category: 'profileTitle', name: 'The Oracle',    description: 'You see what others don\'t.', price: 100, preview: '🔮' },
  { id: 'title_shark',    category: 'profileTitle', name: 'The Shark',     description: 'Circling for blood.', price: 150, preview: '🦈' },
  { id: 'title_bigfish',  category: 'profileTitle', name: 'Big Fish',      description: 'Commanding the pond.', price: 75,  preview: '🐟' },
  { id: 'title_chaos',    category: 'profileTitle', name: 'Chaos Agent',   description: 'Unpredictable by design.', price: 75,  preview: '💣' },
  { id: 'title_darkhorse',category: 'profileTitle', name: 'Dark Horse',    description: 'Nobody saw you coming.', price: 100, preview: '🐴' },
  { id: 'title_broke',    category: 'profileTitle', name: 'Broke Boy',     description: 'Own it.', price: 25,  preview: '😭' },
  { id: 'title_whale',    category: 'profileTitle', name: 'Whale',         description: 'You move markets.', price: 200, preview: '🐋' },
  { id: 'title_prophet',  category: 'profileTitle', name: 'The Prophet',   description: 'Blessed with foresight.', price: 150, preview: '📜' },
  { id: 'title_lunch',    category: 'profileTitle', name: 'Lunch Money',   description: 'At least you tried.', price: 25,  preview: '🥪' },
  { id: 'title_menace',   category: 'profileTitle', name: 'Public Menace', description: 'Feared by all.', price: 125, preview: '⚠️' },
  { id: 'title_sicko',    category: 'profileTitle', name: 'The Sicko',     description: 'You love this way too much.', price: 75,  preview: '🤢' },

  // ── Name Animations ───────────────────────────────────────────────────────
  { id: 'anim_glow',    category: 'nameAnimation', name: 'Pulse Glow',  description: 'Golden pulsing glow around your name.', price: 100, preview: '✨' },
  { id: 'anim_rainbow', category: 'nameAnimation', name: 'Rainbow',     description: 'Infinite colour cycling.', price: 200, preview: '🌈' },
  { id: 'anim_shimmer', category: 'nameAnimation', name: 'Shimmer',     description: 'Metallic sheen that sweeps across your name.', price: 150, preview: '🪙' },
  { id: 'anim_tremor',  category: 'nameAnimation', name: 'Tremor',      description: 'Your name shakes with anticipation.', price: 75,  preview: '😤' },

  // ── Profile Borders ───────────────────────────────────────────────────────
  { id: 'border_gold_glow',  category: 'profileBorder', name: 'Gold Glow',  description: 'Pulsing golden border on your profile card.', price: 150, preview: '🟡' },
  { id: 'border_neon_blue',  category: 'profileBorder', name: 'Neon Blue',  description: 'Electric blue neon border.', price: 150, preview: '🔵' },
  { id: 'border_inferno',    category: 'profileBorder', name: 'Inferno',    description: 'Red-hot burning border.', price: 150, preview: '🔴' },
  { id: 'border_rainbow',    category: 'profileBorder', name: 'Prism',      description: 'Animated rainbow gradient border.', price: 350, preview: '🌈' },

  // ── Color Schemes ─────────────────────────────────────────────────────────
  { id: 'scheme_ocean',    category: 'colorScheme', name: 'Ocean Depth',  description: 'Deep navy & electric blue replaces the gold on your profile.', price: 200, preview: '🌊' },
  { id: 'scheme_blood',    category: 'colorScheme', name: 'Blood Sport',  description: 'Dark crimson theme. For the relentless.', price: 200, preview: '🩸' },
  { id: 'scheme_emerald',  category: 'colorScheme', name: 'Emerald Vault',description: 'Rich deep green. Money green.', price: 200, preview: '💚' },
  { id: 'scheme_purple',   category: 'colorScheme', name: 'Royal Purple', description: 'Regal purple. You were born for this.', price: 200, preview: '💜' },
  { id: 'scheme_obsidian', category: 'colorScheme', name: 'Obsidian',     description: 'Near-black with silver accents. Pure menace.', price: 150, preview: '🖤' },
];

export const SHOP_ITEMS_BY_ID: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item]),
);

export const SHOP_CATEGORIES: { key: ShopCategory; label: string; description: string }[] = [
  { key: 'emoji',         label: 'Name Emojis',      description: 'Emoji shown after your name on your profile and leaderboard.' },
  { key: 'profileTitle',  label: 'Profile Titles',   description: 'A title badge shown under your name on your profile.' },
  { key: 'nameAnimation', label: 'Name Animations',  description: 'Animated CSS effect applied to your name on your profile page.' },
  { key: 'profileBorder', label: 'Profile Borders',  description: 'Glowing border effect on your profile card.' },
  { key: 'colorScheme',   label: 'Color Schemes',    description: 'Swap out the gold for a different accent color on your profile.' },
];

export const ACTIVE_TOYS_EVENT = 'toys:active-changed';

export interface ToyItem {
  id: string;
  name: string;
  description: string;
  price: number;
  preview: string;
  /** 'persistent' = owned + toggleable (e.g. Bouncing Billion). 'consumable' = triggers effect on use. */
  kind: 'persistent' | 'consumable';
  /** For consumables that broadcast effects — the EffectType dispatched */
  effectType?: EffectType;
}

export const TOYS: ToyItem[] = [
  {
    id: 'toy_bouncing_billion',
    name: 'Bouncing Billion',
    description: 'A mascot clone bounces around your screen like a DVD logo screensaver. Toggle it on or off.',
    price: 500,
    preview: '📀',
    kind: 'persistent',
  },
  {
    id: 'toy_uooohhh_storm',
    name: 'Uooohhh Storm',
    description: 'Floods every logged-in screen with 😭 emojis for 30 seconds. Maximum chaos.',
    price: 50,
    preview: '😭',
    kind: 'consumable',
    effectType: 'storm',
  },
  {
    id: 'toy_tax_man',
    name: 'Tax Man',
    description: 'Deducts 1% (min 1 ₪) from every player\'s balance except yours. They\'ll know.',
    price: 100,
    preview: '🧾',
    kind: 'consumable',
  },
  {
    id: 'toy_big_head',
    name: 'Big Head Mode',
    description: 'Giant mascots invade every screen for 20 seconds. Absolute menace.',
    price: 50,
    preview: '🗿',
    kind: 'consumable',
    effectType: 'bighead',
  },
];

export const TOYS_BY_ID: Record<string, ToyItem> = Object.fromEntries(
  TOYS.map((t) => [t.id, t]),
);

// CSS variable overrides applied to the profile page when the player has a color scheme equipped
export const COLOR_SCHEME_VARS: Record<string, Record<string, string>> = {
  scheme_ocean: {
    '--color-gold':         '#4a9eff',
    '--color-gold-dim':     '#2d7dd9',
    '--color-gold-dark':    '#1a4a8a',
    '--color-bg-card':      '#0d1e35',
    '--color-bg-card-hover':'#112540',
    '--color-border':       '#1a3a5e',
    '--color-border-gold':  '#2d5a8e',
  },
  scheme_blood: {
    '--color-gold':         '#ff5757',
    '--color-gold-dim':     '#cc3333',
    '--color-gold-dark':    '#8a1a1a',
    '--color-bg-card':      '#2e0d0d',
    '--color-bg-card-hover':'#3a1010',
    '--color-border':       '#5e1a1a',
    '--color-border-gold':  '#8e2d2d',
  },
  scheme_emerald: {
    '--color-gold':         '#3ddc84',
    '--color-gold-dim':     '#2bb36a',
    '--color-gold-dark':    '#1a6e40',
    '--color-bg-card':      '#0d2e1a',
    '--color-bg-card-hover':'#103820',
    '--color-border':       '#1a5e30',
    '--color-border-gold':  '#2d8e50',
  },
  scheme_purple: {
    '--color-gold':         '#b06aff',
    '--color-gold-dim':     '#8a40dd',
    '--color-gold-dark':    '#5a1a9a',
    '--color-bg-card':      '#1a0d2e',
    '--color-bg-card-hover':'#221038',
    '--color-border':       '#3a1a5e',
    '--color-border-gold':  '#5a2d8e',
  },
  scheme_obsidian: {
    '--color-gold':         '#c0c0c0',
    '--color-gold-dim':     '#909090',
    '--color-gold-dark':    '#606060',
    '--color-bg-card':      '#141414',
    '--color-bg-card-hover':'#1c1c1c',
    '--color-border':       '#2a2a2a',
    '--color-border-gold':  '#444444',
  },
};
