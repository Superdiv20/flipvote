import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearchX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { Logo } from '../../shared/logo';

/** Shown instead of the room when the server doesn't know the room id. */
@Component({
  selector: 'flipvote-room-not-found',
  imports: [RouterLink, NgIcon, HlmButtonImports, HlmEmptyImports, Logo],
  providers: [provideIcons({ lucideSearchX })],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <section hlmEmpty class="max-w-md" aria-labelledby="room-not-found-title">
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon name="lucideSearchX" aria-hidden="true" />
        </div>
        <h1 hlmEmptyTitle id="room-not-found-title">Room not found</h1>
        <p hlmEmptyDescription>The link may be mistyped, or the room has closed.</p>
      </div>
      <div hlmEmptyContent>
        <a hlmBtn routerLink="/" class="bg-brand text-brand-foreground hover:bg-brand-hover">
          Create a new room
        </a>
      </div>
    </section>
  `,
})
export class RoomNotFound {}
