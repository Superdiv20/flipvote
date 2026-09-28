import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideLogIn,
  lucideLogOut,
  lucideSettings,
  lucideUser,
} from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import type { Account } from '../../core/account';

/** Avatar button in the top bar with the account dropdown. Guests get a person icon and a Sign in action. */
@Component({
  selector: 'flipvote-account-menu',
  imports: [NgTemplateOutlet, NgIcon, HlmAvatarImports, HlmDropdownMenuImports],
  providers: [
    provideIcons({ lucideChevronDown, lucideLogIn, lucideLogOut, lucideSettings, lucideUser }),
  ],
  host: { class: 'flex' },
  template: `
    <button
      type="button"
      class="bg-muted text-muted-foreground focus-visible:ring-ring/50 flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-0.5 outline-none focus-visible:ring-3"
      aria-label="Account menu"
      [hlmDropdownMenuTrigger]="menu"
      align="end"
    >
      <ng-container *ngTemplateOutlet="avatar" />
      <ng-icon name="lucideChevronDown" size="14px" aria-hidden="true" />
    </button>

    <ng-template #menu>
      <hlm-dropdown-menu class="w-60">
        <div class="flex items-center gap-2.5 p-2">
          <ng-container *ngTemplateOutlet="avatar" />
          <div class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-semibold">{{ displayName() }}</span>
            <span class="text-muted-foreground truncate text-xs">
              {{ account()?.email ?? 'Guest · this browser only' }}
            </span>
          </div>
        </div>
        <hlm-dropdown-menu-separator />
        @if (!account()) {
          <div class="px-0.5 pt-1 pb-1.5">
            <button
              hlmDropdownMenuItem
              class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground h-10 w-full justify-center font-medium"
              (triggered)="signIn.emit()"
            >
              <ng-icon name="lucideLogIn" />
              Sign in
            </button>
          </div>
        }
        <button hlmDropdownMenuItem (triggered)="openSettings.emit()">
          <ng-icon name="lucideSettings" />
          Profile settings
        </button>
        @if (account()) {
          <hlm-dropdown-menu-separator />
          <button hlmDropdownMenuItem (triggered)="signOut.emit()">
            <ng-icon name="lucideLogOut" />
            Sign out
          </button>
        }
      </hlm-dropdown-menu>
    </ng-template>

    <ng-template #avatar>
      @if (account()) {
        <hlm-avatar aria-hidden="true">
          <span hlmAvatarFallback class="text-foreground text-xs font-medium">{{
            initials()
          }}</span>
        </hlm-avatar>
      } @else {
        <span
          class="bg-muted text-muted-foreground inset-ring-border flex size-8 shrink-0 items-center justify-center rounded-full inset-ring"
          aria-hidden="true"
        >
          <ng-icon name="lucideUser" size="16px" />
        </span>
      }
    </ng-template>
  `,
})
export class AccountMenu {
  readonly account = input.required<Account | null>();
  /** Shown for guests, who only have the name they joined with. */
  readonly guestName = input.required<string>();

  readonly openSettings = output();
  readonly signIn = output();
  readonly signOut = output();

  protected readonly displayName = computed(() => this.account()?.name ?? this.guestName());
  protected readonly initials = computed(() =>
    this.displayName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
}
