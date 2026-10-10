import { Component, computed, DOCUMENT, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers } from '@ng-icons/lucide';
import type { DeckId, Participant } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { RoomSettings } from '../settings/room-settings';
import { ProfileSettings } from './profile-settings';
import type { Account } from '../../../core/account';
import type { ConnectionStatus } from '../../../core/socket';
import type { Theme, ThemePreference } from '../../../core/theme';
import { AccountMenu } from './account-menu';
import { Logo } from '../../../shared/logo';
import { ParticipantList } from './participant-list';

@Component({
  selector: 'flipvote-room-header',
  imports: [
    HlmButtonImports,
    HlmPopoverImports,
    HlmSwitchImports,
    NgIcon,
    Logo,
    ParticipantList,
    AccountMenu,
    RoomSettings,
    ProfileSettings,
  ],
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
    @if (isFacilitator()) {
      <flipvote-room-settings
        [deckId]="deckId()"
        [participants]="participants()"
        [selfId]="selfId()"
        [votedCount]="votedCount()"
        [flipped]="flipped()"
        [autoFlip]="autoFlip()"
        [onlyFacilitatorCanFlip]="onlyFacilitatorCanFlip()"
        (setDeck)="setDeck.emit($event)"
        (setAutoFlip)="setAutoFlip.emit($event)"
        (setOnlyFacilitatorCanFlip)="setOnlyFacilitatorCanFlip.emit($event)"
        (transferFacilitator)="transferFacilitator.emit($event)"
      />
    }
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
          @if (connection() === 'connecting' || connection() === 'reconnecting') {
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
        <!-- Personal, so it lives here and not in the room settings: anyone can sit a round out. -->
        <div class="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-1.5">
          <label for="watch-only" class="flex flex-col">
            <span class="text-sm font-medium">Watch only</span>
            <span class="text-xs text-muted-foreground">Follow the round without a card.</span>
          </label>
          <hlm-switch
            inputId="watch-only"
            [checked]="isSpectator()"
            (checkedChange)="setSpectator.emit($event)"
          />
        </div>
        <flipvote-participant-list
          [participants]="participants()"
          [selfId]="selfId()"
          [flipped]="flipped()"
        />
      </hlm-popover-content>
    </hlm-popover>
    <!-- Announces a dropped connection once; the dot alone would only be visible. -->
    <span class="sr-only" aria-live="polite">
      {{ connection() === 'reconnecting' ? 'Connection to the room lost. Reconnecting…' : '' }}
    </span>
    <button hlmBtn variant="outline" size="lg" class="px-4" (click)="copyInvite()">
      <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideLink'" data-icon="inline-start" />
      <span aria-live="polite">{{ copied() ? 'Link copied' : 'Invite' }}</span>
    </button>
    <div class="bg-border h-5 w-px" aria-hidden="true"></div>
    <flipvote-account-menu
      [account]="account()"
      [guestName]="guestName()"
      [themePreference]="themePreference()"
      (themePreferenceChange)="themePreferenceChange.emit($event)"
      (openSettings)="profile.open()"
      (signIn)="signIn.emit()"
      (signOut)="signOut.emit()"
    />
    <flipvote-profile-settings #profile [name]="guestName()" (rename)="rename.emit($event)" />
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
  readonly deckId = input.required<DeckId | null>();
  readonly autoFlip = input.required<boolean>();
  readonly onlyFacilitatorCanFlip = input.required<boolean>();
  readonly facilitatorId = input.required<string | null>();
  readonly connection = input.required<ConnectionStatus>();
  readonly theme = input.required<Theme>();
  readonly themePreference = input.required<ThemePreference>();
  readonly account = input.required<Account | null>();
  readonly guestName = input.required<string>();
  readonly toggleTheme = output();
  readonly setDeck = output<DeckId>();
  readonly setAutoFlip = output<boolean>();
  readonly setOnlyFacilitatorCanFlip = output<boolean>();
  readonly transferFacilitator = output<string>();
  readonly setSpectator = output<boolean>();
  readonly themePreferenceChange = output<ThemePreference>();
  readonly rename = output<string>();
  readonly signIn = output();
  readonly signOut = output();

  protected readonly isFacilitator = computed(() => this.facilitatorId() === this.selfId());
  protected readonly isSpectator = computed(
    () => this.participants().find((p) => p.id === this.selfId())?.isSpectator ?? false,
  );

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
  reconnecting: 'Reconnecting…',
  idle: 'Disconnected',
  closed: 'Disconnected',
};

const CONNECTION_DOTS: Record<ConnectionStatus, string> = {
  open: 'bg-emerald-500',
  connecting: 'bg-amber-500',
  reconnecting: 'bg-amber-500',
  idle: 'bg-muted-foreground/60',
  closed: 'bg-muted-foreground/60',
};
