import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCoffee } from '@ng-icons/lucide';
import { COFFEE_CARD } from '@flipvote/protocol';
import { cardLabel, cardText } from './card-label';

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
      <span [class]="textClass()">{{ text() }}</span>
    }
  `,
})
export class CardValue {
  readonly value = input.required<string>();
  readonly iconSize = input('24px');
  readonly size = input<'md' | 'sm'>('md');

  protected readonly isCoffee = computed(() => this.value() === COFFEE_CARD);
  protected readonly label = computed(() => cardLabel(this.value()));
  protected readonly text = computed(() => cardText(this.value()));
  protected readonly textClass = computed(() => {
    const long = this.text().length > 1;
    if (this.size() === 'sm') return long ? 'text-[17px]' : 'text-xl';
    return long ? 'text-[22px]' : 'text-[26px]';
  });
}
