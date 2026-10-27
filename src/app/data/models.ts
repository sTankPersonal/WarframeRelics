// Shape of public/data/warframe-data.json (produced by scripts/update-data.mjs).

export type Rarity = 'common' | 'uncommon' | 'rare';
export type RelicTier = 'Lith' | 'Meso' | 'Neo' | 'Axi';
export type ItemCategory =
  | 'Warframe'
  | 'Primary'
  | 'Secondary'
  | 'Melee'
  | 'Companion'
  | 'Archwing'
  | 'Necramech'
  | 'Other';

export interface RelicReward {
  name: string;
  rarity: Rarity;
  /** Set when the reward is a part of a prime item (i.e. not Forma). */
  partId?: string;
}

export interface Relic {
  /** e.g. "Lith A1" */
  id: string;
  tier: RelicTier;
  code: string;
  vaulted: boolean;
  rewards: RelicReward[];
}

export interface ItemPart {
  id: string;
  /** e.g. "Blueprint", "Neuroptics Blueprint", "Barrel" */
  name: string;
  /** How many are needed to build the item (2 for some dual weapons). */
  count: number;
}

export interface PrimeItem {
  id: string;
  name: string;
  category: ItemCategory;
  parts: ItemPart[];
}

export interface WarframeData {
  generatedAt: string;
  relics: Relic[];
  items: PrimeItem[];
}

/** A relic that drops a given part, and how rare it is in that relic. */
export interface PartSource {
  relic: Relic;
  rarity: Rarity;
}
