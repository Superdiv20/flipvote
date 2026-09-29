import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSquarePen, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { Issue } from '@flipvote/protocol';
import { issueLabel, issueStatus } from './issue-types';
import { HlmItemImports } from '@spartan-ng/helm/item';

/** The expanded list: finished issues with their estimate, the current one, then what's up next. */
@Component({
  selector: 'flipvote-issue-list',
  imports: [NgIcon, HlmButtonImports, HlmItemImports],
  providers: [provideIcons({ lucideSquarePen, lucideTrash2 })],
  host: { class: 'block' },
  template: `
    <hlm-item-group>
      @for (issue of issues(); track issue.id) {
        @let status = statusOf(issue);
        <hlm-item
          role="listitem"
          class="group relative"
          [class]="
            status === 'current'
              ? 'bg-brand-soft inset-ring-brand-ring inset-ring'
              : 'hover:bg-muted'
          "
        >
          <!-- Covers the whole row so a click anywhere selects the issue; the actions sit above it. -->
          <button
            type="button"
            class="focus-visible:ring-ring/50 absolute inset-0 rounded-md outline-none focus-visible:ring-3"
            [class]="status === 'current' ? 'cursor-default' : 'cursor-pointer'"
            [attr.aria-current]="status === 'current' ? 'true' : null"
            [attr.aria-label]="ariaLabel(issue, status)"
            (click)="status !== 'current' && select.emit(issue.id)"
          ></button>
          <hlm-item-media>
            <div class="h-full flex items-center">
              <span
                class="inset-ring-border flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-[13px] font-bold text-slate-700 inset-ring dark:text-slate-200"
              >
                {{ issue.estimate || '-' }}
              </span>
            </div>
          </hlm-item-media>
          <hlm-item-content>
            <hlm-item-title>
              <div class="flex gap-2">
                @if (issue.key) {
                  <span
                    class="text-xs font-medium"
                    [class]="status === 'current' ? 'text-brand' : 'text-muted-foreground'"
                  >
                    {{ issue.key }}
                  </span>
                }
                @if (status === 'current') {
                  <span class="text-brand flex items-center gap-1.5 text-xs font-semibold">
                    <span class="bg-brand size-1 rounded-full" aria-hidden="true"></span>
                    Voting
                  </span>
                }
              </div>
            </hlm-item-title>
            <span
              hlmItemDescription
              class="line-clamp-1 text-sm"
              [class]="
                status === 'done'
                  ? 'text-muted-foreground'
                  : status === 'current'
                    ? 'text-foreground font-medium'
                    : 'text-foreground'
              "
            >
              {{ issue.title }}
            </span>
          </hlm-item-content>
          <hlm-item-actions class="relative z-10">
            <!-- Revealed on hover or keyboard focus, covering the status on the right. -->
            <div
              class="flex items-center gap-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <button
                hlmBtn
                variant="ghost"
                size="icon-sm"
                [attr.aria-label]="'Open ' + issueLabel(issue)"
                (click)="open.emit(issue)"
              >
                <ng-icon name="lucideSquarePen" />
              </button>
              <button
                hlmBtn
                variant="ghost"
                size="icon-sm"
                class="hover:text-destructive"
                [attr.aria-label]="'Delete ' + issueLabel(issue)"
                (click)="remove.emit(issue.id)"
              >
                <ng-icon name="lucideTrash2" />
              </button>
            </div>
          </hlm-item-actions>
        </hlm-item>
      } @empty {
        <li class="text-muted-foreground px-3 py-6 text-center text-sm">
          No issues yet. Add one below.
        </li>
      }
    </hlm-item-group>
  `,
})
export class IssueList {
  readonly issues = input.required<Issue[]>();
  readonly currentId = input.required<string | null>();
  readonly select = output<string>();
  readonly open = output<Issue>();
  readonly remove = output<string>();

  protected readonly issueLabel = issueLabel;

  protected statusOf(issue: Issue) {
    return issueStatus(issue, this.currentId());
  }

  protected ariaLabel(issue: Issue, status: ReturnType<typeof issueStatus>): string {
    const label = issueLabel(issue);
    if (status === 'current') return `${label}, voting now`;
    if (status === 'done') return `${label}, estimated ${issue.estimate}`;
    return `${label}, vote on this issue`;
  }
}
