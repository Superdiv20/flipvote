import { Component, computed, input, output } from '@angular/core';
import type { ErrorCode } from '@flipvote/protocol';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ERROR_PARAMS, errorKey } from '../../shared/error-keys';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Logo } from '../../shared/logo';

/** Wording for the join screen. Other codes fall back to the shared error keys. */
const JOIN_ERRORS: Partial<Record<ErrorCode, string>> = {
  NAME_REQUIRED: marker('room.joinFailed.reasons.NAME_REQUIRED'),
  NAME_TOO_LONG: marker('room.joinFailed.reasons.NAME_TOO_LONG'),
  INVALID_SESSION: marker('room.joinFailed.reasons.INVALID_SESSION'),
  ALREADY_IN_ROOM: marker('room.joinFailed.reasons.ALREADY_IN_ROOM'),
};

/** Shown when the join fails for any reason other than an unknown room. */
@Component({
  selector: 'flipvote-room-join-failed',
  imports: [RouterLink, HlmButtonImports, Logo, TranslocoPipe],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <div class="flex max-w-sm flex-col items-center gap-4 text-center" role="alert">
      <h1 class="text-lg font-semibold">{{ 'room.joinFailed.title' | transloco }}</h1>
      <p class="text-sm text-muted-foreground">{{ reasonKey() | transloco: errorParams }}</p>
      <div class="flex gap-2">
        <button hlmBtn variant="outline" type="button" (click)="retry.emit()">
          {{ 'common.tryAgain' | transloco }}
        </button>
        <a hlmBtn variant="ghost" routerLink="/">{{ 'common.backToStart' | transloco }}</a>
      </div>
    </div>
  `,
})
export class RoomJoinFailed {
  readonly code = input.required<ErrorCode | null>();
  readonly retry = output();

  protected readonly errorParams = ERROR_PARAMS;

  protected readonly reasonKey = computed(() => {
    const code = this.code();
    if (!code) return marker('room.joinFailed.reasons.UNKNOWN');
    return JOIN_ERRORS[code] ?? errorKey(code);
  });
}
