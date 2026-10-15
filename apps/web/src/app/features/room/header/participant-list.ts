import { Component, input } from '@angular/core';
import type { Participant } from '@flipvote/protocol';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { CardValue } from '../hand/card-value';
import { TranslocoPipe } from '@jsverse/transloco';
import { CardNamePipe } from '../hand/card-name';

/** Everyone in the room with their voting status, or their card once revealed. */
@Component({
  selector: 'flipvote-participant-list',
  imports: [NgIcon, HlmAvatarImports, CardValue, TranslocoPipe, CardNamePipe],
  providers: [provideIcons({ lucideCheck })],
  host: { class: 'block' },
  template: `
    <ul
      class="flex max-h-80 flex-col gap-1 overflow-y-auto"
      [attr.aria-label]="'room.participants.title' | transloco"
    >
      @for (participant of participants(); track participant.id) {
        @let isSelf = participant.id === selfId();
        <li class="flex items-center gap-3 rounded-md px-1 py-1.5">
          <hlm-avatar size="sm" aria-hidden="true">
            <span hlmAvatarFallback class="font-medium">{{ initials(participant.name) }}</span>
          </hlm-avatar>
          <span class="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium">
            <span class="truncate">{{ participant.name }}</span>
            @if (isSelf) {
              <span class="text-muted-foreground text-xs">{{
                'room.participants.you' | transloco
              }}</span>
            }
          </span>
          @if (flipped()) {
            @if (participant.vote; as vote) {
              <flipvote-card-value
                class="bg-muted h-7 min-w-7 rounded-md px-1.5 [&_span]:text-sm!"
                [value]="vote"
                iconSize="14px"
                [attr.aria-label]="
                  'room.participants.votedFor' | transloco: { card: vote | cardName }
                "
              />
            } @else {
              <span class="text-muted-foreground text-xs">{{
                'room.participants.noVote' | transloco
              }}</span>
            }
          } @else if (participant.hasVoted) {
            <span class="text-brand flex items-center gap-1 text-xs font-medium">
              <ng-icon name="lucideCheck" size="14px" aria-hidden="true" />
              {{ 'room.participants.voted' | transloco }}
            </span>
          } @else {
            <span class="text-muted-foreground text-xs">{{
              'room.participants.waiting' | transloco
            }}</span>
          }
        </li>
      }
    </ul>
  `,
})
export class ParticipantList {
  readonly participants = input.required<Participant[]>();
  readonly selfId = input.required<string>();
  readonly flipped = input.required<boolean>();

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }
}
