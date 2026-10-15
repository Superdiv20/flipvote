import { Component, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { ConnectionStatus } from '../../core/socket';
import { Logo } from '../../shared/logo';
import { LogoMark } from '../../shared/logo-mark';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * The moment between sending `join` and the first `state`. If the socket closes in that moment,
 * the server is unreachable, and waiting longer won't help, so it offers to try again.
 */
@Component({
  selector: 'flipvote-room-joining',
  imports: [HlmButtonImports, Logo, LogoMark, TranslocoPipe],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    @if (connection() === 'closed' || connection() === 'reconnecting') {
      <flipvote-logo />
      <div class="flex max-w-sm flex-col items-center gap-4 text-center" role="alert">
        <h1 class="text-lg font-semibold">{{ 'room.joining.unreachable' | transloco }}</h1>
        <p class="text-sm text-muted-foreground">
          @if (connection() === 'reconnecting') {
            {{ 'room.joining.retrying' | transloco }}
          } @else {
            {{ 'room.joining.checkConnection' | transloco }}
          }
        </p>
        <button hlmBtn variant="outline" type="button" (click)="retry.emit()">
          {{ 'common.tryAgain' | transloco }}
        </button>
      </div>
    } @else {
      <flipvote-logo-mark animated class="size-16 text-foreground" />
      <!-- Names the step: first the connection, then the room's first state. -->
      <p class="text-sm text-muted-foreground" role="status">
        {{
          (connection() === 'open' ? 'room.joining.joining' : 'room.joining.connecting') | transloco
        }}
      </p>
    }
  `,
})
export class RoomJoining {
  readonly connection = input.required<ConnectionStatus>();
  readonly retry = output();
}
