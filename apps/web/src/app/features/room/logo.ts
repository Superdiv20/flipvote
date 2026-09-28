import { Component } from '@angular/core';

/** Sprint loop around a tilted estimate card. The ring follows the text colour, the card takes the accent. */
@Component({
  selector: 'flipvote-logo',
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <svg class="size-6 shrink-0" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M21.07 5.57A11 11 0 1 1 6.93 5.57"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
      />
      <path
        d="M3.43 5.57L6.93 5.57L6.32 9.02"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect
        x="10"
        y="8.5"
        width="8"
        height="11"
        rx="2"
        transform="rotate(10 14 14)"
        fill="var(--brand)"
      />
    </svg>
    <span class="text-lg font-extrabold tracking-[-0.012em]">Flipvote</span>
  `,
})
export class Logo {}
