import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrimeItem } from '../data/models';
import { ProgressService } from '../data/progress.service';
import { WarframeDataService } from '../data/warframe-data.service';
import { Counter } from '../shared/counter';

@Component({
  selector: 'app-item-card',
  imports: [Counter, RouterLink],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})
export class ItemCard {
  protected readonly progress = inject(ProgressService);
  private readonly data = inject(WarframeDataService);

  readonly item = input.required<PrimeItem>();

  protected readonly built = computed(() => this.progress.isBuilt(this.item().id));
  protected readonly complete = computed(() => this.progress.isComplete(this.item()));

  /** The item's parts, each with the relics that drop it split into unvaulted/vaulted. */
  protected readonly parts = computed(() =>
    this.item().parts.map((part) => {
      const sources = this.data.sourcesByPart().get(part.id) ?? [];
      return {
        ...part,
        available: sources.filter((s) => !s.relic.vaulted),
        vaulted: sources.filter((s) => s.relic.vaulted),
      };
    }),
  );
}
