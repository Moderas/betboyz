import type { PlayerAnalytics, PlayerPublic } from '../types';

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
}

const EXPLORER_PAGES = ['home', 'leaderboard', 'analytics', 'bank', 'profile', 'bet', 'create'];

function getVisitedPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem('betboyz:visited_pages') ?? '[]');
  } catch {
    return [];
  }
}

export function computeAchievements(
  stats: PlayerAnalytics,
  player: PlayerPublic,
  isOwnProfile: boolean,
): Achievement[] {
  const visited = isOwnProfile ? getVisitedPages() : [];
  const ageMs = Date.now() - player.createdAt;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  return [
    {
      id: 'first_wager',
      icon: '🎰',
      name: 'First Wager',
      description: 'Place your very first bet.',
      earned: stats.totalBetsPlaced >= 1,
    },
    {
      id: 'degenerate',
      icon: '🃏',
      name: 'Degenerate',
      description: 'Place 10 or more bets.',
      earned: stats.totalBetsPlaced >= 10,
    },
    {
      id: 'high_roller',
      icon: '💎',
      name: 'High Roller',
      description: 'Wager a total of 1,000 shekels.',
      earned: stats.totalShekelsWagered >= 1000,
    },
    {
      id: 'whale',
      icon: '🐋',
      name: 'Whale',
      description: 'Wager a total of 10,000 shekels.',
      earned: stats.totalShekelsWagered >= 10000,
    },
    {
      id: 'on_a_roll',
      icon: '🔥',
      name: 'On a Roll',
      description: 'Win 3 or more bets.',
      earned: stats.wins >= 3,
    },
    {
      id: 'champion',
      icon: '🏆',
      name: 'Champion',
      description: 'Win 10 or more bets.',
      earned: stats.wins >= 10,
    },
    {
      id: 'sharp',
      icon: '🎯',
      name: 'Sharp',
      description: 'Maintain a 70%+ win rate across at least 5 bets.',
      earned: stats.totalBetsPlaced >= 5 && stats.winRate >= 0.7,
    },
    {
      id: 'profit_prophet',
      icon: '📈',
      name: 'Profit Prophet',
      description: 'Earn a net profit of 500+ shekels.',
      earned: stats.netProfitLoss >= 500,
    },
    {
      id: 'money_bags',
      icon: '💰',
      name: 'Money Bags',
      description: 'Earn a net profit of 2,000+ shekels.',
      earned: stats.netProfitLoss >= 2000,
    },
    {
      id: 'bail_out',
      icon: '🏦',
      name: 'Bail-Out Artist',
      description: 'Visit the bank for the first time.',
      earned: player.bankRequestCount >= 1,
    },
    {
      id: 'repeat_offender',
      icon: '😅',
      name: 'Repeat Offender',
      description: 'Hit the bank 5 or more times.',
      earned: player.bankRequestCount >= 5,
    },
    {
      id: 'shameless',
      icon: '🤡',
      name: 'Shameless',
      description: 'Hit the bank 10 or more times.',
      earned: player.bankRequestCount >= 10,
    },
    {
      id: 'explorer',
      icon: '🗺️',
      name: 'Explorer',
      description: 'Visit every page in BetBoyz.',
      earned: isOwnProfile && EXPLORER_PAGES.every((p) => visited.includes(p)),
    },
    {
      id: 'old_money',
      icon: '⏳',
      name: 'Old Money',
      description: 'Keep your account open for 30 days.',
      earned: ageDays >= 30,
    },
  ];
}
