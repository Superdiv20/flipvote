import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCoffee } from '@ng-icons/lucide';
import { cardLabel, COFFEE } from './deck-types';

/** The face of a card: its number, `?`, or the coffee glyph. */
@Component({
  selector: 'flipvote-card-value',
  imports: [NgIcon],
  providers: [provideIcons({ lucideCoffee })],
  host: { class: 'inline-flex items-center justify-center font-extrabold tracking-[-0.012em]' },
  template: `
    @if (isCoffee()) {
      <ng-icon name="lucideCoffee" [size]="iconSize()" aria-hidden="true" />
      <span class="sr-only">{{ label() }}</span>
    } @else {
      <span [class]="value().length > 1 ? 'text-[22px]' : 'text-[26px]'">{{ value() }}</span>
    }
  `,
})
export class CardValue {
  readonly value = input.required<string>();
  readonly iconSize = input('24px');

  protected readonly isCoffee = computed(() => this.value() === COFFEE);
  protected readonly label = computed(() => cardLabel(this.value()));
}
