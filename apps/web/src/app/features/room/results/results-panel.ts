import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePartyPopper } from '@ng-icons/lucide';
import { CardValue } from '../hand/card-value';
import { translateSignal, TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { CardNamePipe } from '../hand/card-name';
import type { RoundResult } from '@flipvote/protocol';

@Component({
  selector: 'flipvote-results-panel',
  imports: [NgIcon, CardValue, TranslocoPipe, TranslocoDecimalPipe, CardNamePipe],
  providers: [provideIcons({ lucidePartyPopper })],
  host: {
    class:
      'bg-background shadow-float flex w-62 flex-col gap-4 rounded-lg p-5 inset-ring inset-ring-border',
    role: 'region',
    '[attr.aria-label]': 'regionLabel()',
  },
  template: `
    @if (results().consensus; as consensus) {
      <div
        class="bg-brand-soft inset-ring-brand-ring text-brand flex items-center gap-2.5 rounded-md px-3 py-2.5 inset-ring"
      >
        <ng-icon name="lucidePartyPopper" size="18px" aria-hidden="true" />
        <div class="flex flex-col">
          <span class="text-sm font-bold">{{ 'room.results.consensus' | transloco }}</span>
          <span class="text-xs text-slate-600 dark:text-slate-300">{{
            'room.results.everyoneVoted' | transloco: { card: consensus | cardName }
          }}</span>
        </div>
      </div>
    }
    <div class="flex items-end justify-between">
      <div class="flex flex-col gap-0.5">
        <span class="text-muted-foreground text-xs font-medium">{{
          'room.results.average' | transloco
        }}</span>
        <!-- Formatted for the active language (5.5 / 5,5), which Angular's static LOCALE_ID can't follow. -->
        <span class="text-4xl font-extrabold tracking-[-0.012em]">
          @let average = results().average;
          @if (average !== null) {
            {{ average | translocoDecimal: { maximumFractionDigits: 1 } }}
          } @else {
            –
          }
        </span>
      </div>
      <span class="text-muted-foreground pb-1.5 text-xs font-medium">
        {{ 'room.results.voteCount' | transloco: { count: results().voteCount } }}
      </span>
    </div>
    <div class="bg-border h-px" aria-hidden="true"></div>
    <ul class="flex flex-col gap-2" [attr.aria-label]="'room.results.distribution' | transloco">
      @for (row of rows(); track row.value) {
        <li
          class="grid grid-cols-[28px_1fr_16px] items-center gap-2.5"
          [attr.aria-label]="
            'room.results.rowLabel' | transloco: { card: row.value | cardName, count: row.count }
          "
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
  readonly results = input.required<RoundResult>();

  protected readonly regionLabel = translateSignal(marker('room.results.label'));

  protected readonly rows = computed(() => {
    const distribution = this.results().distribution;
    const max = Math.max(...distribution.map((row) => row.count));
    return distribution.map((row) => ({
      ...row,
      top: row.count === max,
      width: (row.count / max) * 100,
    }));
  });
}
