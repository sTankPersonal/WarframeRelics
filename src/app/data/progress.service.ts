import { effect, inject, Injectable, signal } from '@angular/core';
import { ItemPart, PrimeItem } from './models';
import { WarframeDataService } from './warframe-data.service';

/** Everything the user has tracked. Keyed by ids from the game data. */
export interface Progress {
  /** partId -> how many the user owns */
  parts: Record<string, number>;
  /** itemId -> true once the user has built the item */
  built: Record<string, boolean>;
  /** relicId -> how many the user owns */
  relics: Record<string, number>;
}

export const STORAGE_KEY = 'relic-tracker.progress';

function loadProgress(): Progress {
  const empty: Progress = { parts: {}, built: {}, relics: {} };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...empty, ...JSON.parse(saved) } : empty;
  } catch {
    return empty;
  }
}

/** The user's tracked progress, saved to localStorage whenever it changes. */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly data = inject(WarframeDataService);
  private readonly state = signal<Progress>(loadProgress());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state())));
  }

  partCount(partId: string): number {
    return this.state().parts[partId] ?? 0;
  }

  setPartCount(partId: string, count: number): void {
    this.state.update((s) => ({ ...s, parts: { ...s.parts, [partId]: Math.max(0, count) } }));
  }

  isBuilt(itemId: string): boolean {
    return this.state().built[itemId] ?? false;
  }

  setBuilt(itemId: string, built: boolean): void {
    this.state.update((s) => ({ ...s, built: { ...s.built, [itemId]: built } }));
  }

  relicCount(relicId: string): number {
    return this.state().relics[relicId] ?? 0;
  }

  setRelicCount(relicId: string, count: number): void {
    this.state.update((s) => ({ ...s, relics: { ...s.relics, [relicId]: Math.max(0, count) } }));
  }

  /** True if the user still has to farm this part (item not built, and not enough owned). */
  isPartNeeded(item: PrimeItem, part: ItemPart): boolean {
    return !this.isBuilt(item.id) && this.partCount(part.id) < part.count;
  }

  /** Like isPartNeeded, but looked up from a relic reward's partId. */
  isRewardNeeded(partId: string | undefined): boolean {
    const item = partId ? this.data.itemByPart().get(partId) : undefined;
    const part = item?.parts.find((p) => p.id === partId);
    return !!item && !!part && this.isPartNeeded(item, part);
  }

  /** True if the item is built, or every part needed to build it is owned. */
  isComplete(item: PrimeItem): boolean {
    return item.parts.every((part) => !this.isPartNeeded(item, part));
  }
}
