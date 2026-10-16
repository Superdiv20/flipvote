import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideEyeOff,
  lucideLayers,
  lucideListChecks,
  lucideUserCheck,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';

const FEATURES = [
  {
    icon: 'lucideUserCheck',
    titleKey: marker('landing.features.items.noSignup.title'),
    textKey: marker('landing.features.items.noSignup.text'),
  },
  {
    icon: 'lucideEyeOff',
    titleKey: marker('landing.features.items.hidden.title'),
    textKey: marker('landing.features.items.hidden.text'),
  },
  {
    icon: 'lucideLayers',
    titleKey: marker('landing.features.items.decks.title'),
    textKey: marker('landing.features.items.decks.text'),
  },
  {
    icon: 'lucideChartColumn',
    titleKey: marker('landing.features.items.results.title'),
    textKey: marker('landing.features.items.results.text'),
  },
  {
    icon: 'lucideUsers',
    titleKey: marker('landing.features.items.roles.title'),
    textKey: marker('landing.features.items.roles.text'),
  },
  {
    icon: 'lucideListChecks',
    titleKey: marker('landing.features.items.issues.title'),
    textKey: marker('landing.features.items.issues.text'),
  },
];

/** What every room comes with, as a grid of small cards. */
@Component({
  selector: 'flipvote-feature-grid',
  imports: [NgIcon, HlmCardImports, TranslocoPipe],
  providers: [
    provideIcons({
      lucideChartColumn,
      lucideEyeOff,
      lucideLayers,
      lucideListChecks,
      lucideUserCheck,
      lucideUsers,
    }),
  ],
  host: {
    id: 'features',
    class: 'block scroll-mt-16 px-6 py-[clamp(56px,7vw,96px)] shadow-[inset_0_1px_0_var(--border)]',
  },
  template: `
    <div class="mx-auto max-w-280">
      <h2 class="text-[clamp(26px,2.4vw,32px)] leading-[1.2] font-semibold tracking-[-0.0075em]">
        {{ 'landing.features.title' | transloco }}
      </h2>
      <p class="text-muted-foreground mt-2 text-base leading-7">
        {{ 'landing.features.lead' | transloco }}
      </p>
      <ul class="mt-10 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
        @for (feature of features; track feature.titleKey) {
          <li hlmCard class="flex-row items-start gap-3.5 rounded-md p-5 shadow-none">
            <span
              class="bg-muted flex size-8 flex-none items-center justify-center rounded-md"
              aria-hidden="true"
            >
              <ng-icon [name]="feature.icon" size="16px" />
            </span>
            <div class="min-w-0">
              <h3 class="text-[15px] leading-6 font-semibold">
                {{ feature.titleKey | transloco }}
              </h3>
              <p class="text-muted-foreground mt-0.5 text-sm leading-5 text-pretty">
                {{ feature.textKey | transloco }}
              </p>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class FeatureGrid {
  protected readonly features = FEATURES;
}
