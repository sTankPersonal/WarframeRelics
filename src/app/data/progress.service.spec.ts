import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PrimeItem } from './models';
import { ProgressService, STORAGE_KEY } from './progress.service';

const ashPrime: PrimeItem = {
  id: 'ash',
  name: 'Ash Prime',
  category: 'Warframe',
  parts: [
    { id: 'ash-bp', name: 'Blueprint', count: 1 },
    { id: 'ash-blade', name: 'Blade', count: 2 },
  ],
};

describe('ProgressService', () => {
  let progress: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    progress = TestBed.inject(ProgressService);
  });

  it('needs every part until enough are owned', () => {
    expect(progress.isComplete(ashPrime)).toBe(false);

    progress.setPartCount('ash-bp', 1);
    progress.setPartCount('ash-blade', 1);
    expect(progress.isPartNeeded(ashPrime, ashPrime.parts[1])).toBe(true);

    progress.setPartCount('ash-blade', 2);
    expect(progress.isComplete(ashPrime)).toBe(true);
  });

  it('needs nothing once the item is built', () => {
    progress.setBuilt('ash', true);
    expect(progress.isComplete(ashPrime)).toBe(true);
  });

  it('never stores negative counts', () => {
    progress.setRelicCount('Lith A1', -1);
    expect(progress.relicCount('Lith A1')).toBe(0);
  });

  it('saves to localStorage', () => {
    progress.setRelicCount('Lith A1', 3);
    TestBed.tick(); // run the saving effect
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).relics['Lith A1']).toBe(3);
  });
});
