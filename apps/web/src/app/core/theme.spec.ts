import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

/** A `prefers-color-scheme: dark` query whose answer the test can change, like the OS setting. */
function fakeSystemTheme(dark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: dark,
    addEventListener: (_: 'change', listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_: 'change', listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => query,
  });
  return {
    /** The user switches the OS between light and dark. */
    set(next: boolean) {
      query.matches = next;
      for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
    },
  };
}

function create(): ThemeService {
  const service = TestBed.inject(ThemeService);
  TestBed.tick();
  return service;
}

const isDarkOnPage = () => document.documentElement.classList.contains('dark');

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());

  describe('without a saved preference', () => {
    it('follows the system: dark', () => {
      fakeSystemTheme(true);
      const theme = create();
      expect(theme.preference()).toBe('system');
      expect(theme.theme()).toBe('dark');
      expect(isDarkOnPage()).toBe(true);
    });

    it('follows the system: light', () => {
      fakeSystemTheme(false);
      const theme = create();
      expect(theme.theme()).toBe('light');
      expect(isDarkOnPage()).toBe(false);
    });

    it('switches along when the system setting changes', () => {
      const system = fakeSystemTheme(false);
      const theme = create();
      system.set(true);
      TestBed.tick();
      expect(theme.theme()).toBe('dark');
      expect(isDarkOnPage()).toBe(true);
    });
  });

  describe('with an explicit choice', () => {
    it('ignores the system setting', () => {
      const system = fakeSystemTheme(true);
      const theme = create();
      theme.setPreference('light');
      system.set(true);
      TestBed.tick();
      expect(theme.theme()).toBe('light');
      expect(isDarkOnPage()).toBe(false);
    });

    it('can go back to following the system', () => {
      fakeSystemTheme(true);
      const theme = create();
      theme.setPreference('light');
      theme.setPreference('system');
      expect(theme.theme()).toBe('dark');
    });
  });

  describe('the header toggle', () => {
    it('picks the opposite of what is shown, also when following the system', () => {
      fakeSystemTheme(true);
      const theme = create();
      theme.toggle();
      expect(theme.preference()).toBe('light');
      theme.toggle();
      expect(theme.preference()).toBe('dark');
    });
  });

  describe('remembering', () => {
    it('saves the preference, including system', () => {
      fakeSystemTheme(false);
      const theme = create();
      theme.setPreference('dark');
      TestBed.tick();
      expect(localStorage.getItem('flipvote.theme')).toBe('dark');
      theme.setPreference('system');
      TestBed.tick();
      expect(localStorage.getItem('flipvote.theme')).toBe('system');
    });

    it('starts with the saved preference', () => {
      fakeSystemTheme(true);
      localStorage.setItem('flipvote.theme', 'light');
      expect(create().theme()).toBe('light');
    });

    it('treats an unknown saved value as system', () => {
      fakeSystemTheme(true);
      localStorage.setItem('flipvote.theme', 'purple');
      const theme = create();
      expect(theme.preference()).toBe('system');
      expect(theme.theme()).toBe('dark');
    });
  });
});
