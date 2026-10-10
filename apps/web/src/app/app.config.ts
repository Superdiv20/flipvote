import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { ThemeService } from './core/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route params such as `:roomId` arrive as component inputs.
    provideRouter(routes, withComponentInputBinding()),
    // The theme applies on every page from the start, not only once a page that uses the service
    // has created it: otherwise a reload of the landing page shows light even on a dark system.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ],
};
