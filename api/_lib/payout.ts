import type { BetRecord, WagerRecord } from '../../src/types/index.js';

export interface PayoutResult {
  payouts: Record<string, number>;
}

export function calculatePayouts(bet: BetRecord, wagers: WagerRecord[]): PayoutResult {
  const winIdx = bet.winningOptionIndex!;
  const totalPool = wagers.reduce((sum, w) => sum + w.amount, 0);
  const winningWagers = wagers.filter((w) => w.optionIndex === winIdx);
  const winningTotal = winningWagers.reduce((sum, w) => sum + w.amount, 0);

  const payouts: Record<string, number> = {};

  if (winningTotal === 0) {
    // Nobody bet on the winning option — refund everyone
    for (const w of wagers) {
      payouts[w.player] = (payouts[w.player] ?? 0) + w.amount;
    }
    return { payouts };
  }

  for (const w of winningWagers) {
    const share = Math.floor((w.amount / winningTotal) * totalPool);
    payouts[w.player] = (payouts[w.player] ?? 0) + share;
  }

  return { payouts };
}
