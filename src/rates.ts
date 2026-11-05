import { BASE_DRIP, type GameState, levelOf } from "./state.ts";
import { UPGRADES } from "./upgrades.ts";

export type Rates = {
  perWhack: number;
  perSecond: number;
  popIntervalMs: number;
  goldenEveryN: number; // 0 means golden whacks are disabled
  goldenPayout: number;
};

const BASE_POP_MS = 1800;
const MIN_POP_MS = 450;

// Rates are always derived from the owned levels, never stored. One
// pass over the catalog answers what the system does right now, so a
// purchase only changes data and the rate math stays in one place.
export function deriveRates(state: GameState): Rates {
  let perWhack = 1;
  let drip = BASE_DRIP;
  let popIntervalMs = BASE_POP_MS;
  let dripMultiplier = 1;
  let goldenEveryN = 0;
  let goldenMultiplier = 1;
  for (const upgrade of UPGRADES) {
    const level = levelOf(state, upgrade.id);
    if (level === 0) {
      continue;
    }
    const effect = upgrade.effect;
    if (effect.perWhack !== undefined) {
      perWhack += effect.perWhack * level;
    }
    if (effect.perSecond !== undefined) {
      drip += effect.perSecond * level;
    }
    if (effect.popSpeed !== undefined) {
      popIntervalMs *= Math.pow(effect.popSpeed, level);
    }
    if (effect.dripMultiplier !== undefined) {
      dripMultiplier *= Math.pow(effect.dripMultiplier, level);
    }
    if (effect.goldenEveryN !== undefined) {
      goldenEveryN = effect.goldenEveryN;
    }
    if (effect.goldenMultiplier !== undefined) {
      goldenMultiplier = effect.goldenMultiplier;
    }
  }
  return {
    perWhack,
    perSecond: drip * dripMultiplier,
    popIntervalMs: Math.max(MIN_POP_MS, popIntervalMs),
    goldenEveryN,
    goldenPayout: goldenEveryN > 0 ? goldenMultiplier : 1,
  };
}
