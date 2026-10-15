import { importProvidersFrom } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import de from '../public/i18n/de.json';
import en from '../public/i18n/en.json';

/** Every spec gets the real translations, preloaded, so templates render English text as in the app. */
export default [
  importProvidersFrom(
    TranslocoTestingModule.forRoot({
      langs: { en, de },
      translocoConfig: { availableLangs: ['en', 'de'], defaultLang: 'en', fallbackLang: 'en' },
      preloadLangs: true,
    }),
  ),
  provideTranslocoMessageformat(),
  provideTranslocoLocale({ langToLocaleMapping: { en: 'en-US', de: 'de-DE' } }),
];
