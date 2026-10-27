import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemCategory } from '../data/models';
import { ProgressService } from '../data/progress.service';
import { WarframeDataService } from '../data/warframe-data.service';
import { ItemCard } from './item-card';

@Component({
  selector: 'app-items-page',
  imports: [FormsModule, ItemCard],
  templateUrl: './items-page.html',
  styleUrl: './items-page.scss',
})
export class ItemsPage {
  private readonly data = inject(WarframeDataService);
  private readonly progress = inject(ProgressService);

  protected readonly search = signal('');
  protected readonly category = signal<ItemCategory | 'All'>('All');
  protected readonly hideComplete = signal(false);

  protected readonly categories = computed(() => [
    ...new Set(this.data.items().map((item) => item.category)),
  ]);

  protected readonly filteredItems = computed(() => {
    const search = this.search().trim().toLowerCase();
    return this.data.items().filter(
      (item) =>
        item.name.toLowerCase().includes(search) &&
        (this.category() === 'All' || item.category === this.category()) &&
        !(this.hideComplete() && this.progress.isComplete(item)),
    );
  });

  protected readonly completeCount = computed(
    () => this.data.items().filter((item) => this.progress.isComplete(item)).length,
  );
  protected readonly totalCount = computed(() => this.data.items().length);
}
