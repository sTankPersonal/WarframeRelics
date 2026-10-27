import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemCategory } from '../data/models';
import { ProgressService } from '../data/progress.service';
import { WarframeDataService } from '../data/warframe-data.service';
import { ItemCard } from '../items/item-card';

@Component({
  imports: [FormsModule, ItemCard],
  selector: 'app-wishlist-page',
  styleUrl: './wishlist-page.scss',
  templateUrl: './wishlist-page.html',
})
export class WishlistPage {
  protected readonly data = inject(WarframeDataService);
  protected readonly progress = inject(ProgressService);

  protected readonly search = signal('');
  protected readonly category = signal<ItemCategory | 'All'>('All');
  protected readonly onlyFarmable = signal(false);

  protected readonly categories = computed(() => [
    ...new Set(this.data.items().map((item) => item.category)),
  ]);

  protected readonly wishlistItems = computed(() =>
    this.data.items().filter((item) => this.progress.isFavourite(item.id)),
  );

  protected readonly filteredItems = computed(() => {
    const search = this.search().trim().toLowerCase();
    return this.wishlistItems().filter(
      (item) => 
        item.name.toLowerCase().includes(search) &&
        (this.category() === 'All' || item.category === this.category()) &&
        (!this.onlyFarmable() || this.progress.isComplete(item) || this.progress.canFarm(item)),
    );
  })
}
