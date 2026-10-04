import { Component, computed, DOCUMENT, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers } from '@ng-icons/lucide';
import type { Participant } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import type { Account } from '../../../core/account';
import type { ConnectionStatus } from '../../../core/socket';
import type { Theme } from '../../../core/theme';
import { AccountMenu } from './account-menu';
import { Logo } from '../../../shared/logo';
import { ParticipantList } from './participant-list';

@Component({
  selector: 'flipvote-room-header',
  imports: [HlmButtonImports, HlmPopoverImports, NgIcon, Logo, ParticipantList, AccountMenu],
  providers: [provideIcons({ lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers })],
  host: {
    class: 'flex h-16 shrink-0 items-center gap-4 px-6 shadow-[inset_0_-1px_0_var(--border)]',
  },
  template: `
    <flipvote-logo />
    <div class="bg-border h-5 w-px max-sm:hidden" aria-hidden="true"></div>
    <div class="flex min-w-0 flex-1 flex-col max-sm:hidden">
      <span class="text-muted-foreground truncate text-xs font-medium">{{ roomName() }}</span>
      <h1 class="truncate text-sm font-semibold">{{ topic() ?? 'No issue selected' }}</h1>
    </div>
    <hlm-popover class="max-sm:ml-auto" align="end" sideOffset="8">
      <button
        hlmPopoverTrigger
        hlmBtn
        variant="secondary"
        class="gap-1.5 px-2.5"
        [attr.aria-label]="
          participants().length +
          ' participants, ' +
          connectionLabel().toLowerCase() +
          ', show list'
        "
      >
        <!-- Live indicator: steady when connected, pulsing while connecting, grey when the connection is gone. -->
        <span class="relative flex size-2" aria-hidden="true">
          @if (connection() === 'connecting') {
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75 motion-reduce:animate-none"
            ></span>
          }
          <span
            class="relative inline-flex size-2 rounded-full"
            [class]="connectionDotClass()"
          ></span>
        </span>
        <ng-icon name="lucideUsers" aria-hidden="true" />
        <span aria-hidden="true">{{ participants().length }}</span>
      </button>
      <hlm-popover-content *hlmPopoverPortal class="w-72 gap-3 p-3">
        <hlm-popover-header class="px-1">
          <h2 hlmPopoverTitle>Participants</h2>
          <p hlmPopoverDescription class="text-xs">
            {{ connectionLabel() }} ·
            {{
              flipped()
                ? 'Cards revealed'
                : votedCount() + ' of ' + participants().length + ' voted'
            }}
          </p>
        </hlm-popover-header>
        <flipvote-participant-list
          [participants]="participants()"
          [selfId]="selfId()"
          [flipped]="flipped()"
        />
      </hlm-popover-content>
    </hlm-popover>
    <!-- Announces a dropped connection once; the dot alone would only be visible. -->
    <span class="sr-only" aria-live="polite">
      {{ connection() === 'closed' ? 'Connection to the room lost' : '' }}
    </span>
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      [attr.aria-label]="theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="toggleTheme.emit()"
    >
      <ng-icon [name]="theme() === 'dark' ? 'lucideSun' : 'lucideMoon'" />
    </button>
    <button hlmBtn variant="outline" size="lg" class="px-4" (click)="copyInvite()">
      <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideLink'" data-icon="inline-start" />
      <span aria-live="polite">{{ copied() ? 'Link copied' : 'Invite' }}</span>
    </button>
    <div class="bg-border h-5 w-px" aria-hidden="true"></div>
    <flipvote-account-menu
      [account]="account()"
      [guestName]="guestName()"
      (openSettings)="openSettings.emit()"
      (signIn)="signIn.emit()"
      (signOut)="signOut.emit()"
    />
  `,
})
export class RoomHeader {
  private readonly document = inject(DOCUMENT);

  readonly roomName = input.required<string>();
  readonly topic = input.required<string | null>();
  readonly participants = input.required<Participant[]>();
  readonly selfId = input.required<string>();
  readonly flipped = input.required<boolean>();
  readonly votedCount = input.required<number>();
  readonly connection = input.required<ConnectionStatus>();
  readonly theme = input.required<Theme>();
  readonly account = input.required<Account | null>();
  readonly guestName = input.required<string>();
  readonly toggleTheme = output();
  readonly openSettings = output();
  readonly signIn = output();
  readonly signOut = output();

  protected readonly connectionLabel = computed(() => CONNECTION_LABELS[this.connection()]);
  protected readonly connectionDotClass = computed(() => CONNECTION_DOTS[this.connection()]);

  protected readonly copied = signal(false);
  private resetCopied?: ReturnType<typeof setTimeout>;

  protected async copyInvite(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.document.location.href);
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.resetCopied);
    this.resetCopied = setTimeout(() => this.copied.set(false), 2000);
  }
}

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  open: 'Connected',
  connecting: 'Connecting…',
  idle: 'Disconnected',
  closed: 'Disconnected',
};

const CONNECTION_DOTS: Record<ConnectionStatus, string> = {
  open: 'bg-emerald-500',
  connecting: 'bg-amber-500',
  idle: 'bg-muted-foreground/60',
  closed: 'bg-muted-foreground/60',
};
