import { Routes } from '@angular/router';

// loadComponent lazy-loads each page: its code is only downloaded when you first visit it.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  {
    path: 'items',
    title: 'Prime Items | Relic Tracker',
    loadComponent: () => import('./items/items-page').then((m) => m.ItemsPage),
  },
  {
    path: 'relics',
    title: 'Relics | Relic Tracker',
    loadComponent: () => import('./relics/relics-page').then((m) => m.RelicsPage),
  },
  { path: '**', redirectTo: 'items' },
];
