import type { AppConfig } from '../app/core/config';

/** `ng serve`. The dev server proxies `/api` and `/ws` to the Bun server on :3000 (see `proxy.conf.json`). */
export const environment: AppConfig = {
  production: false,
  apiUrl: '/api',
  wsUrl: '/ws',
};
