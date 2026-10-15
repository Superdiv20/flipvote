import { Service, signal } from '@angular/core';
import { isLanguage, type Language } from './languages';
import type { ThemePreference } from './theme';

const TOKEN_KEY = 'flipvote.sessionToken';
const NAME_KEY = 'flipvote.displayName';
const LANGUAGE_KEY = 'flipvote.language';
const THEME_KEY = 'flipvote.theme';

/**
 * Everything this browser remembers: the guest identity (session token and display name), so a
 * refresh rejoins the same seat under the same name, and the language and theme the user chose.
 * The only code that touches localStorage.
 */
@Service()
export class SessionService {
  private _token: string | null = null;

  private readonly _name = signal(read(NAME_KEY));
  /** The last name the user joined with, or `null` before the first join. */
  readonly name = this._name.asReadonly();

  /** Identifies this browser to the server. Generated on first use and kept from then on. */
  get token(): string {
    if (!this._token) {
      this._token = read(TOKEN_KEY) ?? generateToken();
      write(TOKEN_KEY, this._token);
    }
    return this._token;
  }

  setName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._name.set(trimmed);
    write(NAME_KEY, trimmed);
  }

  private readonly _language = signal<Language | null>(readLanguage());
  /** The language the user picked, or `null` when they never did. */
  readonly language = this._language.asReadonly();

  setLanguage(language: Language): void {
    this._language.set(language);
    write(LANGUAGE_KEY, language);
  }

  /** The theme the user picked, or `null` when they never did. */
  readTheme(): ThemePreference | null {
    const stored = read(THEME_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null;
  }

  saveTheme(preference: ThemePreference): void {
    write(THEME_KEY, preference);
  }
}

function readLanguage(): Language | null {
  const stored = read(LANGUAGE_KEY);
  return isLanguage(stored) ? stored : null;
}

/** 128 random bits as hex. `crypto.randomUUID()` only exists in secure contexts, and self-hosted instances may run on plain HTTP. */
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Storage can throw (private mode, blocked site data). The identity then lasts until the tab closes.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory value.
  }
}
