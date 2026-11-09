import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import type { Language } from '../../core/languages';
import type { Theme } from '../../core/theme';
import { GithubLink } from '../../shared/github-link';
import { Logo } from '../../shared/logo';
import { LanguageMenu } from './language-menu';

/** Top bar of the start page: logo, the GitHub link, language and theme. */
@Component({
  selector: 'flipvote-create-room-header',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmTooltipImports,
    GithubLink,
    LanguageMenu,
    Logo,
    TranslocoPipe,
  ],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  host: { class: 'flex h-16 w-full shrink-0 items-center gap-1 px-6' },
  template: `
    <flipvote-logo class="mr-auto" />
    <flipvote-github-link />
    <flipvote-language-menu
      [language]="language()"
      (languageChange)="languageChange.emit($event)"
    />
    <button
      type="button"
      hlmBtn
      variant="ghost"
      size="icon-lg"
      [attr.aria-label]="'createRoom.header.toggleTheme' | transloco"
      [hlmTooltip]="'createRoom.header.toggleTheme' | transloco"
      position="bottom"
      (click)="toggleTheme.emit()"
    >
      <ng-icon [name]="theme() === 'dark' ? 'lucideSun' : 'lucideMoon'" aria-hidden="true" />
    </button>
  `,
})
export class CreateRoomHeader {
  readonly language = input.required<Language>();
  readonly theme = input.required<Theme>();
  readonly languageChange = output<Language>();
  readonly toggleTheme = output();
}
