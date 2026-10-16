import { Component, effect, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { translateSignal } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { LanguageService } from '../../core/i18n';
import { ThemeService } from '../../core/theme';
import { Faq } from './faq';
import { FeatureGrid } from './feature-grid';
import { FinalCta } from './final-cta';
import { Hero } from './hero';
import { HowItWorks } from './how-it-works';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

const GITHUB_URL = 'https://github.com/Superdiv20/flipvote';

/** The marketing page at `/`. Only this component injects services; the sections are presentational. */
@Component({
  selector: 'flipvote-landing-page',
  imports: [SiteHeader, Hero, HowItWorks, FeatureGrid, Faq, FinalCta, SiteFooter],
  host: { class: 'bg-background text-foreground block min-h-dvh antialiased' },
  template: `
    <flipvote-site-header
      [language]="languageService.language()"
      [theme]="themeService.theme()"
      (languageChange)="languageService.use($event)"
      (toggleTheme)="themeService.toggle()"
    />
    <main>
      <flipvote-hero [githubUrl]="githubUrl" />
      <flipvote-how-it-works />
      <flipvote-feature-grid />
      <flipvote-faq />
      <flipvote-final-cta />
    </main>
    <flipvote-site-footer
      [language]="languageService.language()"
      [githubUrl]="githubUrl"
      (languageChange)="languageService.use($event)"
    />
  `,
})
export class LandingPage {
  protected readonly languageService = inject(LanguageService);
  protected readonly themeService = inject(ThemeService);
  protected readonly githubUrl = GITHUB_URL;

  private readonly pageDescription = translateSignal(marker('landing.meta.description'));

  constructor() {
    const meta = inject(Meta);
    // The title comes from the route. Both are prerendered, so search engines find them in the page source.
    effect(() => meta.updateTag({ name: 'description', content: this.pageDescription() }));
  }
}
