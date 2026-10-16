import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucidePlus } from '@ng-icons/lucide';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HeroTable } from './hero-table';

/** Headline, the two calls to action and the demo table. */
@Component({
  selector: 'flipvote-hero',
  imports: [RouterLink, NgIcon, HlmBadgeImports, HlmButtonImports, HeroTable, TranslocoPipe],
  providers: [provideIcons({ lucideCheck, lucidePlus, simpleGithub })],
  host: { class: 'block px-6 pt-[clamp(56px,9vw,128px)] pb-[clamp(64px,8vw,112px)]' },
  template: `
    <div class="mx-auto flex max-w-280 flex-col items-center text-center">
      <h1
        class="max-w-215 text-[clamp(36px,5.4vw,64px)] leading-[1.08] font-extrabold tracking-[-0.022em] text-balance"
      >
        {{ 'landing.hero.title' | transloco }}
      </h1>
      <p
        class="text-muted-foreground mt-5 max-w-155 text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-pretty"
      >
        {{ 'landing.hero.subtitle' | transloco }}
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a
          hlmBtn
          size="lg"
          class="bg-brand text-brand-foreground hover:bg-brand-hover h-11 gap-2 px-5"
          routerLink="/createRoom"
        >
          <ng-icon name="lucidePlus" aria-hidden="true" />
          {{ 'common.createRoom' | transloco }}
        </a>
        <a
          hlmBtn
          variant="outline"
          size="lg"
          class="h-11 gap-2 px-5"
          target="_blank"
          rel="noopener"
          [href]="githubUrl()"
        >
          <ng-icon name="simpleGithub" aria-hidden="true" />
          {{ 'landing.hero.github' | transloco }}
        </a>
      </div>

      <span
        hlmBadge
        class="bg-brand-soft text-brand inset-ring-brand-ring mt-4 h-auto gap-1.5 py-0.5 ps-2 pe-2.5 text-[13px] leading-5 inset-ring [&>ng-icon]:text-[14px]"
      >
        <ng-icon name="lucideCheck" aria-hidden="true" />
        {{ 'landing.hero.badge' | transloco }}
      </span>

      <flipvote-hero-table class="mt-[clamp(48px,6vw,80px)]" />
    </div>
  `,
})
export class Hero {
  readonly githubUrl = input.required<string>();
}
