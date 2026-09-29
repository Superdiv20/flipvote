import { Component, computed, input, output } from '@angular/core';
import { CardValue } from './card-value';
import { cardLabel } from './card-label';

/** The deck in front of the current user. Picking a card votes, picking it again withdraws. */
@Component({
  selector: 'flipvote-card-hand',
  imports: [CardValue],
  host: { class: 'flex flex-col items-center gap-4' },
  template: `
    <p class="text-muted-foreground text-sm font-medium" aria-live="polite">{{ status() }}</p>
    <div class="flex flex-wrap justify-center gap-2 pt-2.5" role="group" aria-label="Your cards">
      @for (value of deck(); track value) {
        @let selected = value === selectedValue();
        <button
          type="button"
          class="focus-visible:ring-ring/50 flex h-[70px] w-12 items-center justify-center rounded-lg outline-none focus-visible:ring-3 disabled:cursor-default"
          [class]="selected ? selectedClass : locked() ? lockedClass : idleClass"
          [attr.aria-pressed]="selected"
          [attr.aria-label]="label(value)"
          [disabled]="locked()"
          (click)="pick.emit(value)"
        >
          <flipvote-card-value [value]="value" size="sm" iconSize="20px" />
        </button>
      }
    </div>
  `,
})
export class CardHand {
  readonly deck = input.required<readonly string[]>();
  readonly selectedValue = input<string | null>(null);
  /** After the flip the hand is read-only until the next round. */
  readonly locked = input(false);

  readonly pick = output<string>();

  protected readonly idleClass =
    'bg-background text-foreground cursor-pointer inset-ring inset-ring-border shadow-xs transition-[transform,box-shadow] duration-180 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:inset-ring-slate-300 hover:shadow-float dark:hover:inset-ring-slate-700 motion-reduce:transition-none';
  protected readonly selectedClass =
    'bg-brand text-brand-foreground cursor-pointer -translate-y-2.5 inset-ring inset-ring-brand shadow-[0_8px_16px_-6px_var(--brand)] transition-transform duration-180 motion-reduce:transition-none';
  protected readonly lockedClass =
    'bg-background text-foreground inset-ring inset-ring-border opacity-50';

  protected readonly status = computed(() => {
    if (this.locked()) return 'Round finished — start a new round to vote again';
    const value = this.selectedValue();
    return value === null
      ? 'Pick your estimate'
      : `Your vote: ${cardLabel(value)} · click again to withdraw`;
  });

  protected label(value: string): string {
    return `Vote ${cardLabel(value)}`;
  }
}
