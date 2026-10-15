import { booleanAttribute, Component, input } from '@angular/core';

/**
 * The mark alone: a sprint loop around a tilted estimate card. The loop follows the text colour,
 * the card takes the accent. Size it from outside (`class="size-6"`).
 *
 * `animated` turns it into the loading animation: the loop draws itself up to its arrowhead while
 * the card flips over once, then the loop fades and the next pass begins.
 */
@Component({
  selector: 'flipvote-logo-mark',
  host: { class: 'inline-block shrink-0', '[class.animated]': 'animated()' },
  styles: `
    .card {
      fill: var(--brand);
      transform-box: fill-box;
      transform-origin: center;
    }

    /* One pass: the loop draws (0–65%) while the card flips, both pause, then the loop fades. */
    :host(.animated) .loop {
      stroke-dasharray: 100;
      animation: draw 1.8s ease-in-out infinite;
    }
    :host(.animated) .arrow {
      animation: arrow 1.8s ease-in-out infinite;
    }
    :host(.animated) .card {
      animation: flip 1.8s ease-in-out infinite;
    }

    @keyframes draw {
      0% {
        stroke-dashoffset: 100;
        opacity: 1;
      }
      65%,
      85% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    /* The arrowhead belongs to the end of the line, so it shows once the line arrives. */
    @keyframes arrow {
      0%,
      60% {
        opacity: 0;
      }
      65%,
      85% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    /* A full turn, narrowing to its edge and back, with the paler back showing in between. */
    @keyframes flip {
      0% {
        transform: scaleX(1);
        fill-opacity: 1;
      }
      16% {
        transform: scaleX(0);
        fill-opacity: 1;
      }
      16.5% {
        fill-opacity: 0.45;
      }
      32.5% {
        transform: scaleX(-1);
        fill-opacity: 0.45;
      }
      48.5% {
        transform: scaleX(0);
        fill-opacity: 0.45;
      }
      49% {
        fill-opacity: 1;
      }
      65%,
      100% {
        transform: scaleX(1);
        fill-opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host(.animated) .loop,
      :host(.animated) .arrow,
      :host(.animated) .card {
        animation: none;
      }
    }
  `,
  template: `
    <svg class="size-full" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        class="loop"
        d="M21.07 5.57A11 11 0 1 1 6.93 5.57"
        pathLength="100"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
      />
      <path
        class="arrow"
        d="M3.43 5.57L6.93 5.57L6.32 9.02"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- The tilt sits on the group, so the flip's transform on the card doesn't replace it. -->
      <g transform="rotate(10 14 14)">
        <rect class="card" x="10" y="8.5" width="8" height="11" rx="2" />
      </g>
    </svg>
  `,
})
export class LogoMark {
  /** A bare `animated` attribute is enough. */
  readonly animated = input(false, { transform: booleanAttribute });
}
