// The upgrade catalog: every purchasable thing is one entry in this
// list. Adding content means adding an entry, not new logic.

export type UpgradeEffect = {
  perWhack?: number; // flat stars per successful whack, per level
  perSecond?: number; // flat stars per second, per level
  popSpeed?: number; // multiplies the pop interval, per level
  dripMultiplier?: number; // multiplies the star drip, per level
  goldenEveryN?: number; // every Nth whack is golden
};

export type Upgrade = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  effect: UpgradeEffect;
};

export const UPGRADES: Upgrade[] = [
  {
    id: "mallet",
    name: "Bigger Mallet",
    description: "Each whack shakes loose one more star.",
    baseCost: 10,
    costGrowth: 1.65,
    maxLevel: 25,
    effect: { perWhack: 1 },
  },
  {
    id: "burrow",
    name: "Extra Burrow",
    description: "Another burrow sifts stardust around the clock.",
    baseCost: 25,
    costGrowth: 1.75,
    maxLevel: 25,
    effect: { perSecond: 0.4 },
  },
  {
    id: "treats",
    name: "Mole Treats",
    description: "Well-fed moles pop up 15% faster per treat.",
    baseCost: 40,
    costGrowth: 1.9,
    maxLevel: 8,
    effect: { popSpeed: 0.85 },
  },
  {
    id: "golden",
    name: "Golden Mole",
    description: "Every 8th whack strikes gold and pays eightfold.",
    baseCost: 120,
    costGrowth: 2.2,
    maxLevel: 1,
    effect: { goldenEveryN: 8 },
  },
  {
    id: "comet",
    name: "Comet Mole",
    description:
      "A comet-tailed cousin whose burrow drips a steady stream of stars.",
    baseCost: 300,
    costGrowth: 2,
    maxLevel: 25,
    effect: { dripMultiplier: 1.25 },
  },
];

export function costOf(upgrade: Upgrade, level: number): number {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, level));
}
