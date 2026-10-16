import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';

const QUESTIONS = [
  {
    questionKey: marker('landing.faq.items.account.question'),
    answerKey: marker('landing.faq.items.account.answer'),
  },
  {
    questionKey: marker('landing.faq.items.free.question'),
    answerKey: marker('landing.faq.items.free.answer'),
  },
  {
    questionKey: marker('landing.faq.items.hiddenVotes.question'),
    answerKey: marker('landing.faq.items.hiddenVotes.answer'),
  },
  {
    questionKey: marker('landing.faq.items.refresh.question'),
    answerKey: marker('landing.faq.items.refresh.answer'),
  },
];

/** Title on the left, the questions as an accordion on the right (stacked on narrow screens). */
@Component({
  selector: 'flipvote-faq',
  imports: [HlmAccordionImports, TranslocoPipe],
  host: { class: 'block px-6 py-[clamp(56px,7vw,96px)] shadow-[inset_0_1px_0_var(--border)]' },
  template: `
    <div class="mx-auto flex max-w-280 flex-wrap gap-x-16 gap-y-6">
      <h2
        class="flex-[1_1_260px] text-[clamp(26px,2.4vw,32px)] leading-[1.2] font-semibold tracking-[-0.0075em] text-balance"
      >
        {{ 'landing.faq.title' | transloco }}
      </h2>
      <hlm-accordion class="-mt-4 min-w-0 flex-[2_1_460px]">
        @for (item of questions; track item.questionKey; let first = $first) {
          <hlm-accordion-item [isOpened]="first">
            <hlm-accordion-trigger triggerClass="text-base">{{
              item.questionKey | transloco
            }}</hlm-accordion-trigger>
            <hlm-accordion-content>
              <p class="text-muted-foreground text-[15px] leading-6">
                {{ item.answerKey | transloco }}
              </p>
            </hlm-accordion-content>
          </hlm-accordion-item>
        }
      </hlm-accordion>
    </div>
  `,
})
export class Faq {
  protected readonly questions = QUESTIONS;
}
