import type { AppConfig } from '../app/core/config';

/** Production. Bun serves the app, the API and the socket from one origin, so the paths are relative. */
export const environment: AppConfig = {
  production: true,
  apiUrl: '/api',
  wsUrl: '/ws',
};
