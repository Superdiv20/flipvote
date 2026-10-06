import { Component, computed, input, output } from '@angular/core';
import type { ErrorCode } from '@flipvote/protocol';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ERROR_MESSAGES } from '../../shared/error-messages';
import { Logo } from '../../shared/logo';

/** Wording for the join screen. Other codes fall back to the shared `ERROR_MESSAGES`. */
const JOIN_ERRORS: Partial<Record<ErrorCode, string>> = {
  NAME_REQUIRED: 'The room needs a name to show at the table.',
  NAME_TOO_LONG: 'That name is too long. Pick a shorter one.',
  INVALID_SESSION: 'Your session doesn’t match your seat in this room.',
  ALREADY_IN_ROOM: 'This tab is already connected to another room.',
};

/** Shown when the join fails for any reason other than an unknown room. */
@Component({
  selector: 'flipvote-room-join-failed',
  imports: [RouterLink, HlmButtonImports, Logo],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <div class="flex max-w-sm flex-col items-center gap-4 text-center" role="alert">
      <h1 class="text-lg font-semibold">Couldn’t join the room</h1>
      <p class="text-sm text-muted-foreground">{{ reason() }}</p>
      <div class="flex gap-2">
        <button hlmBtn variant="outline" type="button" (click)="retry.emit()">Try again</button>
        <a hlmBtn variant="ghost" routerLink="/">Back to start</a>
      </div>
    </div>
  `,
})
export class RoomJoinFailed {
  readonly code = input.required<ErrorCode | null>();
  readonly retry = output();

  protected readonly reason = computed(() => {
    const code = this.code();
    if (!code) return 'Something went wrong while joining. Please try again.';
    return JOIN_ERRORS[code] ?? ERROR_MESSAGES[code];
  });
}
