import { Component, computed, inject, linkedSignal, signal, untracked } from '@angular/core';
import { AccountService } from '../../core/account';
import { ThemeService } from '../../core/theme';
import { CardHand } from './hand/card-hand';
import { IssueDrawer } from './issues/issue-drawer';
import { PokerTable } from './table/poker-table';
import type { VoteResults } from './results/results';
import { ResultsPanel } from './results/results-panel';
import { RoomHeader } from './header/room-header';
import { RoomStore } from './+store/room-store';

@Component({
  selector: 'flipvote-room-page',
  imports: [RoomHeader, IssueDrawer, PokerTable, ResultsPanel, CardHand],
  host: { class: 'flex h-dvh flex-col bg-background text-foreground' },
  template: `
    <flipvote-room-header
      [roomName]="store.roomName()"
      [topic]="store.topic()"
      [participants]="store.participants()"
      [selfId]="store.selfId"
      [flipped]="store.flipped()"
      [votedCount]="store.votedCount()"
      [theme]="theme.theme()"
      [account]="account.account()"
      [guestName]="selfName()"
      (toggleTheme)="theme.toggle()"
      (signIn)="account.signIn()"
      (signOut)="account.signOut()"
    />
    <div class="flex min-h-0 flex-1">
      <flipvote-issue-drawer
        [issues]="store.issues()"
        [currentId]="store.currentIssueId()"
        [collapsed]="drawerCollapsed()"
        (toggle)="toggleDrawer()"
        (select)="store.selectIssue($event)"
        (add)="store.addIssue($event)"
        (create)="store.createIssue($event)"
        (update)="store.updateIssue($event.id, $event.details)"
      />
      <main class="flex min-w-0 flex-1 flex-col">
        <!-- The results slide in right beside the table while the drawer closes on the left, so the table keeps its size. -->
        <div
          class="flex flex-1 flex-col items-center justify-center gap-16 px-16 py-16 max-sm:px-10 md:flex-row"
        >
          <flipvote-poker-table
            class="max-w-150"
            [participants]="store.participants()"
            [selfId]="store.selfId"
            [flipped]="store.flipped()"
            [votedCount]="store.votedCount()"
            [consensus]="!!results()?.consensus"
            (flip)="store.flip()"
            (reset)="store.reset()"
          />
          @if (results(); as results) {
            <flipvote-results-panel class="md:hidden" [results]="results" />
          }
          <div
            class="shrink-0 overflow-hidden transition-[width] duration-220 ease-[cubic-bezier(0.2,0,0,1)] max-md:hidden motion-reduce:transition-none"
            [class]="results() ? 'w-76' : 'w-0'"
            [inert]="!results()"
          >
            @if (shownResults(); as shownResults) {
              <div
                class="w-76 py-2 pr-2 pl-12 transition-[opacity,translate] duration-220 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
                [class]="results() ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'"
              >
                <flipvote-results-panel [results]="shownResults" />
              </div>
            }
          </div>
        </div>
        <flipvote-card-hand
          class="px-4 pb-8"
          [deck]="store.deck"
          [selectedValue]="store.myVote()"
          [locked]="store.flipped()"
          (pick)="store.vote($event)"
        />
      </main>
    </div>
  `,
})
export class RoomPage {
  protected readonly store = inject(RoomStore);
  protected readonly theme = inject(ThemeService);
  protected readonly account = inject(AccountService);

  protected readonly selfName = computed(
    () => this.store.participants().find((p) => p.id === this.store.selfId)?.name ?? 'Guest',
  );

  protected readonly results = computed(() => {
    const results = this.store.results();
    return results && results.count > 0 ? results : null;
  });

  /** Keeps the last results rendered while the panel fades out after a new round starts. */
  protected readonly shownResults = linkedSignal<VoteResults | null, VoteResults | null>({
    source: this.results,
    computation: (results, previous) => results ?? previous?.value ?? null,
  });

  /** What the user last chose by hand. Starts collapsed, so the table has the room until someone opens the issues. */
  private readonly collapsedByUser = signal(true);

  /** Collapses to the rail when the cards flip, and returns to the user's choice on the next round. */
  protected readonly drawerCollapsed = linkedSignal({
    source: this.store.flipped,
    computation: (flipped) => flipped || untracked(this.collapsedByUser),
  });

  protected toggleDrawer(): void {
    const collapsed = !this.drawerCollapsed();
    this.drawerCollapsed.set(collapsed);
    this.collapsedByUser.set(collapsed);
  }
}
