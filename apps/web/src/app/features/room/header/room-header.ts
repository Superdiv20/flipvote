import { Component, DOCUMENT, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers } from '@ng-icons/lucide';
import type { RoomState } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import type { Account } from '../../../core/account';
import type { Theme } from '../../../core/theme';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
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
        [attr.aria-label]="participants().length + ' participants, show list'"
      >
        <ng-icon name="lucideUsers" aria-hidden="true" />
        <span aria-hidden="true">{{ participants().length }}</span>
      </button>
      <hlm-popover-content *hlmPopoverPortal class="w-72 gap-3 p-3">
        <hlm-popover-header class="px-1">
          <h2 hlmPopoverTitle>Participants</h2>
          <p hlmPopoverDescription class="text-xs">
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
  readonly participants = input.required<RoomState['participants']>();
  readonly selfId = input.required<string>();
  readonly flipped = input.required<boolean>();
  readonly votedCount = input.required<number>();
  readonly theme = input.required<Theme>();
  readonly account = input.required<Account | null>();
  readonly guestName = input.required<string>();
  readonly toggleTheme = output();
  readonly openSettings = output();
  readonly signIn = output();
  readonly signOut = output();

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
