import { Component, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import type { ConnectionStatus } from '../../core/socket';
import { Logo } from '../../shared/logo';

/**
 * The moment between sending `join` and the first `state`. If the socket closes in that moment,
 * the server is unreachable, and waiting longer won't help, so it offers to try again.
 */
@Component({
  selector: 'flipvote-room-joining',
  imports: [HlmButtonImports, HlmSpinnerImports, Logo],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    @if (connection() === 'closed') {
      <div class="flex max-w-sm flex-col items-center gap-4 text-center" role="alert">
        <h1 class="text-lg font-semibold">Can’t reach the server</h1>
        <p class="text-sm text-muted-foreground">Check your connection and try again.</p>
        <button hlmBtn variant="outline" type="button" (click)="retry.emit()">Try again</button>
      </div>
    } @else {
      <div class="flex items-center gap-3 text-sm text-muted-foreground" role="status">
        <hlm-spinner class="size-4" aria-hidden="true" />
        Joining the room…
      </div>
    }
  `,
})
export class RoomJoining {
  readonly connection = input.required<ConnectionStatus>();
  readonly retry = output();
}
