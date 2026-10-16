import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { Language } from '../../core/languages';
import { LanguageMenu } from './language-menu';
import { Logo } from '../../shared/logo';

/** Logo and copyright, the GitHub link and a second language switch. */
@Component({
  selector: 'flipvote-site-footer',
  imports: [NgIcon, HlmButtonImports, LanguageMenu, Logo, TranslocoPipe],
  providers: [provideIcons({ simpleGithub })],
  host: { class: 'block shadow-[inset_0_1px_0_var(--border)]' },
  template: `
    <div
      class="mx-auto flex max-w-292 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5"
    >
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <flipvote-logo size="sm" />
        <span class="text-muted-foreground text-[13px] leading-5">
          {{ 'landing.footer.copyright' | transloco: { year } }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <a
          hlmBtn
          variant="ghost"
          size="lg"
          class="gap-2"
          target="_blank"
          rel="noopener"
          [href]="githubUrl()"
        >
          <ng-icon name="simpleGithub" aria-hidden="true" />
          GitHub
        </a>
        <flipvote-language-menu
          [language]="language()"
          (languageChange)="languageChange.emit($event)"
        />
      </div>
    </div>
  `,
})
export class SiteFooter {
  readonly language = input.required<Language>();
  readonly githubUrl = input.required<string>();
  readonly languageChange = output<Language>();

  protected readonly year = new Date().getFullYear();
}
