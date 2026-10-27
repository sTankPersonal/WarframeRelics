import { httpResource } from '@angular/common/http';
import { computed, Injectable } from '@angular/core';
import { PartSource, PrimeItem, WarframeData } from './models';

/** Loads the static game data once and exposes lookups derived from it. */
@Injectable({ providedIn: 'root' })
export class WarframeDataService {
  private readonly data = httpResource<WarframeData>(() => 'data/warframe-data.json');

  readonly isLoading = this.data.isLoading;
  readonly error = this.data.error;

  readonly relics = computed(() => this.data.value()?.relics ?? []);
  readonly items = computed(() => this.data.value()?.items ?? []);
  readonly generatedAt = computed(() => this.data.value()?.generatedAt);

  /** partId -> the prime item it builds */
  readonly itemByPart = computed(() => {
    const map = new Map<string, PrimeItem>();
    for (const item of this.items()) {
      for (const part of item.parts) map.set(part.id, item);
    }
    return map;
  });

  /** partId -> every relic that drops it, unvaulted relics first */
  readonly sourcesByPart = computed(() => {
    const map = new Map<string, PartSource[]>();
    for (const relic of this.relics()) {
      for (const reward of relic.rewards) {
        if (!reward.partId) continue;
        const sources = map.get(reward.partId) ?? [];
        sources.push({ relic, rarity: reward.rarity });
        map.set(reward.partId, sources);
      }
    }
    for (const sources of map.values()) {
      sources.sort((a, b) => Number(a.relic.vaulted) - Number(b.relic.vaulted));
    }
    return map;
  });
}
