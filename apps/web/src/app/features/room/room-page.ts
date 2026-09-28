import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ThemeService } from '../../core/theme';
import { CardHand } from './card-hand';
import { PokerTable } from './poker-table';
import type { VoteResults } from './results';
import { ResultsPanel } from './results-panel';
import { RoomHeader } from './room-header';
import { RoomStore } from './+store/room-store';

@Component({
  selector: 'flipvote-room-page',
  imports: [RoomHeader, PokerTable, ResultsPanel, CardHand],
  host: { class: 'flex min-h-dvh flex-col bg-background text-foreground' },
  template: `
    <flipvote-room-header
      [roomName]="store.roomName()"
      [topic]="store.topic()"
      [participants]="store.participants()"
      [selfId]="store.selfId"
      [flipped]="store.flipped()"
      [votedCount]="store.votedCount()"
      [theme]="theme.theme()"
      (toggleTheme)="theme.toggle()"
    />
    <main class="flex flex-1 flex-col">
      <!-- Side by side from 70rem, stacked below. The results slot is always there so the table can glide aside when it opens. -->
      <div
        class="flex flex-1 flex-col items-center justify-center gap-16 overflow-x-clip px-16 py-24 max-sm:px-10 min-[70rem]:flex-row min-[70rem]:gap-0"
      >
        <flipvote-poker-table
          class="transition-[max-width] duration-500 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          [class]="results() ? 'max-w-150' : 'max-w-160'"
          [participants]="store.participants()"
          [selfId]="store.selfId"
          [flipped]="store.flipped()"
          [votedCount]="store.votedCount()"
          [consensus]="!!results()?.consensus"
          (flip)="store.flip()"
          (reset)="store.reset()"
        />
        <div
          class="w-62 shrink-0 transition-[width,margin] duration-500 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          [class]="results() ? 'min-[70rem]:ml-22' : 'max-[70rem]:hidden min-[70rem]:w-0'"
          [inert]="!results()"
        >
          @if (shownResults(); as shownResults) {
            <flipvote-results-panel
              class="transition-opacity motion-reduce:transition-none"
              [class]="results() ? 'opacity-100 delay-200 duration-300' : 'opacity-0 duration-150'"
              [results]="shownResults"
            />
          }
        </div>
      </div>
      <flipvote-card-hand
        class="px-4 pb-10"
        [deck]="store.deck"
        [selectedValue]="store.myVote()"
        [locked]="store.flipped()"
        (pick)="store.vote($event)"
      />
    </main>
  `,
})
export class RoomPage {
  protected readonly store = inject(RoomStore);
  protected readonly theme = inject(ThemeService);

  protected readonly results = computed(() => {
    const results = this.store.results();
    return results && results.count > 0 ? results : null;
  });

  /** Keeps the last results rendered while the panel fades out after a new round starts. */
  protected readonly shownResults = linkedSignal<VoteResults | null, VoteResults | null>({
    source: this.results,
    computation: (results, previous) => results ?? previous?.value ?? null,
  });
}
