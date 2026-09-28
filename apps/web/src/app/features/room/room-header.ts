import { Component, DOCUMENT, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { Theme } from '../../core/theme';
import { Logo } from './logo';

@Component({
  selector: 'flipvote-room-header',
  imports: [HlmButtonImports, NgIcon, Logo],
  providers: [provideIcons({ lucideCheck, lucideLink, lucideMoon, lucideSun, lucideUsers })],
  host: {
    class: 'flex h-16 shrink-0 items-center gap-4 px-6 shadow-[inset_0_-1px_0_var(--border)]',
  },
  template: `
    <flipvote-logo />
    <div class="bg-border h-5 w-px max-sm:hidden" aria-hidden="true"></div>
    <div class="flex min-w-0 flex-1 flex-col max-sm:hidden">
      <span class="text-muted-foreground truncate text-xs font-medium">{{ roomName() }}</span>
      <h1 class="truncate text-sm font-semibold">{{ topic() }}</h1>
    </div>
    <div
      class="bg-muted flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium max-sm:ml-auto"
      [attr.aria-label]="participantCount() + ' participants'"
      role="status"
    >
      <ng-icon name="lucideUsers" class="text-base" aria-hidden="true" />
      <span aria-hidden="true">{{ participantCount() }}</span>
    </div>
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
  `,
})
export class RoomHeader {
  private readonly document = inject(DOCUMENT);

  readonly roomName = input.required<string>();
  readonly topic = input.required<string>();
  readonly participantCount = input.required<number>();
  readonly theme = input.required<Theme>();
  readonly toggleTheme = output();

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
