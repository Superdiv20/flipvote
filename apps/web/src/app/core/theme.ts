import { computed, DestroyRef, DOCUMENT, effect, inject, Service, signal } from '@angular/core';

/** What is shown. */
export type Theme = 'light' | 'dark';

/** What the user picked. `system` follows the operating system, also when it changes later. */
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'flipvote.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Light/dark mode, applied as the `.dark` class on <html>. The preference is remembered per
 * browser; without one, the app follows the system setting.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkQuery = this.document.defaultView?.matchMedia?.(DARK_QUERY) ?? null;

  /** Whether the operating system currently asks for dark mode. Updates when the user switches it. */
  private readonly systemDark = signal(this.darkQuery?.matches ?? false);

  readonly preference = signal<ThemePreference>(readPreference());

  readonly theme = computed<Theme>(() => {
    const preference = this.preference();
    if (preference !== 'system') return preference;
    return this.systemDark() ? 'dark' : 'light';
  });

  constructor() {
    const onSystemChange = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.darkQuery?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() =>
      this.darkQuery?.removeEventListener('change', onSystemChange),
    );

    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.theme() === 'dark');
    });
    effect(() => writePreference(this.preference()));
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  /** The quick switch in the header: always the opposite of what is shown, as an explicit choice. */
  toggle(): void {
    this.preference.set(this.theme() === 'dark' ? 'light' : 'dark');
  }
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage can be unavailable (private mode).
  }
  return 'system';
}

function writePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
}
