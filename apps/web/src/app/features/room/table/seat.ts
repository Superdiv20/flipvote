import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { CardValue } from '../hand/card-value';
import { cardLabel } from '../hand/card-label';

/** One participant at the table: their card (empty, face down, or flipped) and name. */
@Component({
  selector: 'flipvote-seat',
  imports: [NgIcon, CardValue],
  providers: [provideIcons({ lucideCheck })],
  host: {
    class: 'flex flex-col items-center gap-2',
    role: 'listitem',
    '[attr.aria-label]': 'ariaLabel()',
  },
  styles: `
    .card {
      perspective: 600px;
    }
    .card-inner {
      transform-style: preserve-3d;
      transition: transform 520ms cubic-bezier(0.2, 0, 0, 1);
    }
    .card-inner.flipped {
      transform: rotateY(180deg);
    }
    .face {
      backface-visibility: hidden;
    }
    .face-front {
      transform: rotateY(180deg);
    }
    @media (prefers-reduced-motion: reduce) {
      .card-inner {
        transition: none;
      }
    }
  `,
  template: `
    @if (hasVoted()) {
      <div class="card h-19 w-13" aria-hidden="true">
        <div
          class="card-inner relative size-full"
          [class.flipped]="revealed()"
          [style.transition-delay.ms]="flipDelay()"
        >
          <div
            class="face bg-card-back inset-ring-brand-ring absolute inset-0 flex items-center justify-center rounded-lg shadow-xs inset-ring"
          >
            <div
              class="inset-ring-brand-ring text-brand flex h-14.5 w-8.5 items-center justify-center rounded-[5px] inset-ring"
            >
              <ng-icon name="lucideCheck" size="16px" />
            </div>
          </div>
          <div
            class="face face-front bg-background shadow-float absolute inset-0 flex items-center justify-center rounded-lg inset-ring"
            [class]="consensus() ? 'inset-ring-brand-ring text-brand' : 'inset-ring-border'"
          >
            @if (vote(); as vote) {
              <flipvote-card-value [value]="vote" iconSize="20px" />
            }
          </div>
        </div>
      </div>
    } @else {
      <div
        class="h-19 w-13 rounded-lg border-[1.5px] border-dashed border-slate-300 dark:border-slate-700"
        aria-hidden="true"
      ></div>
    }
    <span
      class="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap"
      [class.text-muted-foreground]="!hasVoted()"
    >
      {{ name() }}
      @if (isSelf()) {
        <span class="text-muted-foreground text-xs">(you)</span>
      }
    </span>
  `,
})
export class Seat {
  readonly name = input.required<string>();
  readonly isSelf = input(false);
  readonly hasVoted = input.required<boolean>();
  readonly vote = input<string>();
  readonly flipped = input.required<boolean>();
  readonly consensus = input(false);
  /** Staggers the flip around the table. */
  readonly flipDelay = input(0);

  protected readonly revealed = computed(() => this.flipped() && this.vote() !== undefined);

  protected readonly ariaLabel = computed(() => {
    const name = this.isSelf() ? `${this.name()} (you)` : this.name();
    const vote = this.vote();
    if (this.flipped())
      return vote === undefined ? `${name}: no vote` : `${name}: ${cardLabel(vote)}`;
    return `${name}: ${this.hasVoted() ? 'voted' : 'not voted yet'}`;
  });
}
