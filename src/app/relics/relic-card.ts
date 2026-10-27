import { Component, computed, inject, input } from '@angular/core';
import { Relic } from '../data/models';
import { ProgressService } from '../data/progress.service';
import { Counter } from '../shared/counter';

const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2 };

@Component({
  selector: 'app-relic-card',
  imports: [Counter],
  templateUrl: './relic-card.html',
  styleUrl: './relic-card.scss',
})
export class RelicCard {
  protected readonly progress = inject(ProgressService);

  readonly relic = input.required<Relic>();

  /** Rewards sorted common -> rare, flagged with whether the user still needs them. */
  protected readonly rewards = computed(() =>
    this.relic()
      .rewards.map((reward) => ({ ...reward, needed: this.progress.isRewardNeeded(reward.partId) }))
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]),
  );
}
