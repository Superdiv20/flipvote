import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideI18n } from './core/i18n';
import { ThemeService } from './core/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route params such as `:roomId` arrive as component inputs.
    provideRouter(routes, withComponentInputBinding()),
    // Picks up the prerendered landing page instead of rendering it again. Clicks made before the
    // app is ready are replayed. Pages rendered in the browser have nothing to hydrate.
    provideClientHydration(withEventReplay()),
    // The theme applies on every page from the start, not only once a page that uses the service
    // has created it: otherwise a reload of the landing page shows light even on a dark system.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
    // Translations (en, de), loaded before the first screen.
    provideI18n(),
  ],
};
