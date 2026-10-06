import {
  Component,
  computed,
  DOCUMENT,
  inject,
  input,
  linkedSignal,
  type OnInit,
  signal,
  untracked,
} from '@angular/core';
import { AccountService } from '../../core/account';
import { SessionService } from '../../core/session';
import { ThemeService } from '../../core/theme';
import { CardHand } from './hand/card-hand';
import { IssueDrawer } from './issues/issue-drawer';
import { PokerTable } from './table/poker-table';
import type { RoundResult } from '@flipvote/protocol';
import { ResultsPanel } from './results/results-panel';
import { RoomHeader } from './header/room-header';
import { RoomStore } from './+store/room-store';
import { JoinRoom } from './join-room';
import { RoomJoinFailed } from './room-join-failed';
import { RoomJoining } from './room-joining';
import { RoomNotFound } from './room-not-found';

@Component({
  selector: 'flipvote-room-page',
  // Here and not on the route: a component's providers are destroyed with it, so every room visit
  // gets a fresh store, and leaving the room closes its socket.
  providers: [RoomStore],
  imports: [
    RoomHeader,
    IssueDrawer,
    PokerTable,
    ResultsPanel,
    CardHand,
    RoomNotFound,
    JoinRoom,
    RoomJoining,
    RoomJoinFailed,
  ],
  host: { class: 'flex h-dvh flex-col bg-background text-foreground' },
  template: `
    @switch (roomStore.view()) {
      @case ('notFound') {
        <flipvote-room-not-found />
      }
      @case ('joinFailed') {
        <flipvote-room-join-failed [code]="roomStore.joinError()" (retry)="reload()" />
      }
      @case ('name') {
        <flipvote-join-room (join)="roomStore.join(roomId(), $event)" />
      }
      @case ('joining') {
        <flipvote-room-joining [connection]="roomStore.connection()" (retry)="reload()" />
      }
      @default {
        <flipvote-room-header
          [roomName]="roomStore.roomName()"
          [topic]="roomStore.topic()"
          [participants]="roomStore.participants()"
          [selfId]="roomStore.selfId()"
          [flipped]="roomStore.flipped()"
          [votedCount]="roomStore.votedCount()"
          [connection]="roomStore.connection()"
          [deckId]="roomStore.deckId()"
          [facilitatorId]="roomStore.facilitatorId()"
          (setDeck)="roomStore.setDeck($event)"
          (transferFacilitator)="roomStore.transferFacilitator($event)"
          (setSpectator)="roomStore.setSpectator($event)"
          [theme]="theme.theme()"
          [themePreference]="theme.preference()"
          (themePreferenceChange)="theme.setPreference($event)"
          [account]="account.account()"
          [guestName]="guestName()"
          (toggleTheme)="theme.toggle()"
          (signIn)="account.signIn()"
          (signOut)="account.signOut()"
        />
        <div class="flex min-h-0 flex-1">
          <flipvote-issue-drawer
            [issues]="roomStore.issues()"
            [currentId]="roomStore.currentIssueId()"
            [collapsed]="drawerCollapsed()"
            (toggle)="toggleDrawer()"
            (select)="roomStore.selectIssue($event)"
            (add)="roomStore.addIssue($event)"
            (create)="roomStore.createIssue($event)"
            (update)="roomStore.updateIssue($event.id, $event.details)"
          />
          <main class="flex min-w-0 flex-1 flex-col">
            <!-- The results slide in right beside the table while the drawer closes on the left, so the table keeps its size. -->
            <div
              class="flex flex-1 flex-col items-center justify-center gap-16 px-16 py-16 max-sm:px-10 md:flex-row"
            >
              <flipvote-poker-table
                class="max-w-150"
                [participants]="roomStore.participants()"
                [selfId]="roomStore.selfId()"
                [flipped]="roomStore.flipped()"
                [votedCount]="roomStore.votedCount()"
                [consensus]="!!results()?.consensus"
                (flip)="roomStore.flip()"
                (reset)="roomStore.reset()"
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
              [deck]="roomStore.deck()"
              [selectedValue]="roomStore.myVote()"
              [locked]="roomStore.flipped() || roomStore.isSpectator()"
              (pick)="roomStore.vote($event)"
            />
          </main>
        </div>
      }
    }
  `,
})
export class RoomPage implements OnInit {
  /** From the route `r/:roomId`. */
  readonly roomId = input.required<string>();

  protected readonly roomStore = inject(RoomStore);
  protected readonly theme = inject(ThemeService);
  protected readonly account = inject(AccountService);
  private readonly session = inject(SessionService);
  private readonly document = inject(DOCUMENT);

  /** Without an account, the menu shows the name saved in the session. */
  protected readonly guestName = computed(() => this.session.name() ?? 'Guest');

  protected readonly results = computed(() => {
    const results = this.roomStore.results();
    return results && results.voteCount > 0 ? results : null;
  });

  /** Keeps the last results rendered while the panel fades out after a new round starts. */
  protected readonly shownResults = linkedSignal<RoundResult | null, RoundResult | null>({
    source: this.results,
    computation: (results, previous) => results ?? previous?.value ?? null,
  });

  /** What the user last chose by hand. Starts collapsed, so the table has the room until someone opens the issues. */
  private readonly collapsedByUser = signal(true);

  /** Collapses to the rail when the cards flip, and returns to the user's choice on the next round. */
  protected readonly drawerCollapsed = linkedSignal({
    source: this.roomStore.flipped,
    computation: (flipped) => flipped || untracked(this.collapsedByUser),
  });

  // Not the constructor: route inputs are only set once the component is initialised.
  ngOnInit(): void {
    this.roomStore.enter(this.roomId());
  }

  /** There is no reconnect yet, so trying again means loading the page anew. */
  protected reload(): void {
    this.document.location.reload();
  }

  protected toggleDrawer(): void {
    const collapsed = !this.drawerCollapsed();
    this.drawerCollapsed.set(collapsed);
    this.collapsedByUser.set(collapsed);
  }
}
