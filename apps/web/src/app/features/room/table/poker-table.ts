import { Component, computed, input, output } from '@angular/core';
import type { Participant } from '@flipvote/protocol';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideRotateCcw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Seat } from './seat';

// The table is a stadium (a pill) with this width:height ratio. Seats are spread evenly along its edge.
const TABLE_WIDTH = 640;
const TABLE_HEIGHT = 300;

@Component({
  selector: 'flipvote-poker-table',
  imports: [HlmButtonImports, NgIcon, Seat],
  providers: [provideIcons({ lucideEye, lucideRotateCcw })],
  host: { class: 'relative block aspect-[64/30] w-full' },
  template: `
    <div
      class="bg-table shadow-table absolute inset-0 rounded-full inset-ring transition-shadow"
      [class]="consensus() ? 'inset-ring-brand-ring' : 'inset-ring-border'"
    ></div>
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
      @if (flipped()) {
        <button hlmBtn size="lg" class="px-4" (click)="reset.emit()">
          <ng-icon name="lucideRotateCcw" data-icon="inline-start" />
          New round
        </button>
        <span class="text-muted-foreground text-sm" role="status">Cards revealed</span>
      } @else {
        <button hlmBtn size="lg" class="px-4" [disabled]="votedCount() === 0" (click)="flip.emit()">
          <ng-icon name="lucideEye" data-icon="inline-start" />
          Reveal cards
        </button>
        <span class="text-muted-foreground text-sm" role="status">
          {{ votedCount() }} of {{ participants().length }} voted
        </span>
      }
    </div>
    <div role="list" aria-label="Participants">
      @for (seat of seats(); track seat.participant.id) {
        <flipvote-seat
          class="absolute -translate-x-1/2 -translate-y-1/2"
          [style.left.%]="seat.left"
          [style.top.%]="seat.top"
          [name]="seat.participant.name"
          [isSelf]="seat.participant.id === selfId()"
          [hasVoted]="seat.participant.hasVoted"
          [vote]="seat.participant.vote"
          [flipped]="flipped()"
          [consensus]="consensus()"
          [flipDelay]="$index * 60"
        />
      }
    </div>
  `,
})
export class PokerTable {
  readonly participants = input.required<Participant[]>();
  readonly selfId = input.required<string>();
  readonly flipped = input.required<boolean>();
  readonly votedCount = input.required<number>();
  readonly consensus = input(false);

  readonly flip = output();
  readonly reset = output();

  protected readonly seats = computed(() => {
    const participants = this.participants();
    return participants.map((participant, i) => ({
      participant,
      ...this.pointOnTable(i / participants.length),
    }));
  });

  /**
   * Point on the table edge, `t` in [0, 1) going clockwise from the middle of the left side.
   * Returns percentages of the table's width and height.
   */
  private pointOnTable(t: number): { left: number; top: number } {
    const r = TABLE_HEIGHT / 2;
    const straight = TABLE_WIDTH - TABLE_HEIGHT;
    const quarterArc = (Math.PI * r) / 2;
    let d = t * (2 * straight + 2 * Math.PI * r);

    let x: number;
    let y: number;
    if (d < quarterArc) {
      [x, y] = arc(r, r, Math.PI + d / r);
    } else if ((d -= quarterArc) < straight) {
      [x, y] = [r + d, 0];
    } else if ((d -= straight) < 2 * quarterArc) {
      [x, y] = arc(r + straight, r, -Math.PI / 2 + d / r);
    } else if ((d -= 2 * quarterArc) < straight) {
      [x, y] = [r + straight - d, TABLE_HEIGHT];
    } else {
      [x, y] = arc(r, r, Math.PI / 2 + (d - straight) / r);
    }
    return { left: (x / TABLE_WIDTH) * 100, top: (y / TABLE_HEIGHT) * 100 };

    function arc(cx: number, cy: number, angle: number): [number, number] {
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    }
  }
}
