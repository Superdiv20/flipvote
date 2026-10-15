import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './i18n';

describe('LanguageService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  function create(browserLanguage = 'en-US') {
    TestBed.resetTestingModule();
    vi.stubGlobal('navigator', { languages: [browserLanguage], language: browserLanguage });
    const languages = TestBed.inject(LanguageService);
    TestBed.tick();
    return languages;
  }

  it('starts in English', () => {
    expect(create().language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('starts in German when the browser is set to German', () => {
    expect(create('de-DE').language()).toBe('de');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('de');
  });

  it('switches at once, and remembers the choice over the browser language', () => {
    const languages = create();
    languages.use('de');
    TestBed.tick();
    expect(TestBed.inject(TranslocoService).translate('common.cancel')).toBe('Abbrechen');
    expect(document.documentElement.lang).toBe('de');

    expect(create('fr-FR').language()).toBe('de');
    languages.use('en');
  });
});
