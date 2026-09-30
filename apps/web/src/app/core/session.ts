import { Service, signal } from '@angular/core';

const TOKEN_KEY = 'flipvote.sessionToken';
const NAME_KEY = 'flipvote.displayName';

/**
 * The guest identity. Owns the session token and the display name in localStorage, so a refresh
 * rejoins the same seat under the same name. Nothing else touches these keys.
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
