import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { COFFEE_CARD, DECKS, type DeckId, UNSURE_CARD } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { SessionService } from '../../core/session';
import { Logo } from '../../shared/logo';
import { CreateRoomStore } from './create-room.store';

const NAME_MESSAGE = 'Give the room a name.';

/** The estimate cards of each deck, without `?` and coffee, which every deck has. */
const DECK_OPTIONS = Object.values(DECKS).map((deck) => ({
  id: deck.id,
  name: deck.name,
  preview: deck.cards.filter((card) => card !== UNSURE_CARD && card !== COFFEE_CARD),
}));

/** Landing page: name the room, pick a deck, and go straight into the new room. */
@Component({
  selector: 'flipvote-create-room-page',
  imports: [
    FormField,
    FormRoot,
    Logo,
    HlmButtonImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSpinnerImports,
  ],
  host: {
    class:
      'relative isolate flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-background px-4 py-12 text-foreground',
  },
  styles: `
    /* Two soft accent glows. They take the accent token, so they follow light and dark mode. */
    .glow {
      background:
        radial-gradient(
          60rem 32rem at 50% -8rem,
          color-mix(in oklab, var(--brand) 22%, transparent),
          transparent 70%
        ),
        radial-gradient(
          40rem 28rem at 100% 100%,
          color-mix(in oklab, var(--brand) 12%, transparent),
          transparent 70%
        );
    }
  `,
  template: `
    <div class="glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

    <flipvote-logo />

    <section hlmCard class="w-full max-w-md shadow-table" aria-labelledby="create-room-title">
      <div hlmCardHeader>
        <h1 hlmCardTitle id="create-room-title" class="text-xl font-semibold tracking-tight">
          Start a planning session
        </h1>
        <p hlmCardDescription>
          Create a room, share the link, and vote with hidden cards. No account needed.
        </p>
      </div>

      <form hlmCardContent class="flex flex-col gap-6" [formRoot]="createForm">
        <hlm-field>
          <label hlmFieldLabel for="room-name">Room name</label>
          <input
            hlmInput
            id="room-name"
            type="text"
            autocomplete="off"
            placeholder="Sprint 42 planning"
            [formField]="createForm.name"
            [attr.aria-describedby]="nameInvalid() ? 'room-name-error' : null"
          />
          @if (nameInvalid()) {
            <hlm-field-error id="room-name-error" forceShow>{{ nameMessage }}</hlm-field-error>
          }
        </hlm-field>

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
                    class="size-4 accent-brand"
                    [value]="deck.id"
                    [formField]="createForm.deck"
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
        </fieldset>

        <button
          hlmBtn
          type="submit"
          class="w-full bg-brand text-brand-foreground hover:bg-brand-hover"
          [disabled]="store.createRoomLoading()"
        >
          @if (store.createRoomLoading()) {
            <hlm-spinner class="size-4" aria-hidden="true" />
            Creating room…
          } @else {
            Create room
          }
        </button>
      </form>
    </section>

    <p class="text-center text-sm text-muted-foreground">
      Anyone with the link can join.
    </p>
  `,
})
export class CreateRoomPage {
  protected readonly store = inject(CreateRoomStore);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly decks = DECK_OPTIONS;
  protected readonly nameMessage = NAME_MESSAGE;

  private readonly model = signal<{ name: string; deck: DeckId }>({ name: '', deck: 'fibonacci' });

  protected readonly createForm = form(
    this.model,
    (schemaPath) => {
      required(schemaPath.name, { message: NAME_MESSAGE });
      // `required` accepts a name of only spaces.
      pattern(schemaPath.name, /\S/, { message: NAME_MESSAGE });
    },
    {
      submission: {
        action: async (field) => {
          const { name, deck } = field().value();
          const roomId = await this.store.createRoom(name.trim(), DECKS[deck], this.session.token);
          if (roomId) await this.router.navigate(['/room', roomId]);
          return undefined;
        },
      },
    },
  );

  protected nameInvalid(): boolean {
    const name = this.createForm.name();
    return name.touched() && name.invalid();
  }
}
