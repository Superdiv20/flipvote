import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  it('renders every section, with the calls to action leading to the create-room page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LandingPage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Estimate together, reveal at once.');
    expect(page.querySelector('#how h2')?.textContent).toContain('How it works');
    expect(page.querySelector('#features h2')?.textContent).toContain('Features');

    const createLinks = [...page.querySelectorAll('a')].filter((a) =>
      a.textContent?.includes('Create a room'),
    );
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks.every((a) => a.getAttribute('href') === '/createRoom')).toBe(true);
  });
});
