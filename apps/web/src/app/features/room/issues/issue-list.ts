import { Component, input, output } from '@angular/core';
import { type Issue, issueLabel, issueStatus } from './issue-types';

/** The expanded list: finished issues with their estimate, the current one, then what's up next. */
@Component({
  selector: 'flipvote-issue-list',
  host: { class: 'block' },
  template: `
    <ul class="flex flex-col gap-0.5" aria-label="Issues">
      @for (issue of issues(); track issue.id) {
        @let status = statusOf(issue);
        <li>
          <button
            type="button"
            class="focus-visible:ring-ring/50 grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-md px-3 py-2.5 text-left outline-none focus-visible:ring-3"
            [class]="
              status === 'current'
                ? 'bg-brand-soft inset-ring-brand-ring cursor-default inset-ring'
                : 'hover:bg-muted cursor-pointer'
            "
            [attr.aria-current]="status === 'current' ? 'true' : null"
            [attr.aria-label]="ariaLabel(issue, status)"
            (click)="status !== 'current' && select.emit(issue.id)"
          >
            <span class="flex min-w-0 flex-col gap-0.5">
              @if (issue.key) {
                <span
                  class="text-xs font-medium"
                  [class]="status === 'current' ? 'text-brand' : 'text-muted-foreground'"
                >
                  {{ issue.key }}
                </span>
              }
              <span
                class="line-clamp-2 text-sm"
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
            </span>
            @switch (status) {
              @case ('current') {
                <span class="text-brand flex h-6 items-center gap-1.5 text-xs font-semibold">
                  <span class="bg-brand size-1.5 rounded-full" aria-hidden="true"></span>
                  Voting
                </span>
              }
              @case ('done') {
                <span
                  class="inset-ring-border flex h-6 min-w-7 items-center justify-center rounded-md px-1.5 text-[13px] font-bold text-slate-700 inset-ring dark:text-slate-200"
                >
                  {{ issue.estimate }}
                </span>
              }
            }
          </button>
        </li>
      } @empty {
        <li class="text-muted-foreground px-3 py-6 text-center text-sm">
          No issues yet. Add one below.
        </li>
      }
    </ul>
  `,
})
export class IssueList {
  readonly issues = input.required<Issue[]>();
  readonly currentId = input.required<string | null>();
  readonly select = output<string>();

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
