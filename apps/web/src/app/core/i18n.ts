import {
  DOCUMENT,
  effect,
  EnvironmentProviders,
  inject,
  Injectable,
  isDevMode,
  provideAppInitializer,
  Provider,
  Service,
  signal,
} from '@angular/core';
import {
  getBrowserLang,
  provideTransloco,
  type Translation,
  type TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { firstValueFrom } from 'rxjs';
import { FALLBACK_LANGUAGE, isLanguage, type Language, LANGUAGES } from './languages';
import { SessionService } from './session';
import { provideTranslatedTitles } from './translated-title';

const TRANSLATIONS: Record<Language, () => Promise<Translation>> = {
  en: () => import('../../../public/i18n/en.json').then((m) => m.default),
  de: () => import('../../../public/i18n/de.json').then((m) => m.default),
};

/**
 * Bundles `public/i18n/<lang>.json` as lazy chunks instead of fetching them over HTTP: the landing
 * page is prerendered at build time, and a relative URL has nothing to resolve against there.
 */
@Injectable({ providedIn: 'root' })
class BundledTranslationLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    return TRANSLATIONS[isLanguage(lang) ? lang : FALLBACK_LANGUAGE]();
  }
}

/**
 * The active language: the user's stored choice, else the browser's if it's German, else English.
 * Switching keeps everything running (no reload, the socket stays open) and keeps `<html lang>`
 * in step, so screen readers pronounce the text in the right language.
 */
@Service()
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly session = inject(SessionService);
  private readonly document = inject(DOCUMENT);

  private readonly _language = signal<Language>(this.initialLanguage());
  readonly language = this._language.asReadonly();

  constructor() {
    effect(() => {
      const language = this._language();
      this.transloco.setActiveLang(language);
      this.document.documentElement.lang = language;
    });
  }

  /**
   * Waits for the starting language's file, so the first screen doesn't flash its keys. A file
   * that fails to load must not keep the app from starting; Transloco falls back to English.
   */
  load(): Promise<unknown> {
    return firstValueFrom(this.transloco.load(this._language()), { defaultValue: null }).catch(
      () => null,
    );
  }

  use(language: Language): void {
    this.session.setLanguage(language);
    this._language.set(language);
  }

  private initialLanguage(): Language {
    const stored = this.session.language();
    if (stored) return stored;
    return getBrowserLang() === 'de' ? 'de' : FALLBACK_LANGUAGE;
  }
}

export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    provideTransloco({
      config: {
        availableLangs: [...LANGUAGES],
        defaultLang: FALLBACK_LANGUAGE,
        fallbackLang: FALLBACK_LANGUAGE,
        reRenderOnLangChange: true,
        missingHandler: { useFallbackTranslation: true, logMissingKey: isDevMode() },
        prodMode: !isDevMode(),
      },
      loader: BundledTranslationLoader,
    }),
    // ICU syntax for plurals and selects, e.g. `{count, plural, one {# vote} other {# votes}}`.
    provideTranslocoMessageformat(),
    // Numbers follow the active language, unlike Angular's static LOCALE_ID.
    provideTranslocoLocale({ langToLocaleMapping: { en: 'en-US', de: 'de-DE' } }),
    provideTranslatedTitles(),
    provideAppInitializer(() => inject(LanguageService).load()),
  ];
}
