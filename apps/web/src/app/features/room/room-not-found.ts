import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearchX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { TranslocoPipe } from '@jsverse/transloco';
import { Logo } from '../../shared/logo';

/** Shown instead of the room when the server doesn't know the room id. */
@Component({
  selector: 'flipvote-room-not-found',
  imports: [RouterLink, NgIcon, HlmButtonImports, HlmEmptyImports, Logo, TranslocoPipe],
  providers: [provideIcons({ lucideSearchX })],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <section hlmEmpty class="max-w-md" aria-labelledby="room-not-found-title">
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon name="lucideSearchX" aria-hidden="true" />
        </div>
        <h1 hlmEmptyTitle id="room-not-found-title">{{ 'room.notFound.title' | transloco }}</h1>
        <p hlmEmptyDescription>{{ 'room.notFound.description' | transloco }}</p>
      </div>
      <div hlmEmptyContent>
        <a
          hlmBtn
          routerLink="/createRoom"
          class="bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          {{ 'common.createNewRoom' | transloco }}
        </a>
      </div>
    </section>
  `,
})
export class RoomNotFound {}
