import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { lengthLimit } from '../../shared/length-limit';
import { Router } from '@angular/router';
import { type DeckId, NAME_MAX_LENGTH, ROOM_NAME_MAX_LENGTH } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { SessionService } from '../../core/session';
import { DECK_OPTIONS } from '../../shared/deck-options';
import { Logo } from '../../shared/logo';
import { CreateRoomStore } from './create-room.store';

const NAME_MESSAGE = 'Give the room a name.';

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
            [formField]="createForm.roomName"
            [attr.aria-describedby]="nameInvalid('roomName') ? 'room-name-error' : null"
          />
          @if (nameInvalid('roomName')) {
            <hlm-field-error id="room-name-error" forceShow>{{
              fieldError('roomName')
            }}</hlm-field-error>
          }
        </hlm-field>

        <hlm-field>
          <label hlmFieldLabel for="user-display-name">User name</label>
          <input
            hlmInput
            id="user-display-name"
            type="text"
            autocomplete="off"
            placeholder="Your display name"
            [formField]="createForm.userDisplayName"
            [attr.aria-describedby]="
              nameInvalid('userDisplayName') ? 'user-display-name-error' : null
            "
          />
          @if (nameInvalid('userDisplayName')) {
            <hlm-field-error id="user-display-name-error" forceShow>{{
              fieldError('userDisplayName')
            }}</hlm-field-error>
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

    <p class="text-center text-sm text-muted-foreground">Anyone with the link can join.</p>
  `,
})
export class CreateRoomPage {
  protected readonly store = inject(CreateRoomStore);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly decks = DECK_OPTIONS;

  private readonly _model = signal<{ roomName: string; userDisplayName: string; deck: DeckId }>({
    roomName: '',
    userDisplayName: '',
    deck: 'fibonacci',
  });

  protected readonly createForm = form(
    this._model,
    (schemaPath) => {
      required(schemaPath.roomName, { message: NAME_MESSAGE });
      required(schemaPath.userDisplayName, { message: 'Display name is required.' });
      // `required` accepts a name of only spaces.
      pattern(schemaPath.userDisplayName, /\S/, { message: 'Display name is required.' });
      lengthLimit(
        schemaPath.userDisplayName,
        NAME_MAX_LENGTH,
        `Keep it under ${NAME_MAX_LENGTH + 1} characters.`,
      );
      // `required` accepts a name of only spaces.
      pattern(schemaPath.roomName, /\S/, { message: NAME_MESSAGE });
      lengthLimit(
        schemaPath.roomName,
        ROOM_NAME_MAX_LENGTH,
        `Keep it under ${ROOM_NAME_MAX_LENGTH + 1} characters.`,
      );
    },
    {
      submission: {
        action: async (field) => {
          const { roomName, userDisplayName: displayName, deck } = field().value();
          const roomId = await this.store.createRoom(
            roomName.trim(),
            displayName.trim(),
            deck,
            this.session.token,
          );
          if (roomId) await this.router.navigate(['/r', roomId]);
          return undefined;
        },
      },
    },
  );

  protected nameInvalid(fieldName: 'roomName' | 'userDisplayName'): boolean {
    const field = this.createForm[fieldName]();
    return (field.touched() || field.dirty()) && field.invalid();
  }

  /** The first error of that field, so each field shows its own message. */
  protected fieldError(fieldName: 'roomName' | 'userDisplayName'): string {
    return this.createForm[fieldName]().errors()[0]?.message ?? NAME_MESSAGE;
  }
}
