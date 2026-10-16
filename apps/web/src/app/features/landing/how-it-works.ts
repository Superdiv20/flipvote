import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideLink, lucidePlus } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';

const STEPS = [
  {
    icon: 'lucidePlus',
    titleKey: marker('landing.howItWorks.steps.create.title'),
    textKey: marker('landing.howItWorks.steps.create.text'),
  },
  {
    icon: 'lucideLink',
    titleKey: marker('landing.howItWorks.steps.share.title'),
    textKey: marker('landing.howItWorks.steps.share.text'),
  },
  {
    icon: 'lucideEye',
    titleKey: marker('landing.howItWorks.steps.flip.title'),
    textKey: marker('landing.howItWorks.steps.flip.text'),
  },
];

/** The three steps from room to result, as numbered cards. */
@Component({
  selector: 'flipvote-how-it-works',
  imports: [NgIcon, HlmCardImports, TranslocoPipe],
  providers: [provideIcons({ lucideEye, lucideLink, lucidePlus })],
  host: {
    id: 'how',
    class: 'block scroll-mt-16 px-6 py-[clamp(56px,7vw,96px)] shadow-[inset_0_1px_0_var(--border)]',
  },
  template: `
    <div class="mx-auto max-w-280">
      <h2 class="text-[clamp(26px,2.4vw,32px)] leading-[1.2] font-semibold tracking-[-0.0075em]">
        {{ 'landing.howItWorks.title' | transloco }}
      </h2>
      <p class="text-muted-foreground mt-2 text-base leading-7">
        {{ 'landing.howItWorks.lead' | transloco }}
      </p>
      <ol class="mt-10 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
        @for (step of steps; track step.titleKey; let i = $index) {
          <li hlmCard class="gap-4 rounded-md p-6 shadow-none">
            <div class="flex items-center justify-between">
              <span
                class="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-md"
                aria-hidden="true"
              >
                <ng-icon [name]="step.icon" size="20px" />
              </span>
              <span
                class="text-muted-foreground/70 text-sm font-semibold tabular-nums"
                aria-hidden="true"
                >0{{ i + 1 }}</span
              >
            </div>
            <div>
              <h3 class="text-lg leading-7 font-semibold tracking-[-0.005em]">
                {{ step.titleKey | transloco }}
              </h3>
              <p class="text-muted-foreground mt-1 text-[15px] leading-6 text-pretty">
                {{ step.textKey | transloco }}
              </p>
            </div>
          </li>
        }
      </ol>
    </div>
  `,
})
export class HowItWorks {
  protected readonly steps = STEPS;
}
