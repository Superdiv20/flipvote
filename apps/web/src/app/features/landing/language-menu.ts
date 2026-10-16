import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideGlobe } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import type { Language } from '../../core/languages';

/** Globe button showing the active language's code, with a dropdown to switch. */
@Component({
  selector: 'flipvote-language-menu',
  imports: [NgIcon, HlmButtonImports, HlmDropdownMenuImports, TranslocoPipe],
  providers: [provideIcons({ lucideChevronDown, lucideGlobe })],
  host: { class: 'flex' },
  template: `
    <button
      type="button"
      hlmBtn
      variant="ghost"
      size="lg"
      class="gap-1.5 px-2.5"
      [attr.aria-label]="'landing.languageMenu.label' | transloco"
      [hlmDropdownMenuTrigger]="menu"
      [align]="align()"
    >
      <ng-icon name="lucideGlobe" aria-hidden="true" />
      <span class="uppercase">{{ language() }}</span>
      <ng-icon name="lucideChevronDown" size="12px" aria-hidden="true" />
    </button>

    <ng-template #menu>
      <hlm-dropdown-menu class="w-42">
        @for (option of options; track option.value) {
          <button
            hlmDropdownMenuRadio
            [checked]="language() === option.value"
            [attr.lang]="option.value"
            (triggered)="languageChange.emit(option.value)"
          >
            {{ option.labelKey | transloco }}
            <hlm-dropdown-menu-radio-indicator />
          </button>
        }
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
export class LanguageMenu {
  readonly language = input.required<Language>();
  readonly align = input<'start' | 'end'>('end');
  readonly languageChange = output<Language>();

  protected readonly options = LANGUAGE_OPTIONS;
}

/** Each language named in itself, so everyone finds theirs whatever is active. */
const LANGUAGE_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: marker('landing.languageMenu.en') },
  { value: 'de', labelKey: marker('landing.languageMenu.de') },
];
