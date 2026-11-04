import { costOf, type Upgrade } from "./upgrades.ts";

export const BASE_DRIP = 0.2; // the first burrow sifts stardust on its own
export const GOLDEN_PAYOUT = 8;

export type GameState = {
  stars: number;
  whacks: number;
  levels: Record<string, number>;
};

export function createInitialState(): GameState {
  return { stars: 0, whacks: 0, levels: {} };
}

export function levelOf(state: GameState, id: string): number {
  return state.levels[id] ?? 0;
}

export function costOfNext(state: GameState, upgrade: Upgrade): number {
  return costOf(upgrade, levelOf(state, upgrade.id));
}

export function canBuy(state: GameState, upgrade: Upgrade): boolean {
  return levelOf(state, upgrade.id) < upgrade.maxLevel &&
    state.stars >= costOfNext(state, upgrade);
}

// Purchase rules live here and only here: whether the player may buy,
// and what a purchase does to state. Rates are derived elsewhere.
export function buy(state: GameState, upgrade: Upgrade): boolean {
  if (!canBuy(state, upgrade)) {
    return false;
  }
  state.stars -= costOfNext(state, upgrade);
  state.levels[upgrade.id] = levelOf(state, upgrade.id) + 1;
  return true;
}
