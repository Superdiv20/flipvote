import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePartyPopper } from '@ng-icons/lucide';
import { CardValue } from './card-value';
import { cardLabel } from './deck-types';
import type { VoteResults } from './results';

@Component({
  selector: 'flipvote-results-panel',
  imports: [NgIcon, CardValue],
  providers: [provideIcons({ lucidePartyPopper })],
  host: {
    class:
      'bg-background shadow-float flex w-62 flex-col gap-4 rounded-lg p-5 inset-ring inset-ring-border',
    role: 'region',
    'aria-label': 'Results',
  },
  template: `
    @if (results().consensus; as consensus) {
      <div
        class="bg-brand-soft inset-ring-brand-ring text-brand flex items-center gap-2.5 rounded-md px-3 py-2.5 inset-ring"
      >
        <ng-icon name="lucidePartyPopper" size="18px" aria-hidden="true" />
        <div class="flex flex-col">
          <span class="text-sm font-bold">Consensus!</span>
          <span class="text-xs text-slate-600 dark:text-slate-300"
            >Everyone voted {{ label(consensus) }}</span
          >
        </div>
      </div>
    }
    <div class="flex items-end justify-between">
      <div class="flex flex-col gap-0.5">
        <span class="text-muted-foreground text-xs font-medium">Average</span>
        <span class="text-4xl font-extrabold tracking-[-0.012em]">{{ average() }}</span>
      </div>
      <span class="text-muted-foreground pb-1.5 text-xs font-medium">
        {{ results().count }} {{ results().count === 1 ? 'vote' : 'votes' }}
      </span>
    </div>
    <div class="bg-border h-px" aria-hidden="true"></div>
    <ul class="flex flex-col gap-2" aria-label="Distribution">
      @for (row of rows(); track row.value) {
        <li
          class="grid grid-cols-[28px_1fr_16px] items-center gap-2.5"
          [attr.aria-label]="row.ariaLabel"
        >
          <flipvote-card-value
            class="justify-end [&_span]:text-sm! [&_span]:font-bold"
            [value]="row.value"
            iconSize="16px"
            aria-hidden="true"
          />
          <div class="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
            <div
              class="h-full rounded-full"
              [class]="row.top ? 'bg-brand' : 'bg-slate-400 dark:bg-slate-600'"
              [style.width.%]="row.width"
            ></div>
          </div>
          <span class="text-muted-foreground text-right text-xs font-medium" aria-hidden="true">{{
            row.count
          }}</span>
        </li>
      }
    </ul>
  `,
})
export class ResultsPanel {
  readonly results = input.required<VoteResults>();

  protected readonly average = computed(() => {
    const average = this.results().average;
    if (average === null) return '–';
    return Number.isInteger(average) ? String(average) : average.toFixed(1);
  });

  protected readonly rows = computed(() => {
    const distribution = this.results().distribution;
    const max = Math.max(...distribution.map((row) => row.count));
    return distribution.map((row) => ({
      ...row,
      top: row.count === max,
      width: (row.count / max) * 100,
      ariaLabel: `${cardLabel(row.value)}: ${row.count} ${row.count === 1 ? 'vote' : 'votes'}`,
    }));
  });

  protected label(value: string): string {
    return cardLabel(value);
  }
}
