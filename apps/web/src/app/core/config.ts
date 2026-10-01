import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  production: boolean;
  /** Base URL of the HTTP API, e.g. `/api` or `https://api.example.com/api`. */
  apiUrl: string;
  /** WebSocket endpoint. A relative path is resolved against the page, with `ws:`/`wss:` to match `http:`/`https:`. */
  wsUrl: string;
}

/** The build's environment. The development build swaps in `environment.development.ts`. Override it in tests if needed. */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => environment,
});
