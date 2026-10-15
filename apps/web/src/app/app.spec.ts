import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';
import { of } from 'rxjs';
import en from '../../public/i18n/en.json';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe('app start', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
    vi.unstubAllGlobals();
  });

  it('applies the system theme before any page has asked for it', async () => {
    // A fresh start, e.g. a reload of the landing page, on a system set to dark.
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    TestBed.configureTestingModule({
      // The real config, with the translation files read from disk instead of over HTTP.
      providers: [
        ...appConfig.providers,
        { provide: TRANSLOCO_LOADER, useValue: { getTranslation: () => of(en) } },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    TestBed.tick();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
