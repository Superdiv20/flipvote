import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

interface DemoSeat {
  /** `null` stays face down: the table shows both states, flipped and still hidden. */
  value: string | null;
  /** A name, or `null` for the visitor's own seat ("You"). */
  name: string | null;
}

const SEATS: DemoSeat[] = [
  { value: '3', name: 'Anna' },
  { value: null, name: 'Ben' },
  { value: '5', name: 'Chen' },
  { value: null, name: 'Dana' },
  { value: '8', name: null },
];

const FIRST_FLIP_DELAY_MS = 700;
const REPLAY_DELAY_MS = 150;
const STAGGER_MS = 220;

/**
 * A miniature of the room's table with five seat cards. It flips once after the page loads and
 * again on every click. With reduced motion the cards show face up right away.
 */
@Component({
  selector: 'flipvote-hero-table',
  imports: [NgIcon, TranslocoPipe],
  providers: [provideIcons({ lucideCheck })],
  host: { class: 'flex justify-center' },
  styles: `
    .card {
      perspective: 700px;
    }
    .card-inner {
      transform-style: preserve-3d;
      transition: transform 700ms cubic-bezier(0.2, 0, 0, 1);
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
    <button
      type="button"
      class="bg-table shadow-table inset-ring-border focus-visible:ring-ring/50 flex cursor-pointer justify-center gap-[clamp(10px,2vw,28px)] rounded-full px-[clamp(20px,5vw,64px)] pt-[clamp(20px,3vw,36px)] pb-[clamp(16px,2.4vw,28px)] inset-ring outline-none select-none focus-visible:ring-3"
      [title]="'landing.hero.replay' | transloco"
      [attr.aria-label]="'landing.hero.replay' | transloco"
      (click)="play(replayDelay)"
    >
      @for (seat of seats; track $index) {
        <span class="flex flex-col items-center gap-2" aria-hidden="true">
          <span class="card block aspect-[52/76] w-[clamp(46px,6vw,76px)]">
            <span class="card-inner relative block size-full" [class.flipped]="flipped()[$index]">
              <span
                class="face bg-card-back inset-ring-brand-ring absolute inset-0 flex items-center justify-center rounded-[clamp(8px,1vw,10px)] shadow-xs inset-ring"
              >
                <span
                  class="inset-ring-brand-ring text-brand flex h-[76%] w-[64%] items-center justify-center rounded-[5px] inset-ring"
                >
                  <ng-icon name="lucideCheck" size="16px" />
                </span>
              </span>
              <span
                class="face face-front bg-background shadow-float inset-ring-border absolute inset-0 flex items-center justify-center rounded-[clamp(8px,1vw,10px)] text-[clamp(22px,2.8vw,34px)] font-extrabold tracking-[-0.012em] inset-ring"
              >
                {{ seat.value }}
              </span>
            </span>
          </span>
          <span class="text-muted-foreground text-[13px] leading-5 font-medium whitespace-nowrap">
            {{ seat.name ?? ('landing.hero.you' | transloco) }}
          </span>
        </span>
      }
    </button>
  `,
})
export class HeroTable {
  protected readonly seats = SEATS;
  protected readonly replayDelay = REPLAY_DELAY_MS;
  protected readonly flipped = signal(SEATS.map(() => false));

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    // Browser only: the prerendered page shows the cards face down, the flip plays on arrival.
    afterNextRender(() => this.play(FIRST_FLIP_DELAY_MS));
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected play(delay: number): void {
    this.clearTimers();
    const target = SEATS.map((seat) => seat.value !== null);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.flipped.set(target);
      return;
    }
    this.flipped.set(SEATS.map(() => false));
    let order = 0;
    SEATS.forEach((seat, index) => {
      if (seat.value === null) return;
      const timer = setTimeout(
        () => this.flipped.update((flipped) => flipped.map((f, i) => f || i === index)),
        delay + order++ * STAGGER_MS,
      );
      this.timers.push(timer);
    });
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
