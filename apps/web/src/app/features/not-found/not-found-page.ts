import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCompass } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { Logo } from '../../shared/logo';

/** For any address the app doesn't know. An unknown room has its own screen inside the room page. */
@Component({
  selector: 'flipvote-not-found-page',
  imports: [RouterLink, NgIcon, HlmButtonImports, HlmEmptyImports, Logo],
  providers: [provideIcons({ lucideCompass })],
  host: {
    class:
      'flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-12 text-foreground',
  },
  template: `
    <flipvote-logo />
    <section hlmEmpty class="max-w-md" aria-labelledby="not-found-title">
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon name="lucideCompass" aria-hidden="true" />
        </div>
        <h1 hlmEmptyTitle id="not-found-title">Page not found</h1>
        <p hlmEmptyDescription>
          There's nothing at this address. To join a room, open the link you were sent.
        </p>
      </div>
      <div hlmEmptyContent>
        <a hlmBtn routerLink="/" class="bg-brand text-brand-foreground hover:bg-brand-hover">
          Create a new room
        </a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
