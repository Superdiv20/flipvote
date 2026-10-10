import { Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCrown, lucideSlidersHorizontal, lucideTriangleAlert } from '@ng-icons/lucide';
import type { DeckId, Participant } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { DECK_OPTIONS } from '../../../shared/deck-options';

/**
 * The facilitator's settings for the whole room, in a sheet from the right, so the table stays in
 * view. Changes apply to everyone: the deck, and who facilitates.
 */
@Component({
  selector: 'flipvote-room-settings',
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmFieldImports,
    HlmSheetImports,
    HlmSwitchImports,
    HlmTooltipImports,
  ],
  providers: [provideIcons({ lucideCrown, lucideSlidersHorizontal, lucideTriangleAlert })],
  template: `
    <hlm-sheet side="right">
      <button
        hlmSheetTrigger
        hlmBtn
        variant="ghost"
        size="icon"
        aria-label="Room settings"
        hlmTooltip="Room settings"
        position="bottom"
      >
        <ng-icon name="lucideSlidersHorizontal" />
      </button>

      <hlm-sheet-content *hlmSheetPortal class="gap-0 overflow-y-auto">
        <hlm-sheet-header>
          <h2 hlmSheetTitle>Room settings</h2>
          <p hlmSheetDescription>Changes apply to everyone in the room.</p>
        </hlm-sheet-header>

        <div class="flex flex-col gap-8 p-4">
          <fieldset hlmFieldSet>
            <legend hlmFieldLegend variant="label">Deck</legend>
            <div class="grid gap-2">
              @for (deck of decks; track deck.id) {
                <label
                  class="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/60 has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:ring-3 has-focus-visible:ring-brand-ring"
                >
                  <span class="flex items-center gap-3">
                    <input
                      type="radio"
                      name="room-deck"
                      class="size-4 accent-brand"
                      [value]="deck.id"
                      [checked]="deck.id === shownDeckId()"
                      (change)="pickDeck(deck.id)"
                    />
                    <span class="text-sm font-medium">{{ deck.name }}</span>
                  </span>
                  <span class="flex flex-wrap gap-1 pl-7" aria-hidden="true">
                    @for (card of deck.preview; track card) {
                      <span
                        class="min-w-7 rounded-md border border-border bg-background px-1.5 py-0.5 text-center text-xs text-muted-foreground tabular-nums"
                        >{{ card }}</span
                      >
                    }
                  </span>
                </label>
              }
            </div>

            @if (pendingDeckId()) {
              <div
                class="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3"
                role="alert"
              >
                <p class="flex gap-2 text-sm">
                  <ng-icon name="lucideTriangleAlert" class="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{{ switchWarning() }}</span>
                </p>
                <div class="flex justify-end gap-2">
                  <button hlmBtn variant="ghost" size="sm" type="button" (click)="keepDeck()">
                    Keep current deck
                  </button>
                  <button hlmBtn size="sm" type="button" (click)="confirmDeck()">
                    Switch deck
                  </button>
                </div>
              </div>
            }
          </fieldset>

          <div class="flex items-start justify-between gap-4">
            <label for="auto-flip" class="flex flex-col gap-1">
              <span class="text-sm font-medium">Flip automatically</span>
              <span class="text-sm text-muted-foreground">
                Once everyone has voted, a short countdown starts and the cards flip by themselves.
                Votes are locked during the countdown.
              </span>
            </label>
            <hlm-switch
              inputId="auto-flip"
              [checked]="autoFlip()"
              (checkedChange)="setAutoFlip.emit($event)"
            />
          </div>

          <div class="flex items-start justify-between gap-4">
            <label for="only-facilitator-can-flip" class="flex flex-col gap-1">
              <span class="text-sm font-medium">Only facilitator can flip</span>
              <span class="text-sm text-muted-foreground">
                When enabled, only the facilitator can flip the cards manually.
              </span>
            </label>
            <hlm-switch
              inputId="only-facilitator-can-flip"
              [checked]="onlyFacilitatorCanFlip()"
              (checkedChange)="setOnlyFacilitatorCanFlip.emit($event)"
            />
          </div>

          <section class="flex flex-col gap-3" aria-labelledby="facilitator-heading">
            <div class="flex flex-col gap-1">
              <h3 id="facilitator-heading" class="text-sm font-medium">Facilitator</h3>
              <p class="text-sm text-muted-foreground">
                Hand the role to someone else. You keep your seat and your vote.
              </p>
            </div>
            @if (others().length === 0) {
              <p class="text-sm text-muted-foreground">Nobody else is in the room yet.</p>
            } @else {
              <ul class="flex flex-col gap-1">
                @for (participant of others(); track participant.id) {
                  <li class="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
                    <span class="min-w-0 truncate text-sm">
                      {{ participant.name }}
                      @if (!participant.connected) {
                        <span class="text-muted-foreground"> · away</span>
                      }
                    </span>
                    <!-- Closes the sheet: the role, and with it these settings, moves to someone else. -->
                    <button
                      hlmBtn
                      hlmSheetClose
                      variant="outline"
                      size="sm"
                      type="button"
                      [disabled]="!participant.connected"
                      [attr.aria-label]="'Make ' + participant.name + ' facilitator'"
                      (click)="transferFacilitator.emit(participant.id)"
                    >
                      <ng-icon name="lucideCrown" aria-hidden="true" />
                      Make facilitator
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      </hlm-sheet-content>
    </hlm-sheet>
  `,
})
export class RoomSettings {
  readonly deckId = input.required<DeckId | null>();
  readonly participants = input.required<Participant[]>();
  readonly selfId = input.required<string>();
  /** Votes cast this round. A deck switch starts a new round and clears them. */
  readonly votedCount = input.required<number>();
  readonly flipped = input.required<boolean>();
  readonly autoFlip = input.required<boolean>();
  readonly onlyFacilitatorCanFlip = input.required<boolean>();

  readonly setDeck = output<DeckId>();
  readonly transferFacilitator = output<string>();
  readonly setAutoFlip = output<boolean>();
  readonly setOnlyFacilitatorCanFlip = output<boolean>();

  protected readonly decks = DECK_OPTIONS;

  /** A deck picked while the round is under way, waiting for the facilitator to confirm. */
  protected readonly pendingDeckId = signal<DeckId | null>(null);
  protected readonly shownDeckId = computed(() => this.pendingDeckId() ?? this.deckId());

  protected readonly others = computed(() =>
    this.participants().filter((participant) => participant.id !== this.selfId()),
  );

  protected readonly switchWarning = computed(() => {
    if (this.flipped()) return 'Switching the deck ends this round and clears its result.';
    const votes = this.votedCount();
    return `Switching the deck starts a new round and clears ${votes} ${votes === 1 ? 'vote' : 'votes'}.`;
  });

  protected pickDeck(deckId: DeckId): void {
    if (deckId === this.deckId()) {
      this.pendingDeckId.set(null);
      return;
    }
    // Nothing to lose yet: switch right away.
    if (this.votedCount() === 0 && !this.flipped()) {
      this.setDeck.emit(deckId);
      return;
    }
    this.pendingDeckId.set(deckId);
  }

  protected confirmDeck(): void {
    const deckId = this.pendingDeckId();
    if (deckId) this.setDeck.emit(deckId);
    this.pendingDeckId.set(null);
  }

  protected keepDeck(): void {
    this.pendingDeckId.set(null);
  }
}
