import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideMoon, lucidePlus, lucideSun, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import type { Language } from '../../core/languages';
import type { Theme } from '../../core/theme';
import { LanguageMenu } from './language-menu';
import { Logo } from '../../shared/logo';

/**
 * Sticky top bar. From `md` up it holds the section links, language, theme and the call to action;
 * below that, the call to action and a menu button that folds the rest out underneath.
 */
@Component({
  selector: 'flipvote-site-header',
  imports: [
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmSeparatorImports,
    HlmTooltipImports,
    LanguageMenu,
    Logo,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideMenu, lucideMoon, lucidePlus, lucideSun, lucideX })],
  host: {
    class: 'bg-background sticky top-0 z-20 block shadow-[inset_0_-1px_0_var(--border)]',
  },
  template: `
    <div class="mx-auto flex h-16 max-w-292 items-center gap-2 px-6">
      <flipvote-logo class="mr-4" />

      <nav
        class="flex items-center gap-1 max-md:hidden"
        [attr.aria-label]="'landing.header.nav' | transloco"
      >
        <a hlmBtn variant="ghost" size="lg" href="#how">{{ 'landing.header.how' | transloco }}</a>
        <a hlmBtn variant="ghost" size="lg" href="#features">{{
          'landing.header.features' | transloco
        }}</a>
      </nav>

      <div class="flex-1"></div>

      <div class="flex items-center gap-1 max-md:hidden">
        <flipvote-language-menu
          [language]="language()"
          (languageChange)="languageChange.emit($event)"
        />
        <button
          type="button"
          hlmBtn
          variant="ghost"
          size="icon-lg"
          [attr.aria-label]="'landing.header.toggleTheme' | transloco"
          [hlmTooltip]="'landing.header.toggleTheme' | transloco"
          position="bottom"
          (click)="toggleTheme.emit()"
        >
          <ng-icon [name]="theme() === 'dark' ? 'lucideSun' : 'lucideMoon'" aria-hidden="true" />
        </button>
        <hlm-separator orientation="vertical" class="mx-2 h-5 self-center!" />
        <a
          hlmBtn
          size="lg"
          class="bg-brand text-brand-foreground hover:bg-brand-hover gap-2 px-4"
          routerLink="/createRoom"
        >
          <ng-icon name="lucidePlus" aria-hidden="true" />
          {{ 'common.createRoom' | transloco }}
        </a>
      </div>

      <div class="flex items-center gap-1 md:hidden">
        <a
          hlmBtn
          class="bg-brand text-brand-foreground hover:bg-brand-hover px-3"
          routerLink="/createRoom"
        >
          {{ 'common.createRoom' | transloco }}
        </a>
        <button
          type="button"
          hlmBtn
          variant="ghost"
          size="icon-lg"
          aria-controls="site-menu"
          [attr.aria-expanded]="menuOpen()"
          [attr.aria-label]="'landing.header.menu' | transloco"
          (click)="menuOpen.set(!menuOpen())"
        >
          <ng-icon [name]="menuOpen() ? 'lucideX' : 'lucideMenu'" aria-hidden="true" />
        </button>
      </div>
    </div>

    @if (menuOpen()) {
      <div
        id="site-menu"
        class="flex flex-col gap-1 px-4 pt-2 pb-4 shadow-[inset_0_-1px_0_var(--border)] md:hidden"
      >
        <nav class="flex flex-col gap-1" [attr.aria-label]="'landing.header.nav' | transloco">
          <a
            hlmBtn
            variant="ghost"
            size="lg"
            class="justify-start px-3"
            href="#how"
            (click)="menuOpen.set(false)"
          >
            {{ 'landing.header.how' | transloco }}
          </a>
          <a
            hlmBtn
            variant="ghost"
            size="lg"
            class="justify-start px-3"
            href="#features"
            (click)="menuOpen.set(false)"
          >
            {{ 'landing.header.features' | transloco }}
          </a>
        </nav>
        <hlm-separator class="my-2" />
        <div class="flex items-center justify-between gap-2">
          <flipvote-language-menu
            align="start"
            [language]="language()"
            (languageChange)="languageChange.emit($event)"
          />
          <button
            type="button"
            hlmBtn
            variant="ghost"
            size="lg"
            class="gap-2"
            (click)="toggleTheme.emit()"
          >
            <ng-icon [name]="theme() === 'dark' ? 'lucideSun' : 'lucideMoon'" aria-hidden="true" />
            {{
              'landing.header.switchTheme'
                | transloco: { to: theme() === 'dark' ? 'light' : 'dark' }
            }}
          </button>
        </div>
      </div>
    }
  `,
})
export class SiteHeader {
  readonly language = input.required<Language>();
  readonly theme = input.required<Theme>();

  readonly languageChange = output<Language>();
  readonly toggleTheme = output();

  protected readonly menuOpen = signal(false);
}
