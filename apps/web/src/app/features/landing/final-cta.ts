import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

/** The closing panel: one line and the call to action once more. */
@Component({
  selector: 'flipvote-final-cta',
  imports: [RouterLink, NgIcon, HlmButtonImports, TranslocoPipe],
  providers: [provideIcons({ lucidePlus })],
  host: { class: 'block px-6 pb-[clamp(64px,8vw,112px)]' },
  template: `
    <div
      class="bg-table inset-ring-border mx-auto flex max-w-280 flex-col items-center gap-7 rounded-lg px-6 py-[clamp(48px,7vw,88px)] text-center inset-ring"
    >
      <h2
        class="max-w-160 text-[clamp(24px,2.6vw,34px)] leading-[1.25] font-semibold tracking-[-0.0075em] text-balance"
      >
        {{ 'landing.finalCta.title' | transloco }}
      </h2>
      <a
        hlmBtn
        size="lg"
        class="bg-brand text-brand-foreground hover:bg-brand-hover h-11 gap-2 px-5"
        routerLink="/createRoom"
      >
        <ng-icon name="lucidePlus" aria-hidden="true" />
        {{ 'common.createRoom' | transloco }}
      </a>
    </div>
  `,
})
export class FinalCta {}
