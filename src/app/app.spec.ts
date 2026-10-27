import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { WarframeData } from './data/models';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should render the title and nav', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Answer the game-data request the app makes on startup.
    const data: WarframeData = { generatedAt: '2026-01-01T00:00:00Z', relics: [], items: [] };
    TestBed.inject(HttpTestingController).expectOne('data/warframe-data.json').flush(data);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Relic Tracker');
    expect(compiled.querySelectorAll('nav a').length).toBe(3);
    expect(compiled.querySelector('footer')?.textContent).toContain('2026');
  });
});
