import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RelicTier } from '../data/models';
import { ProgressService } from '../data/progress.service';
import { WarframeDataService } from '../data/warframe-data.service';
import { RelicCard } from './relic-card';

type VaultFilter = 'all' | 'unvaulted' | 'vaulted';

@Component({
  selector: 'app-relics-page',
  imports: [FormsModule, RelicCard],
  templateUrl: './relics-page.html',
  styleUrl: './relics-page.scss',
})
export class RelicsPage {
  private readonly data = inject(WarframeDataService);
  private readonly progress = inject(ProgressService);

  /** The `?q=` query param, bound by withComponentInputBinding() in app.config.ts. */
  readonly q = input<string>();

  protected readonly tiers: RelicTier[] = ['Lith', 'Meso', 'Neo', 'Axi'];

  // linkedSignal: starts from the query param (and resets when it changes), but is also editable.
  protected readonly search = linkedSignal(() => this.q() ?? '');
  protected readonly tier = signal<RelicTier | 'All'>('All');
  protected readonly vault = signal<VaultFilter>('all');
  protected readonly onlyNeeded = signal(false);
  protected readonly onlyOwned = signal(false);

  protected readonly filteredRelics = computed(() => {
    const search = this.search().trim().toLowerCase();

    return this.data.relics().filter((relic) => {
      if (this.tier() !== 'All' && relic.tier !== this.tier()) return false;
      if (this.vault() === 'vaulted' && !relic.vaulted) return false;
      if (this.vault() === 'unvaulted' && relic.vaulted) return false;
      if (this.onlyOwned() && this.progress.relicCount(relic.id) === 0) return false;
      if (
        this.onlyNeeded() &&
        !relic.rewards.some((reward) => this.progress.isRewardNeeded(reward.partId))
      ) {
        return false;
      }
      // Search matches the relic name ("lith a1") or anything inside it ("ash prime").
      return (
        relic.id.toLowerCase().includes(search) ||
        relic.rewards.some((reward) => reward.name.toLowerCase().includes(search))
      );
    });
  });
}
