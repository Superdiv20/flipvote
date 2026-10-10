import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsRight, lucideListChecks } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import type { Issue } from '@flipvote/protocol';
import { issueLabel, issueStatus } from './issue-types';

const TOOLTIP_TITLE_LENGTH = 32;

/** The collapsed drawer: an expand button, the issue count and one dot per issue on a timeline. */
@Component({
  selector: 'flipvote-issue-rail',
  imports: [NgIcon, HlmButtonImports, HlmTooltipImports],
  providers: [provideIcons({ lucideChevronsRight, lucideListChecks })],
  host: { class: 'flex flex-col items-center gap-3.5 py-2.5' },
  template: `
    <button hlmBtn variant="ghost" size="icon" aria-label="Expand issues" (click)="expand.emit()">
      <ng-icon name="lucideChevronsRight" />
    </button>
    <div
      class="text-muted-foreground relative flex size-9 items-center justify-center"
      [attr.aria-label]="issues().length + ' issues'"
      role="img"
    >
      <ng-icon name="lucideListChecks" size="20px" aria-hidden="true" />
      <span
        class="bg-foreground text-background absolute top-0 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.25 text-[11px] leading-3 font-semibold"
        aria-hidden="true"
      >
        {{ issues().length }}
      </span>
    </div>
    <div class="bg-border h-px w-6" aria-hidden="true"></div>
    <ul class="relative flex min-h-0 flex-col gap-1 overflow-y-auto" aria-label="Issues">
      @if (issues().length > 1) {
        <li
          class="bg-border absolute inset-y-3 left-1/2 w-px -translate-x-1/2"
          aria-hidden="true"
        ></li>
      }
      @for (issue of issues(); track issue.id) {
        @let status = statusOf(issue);
        <li class="relative z-1">
          <button
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-3"
            [class.cursor-default]="status === 'current'"
            [hlmTooltip]="tooltip(issue)"
            position="right"
            [attr.aria-current]="status === 'current' ? 'true' : null"
            [attr.aria-label]="issueLabel(issue)"
            (click)="status !== 'current' && selectIssue.emit(issue.id)"
          >
            @switch (status) {
              @case ('current') {
                <span
                  class="bg-brand size-2.5 rounded-full shadow-[0_0_0_3px_var(--brand-soft)]"
                ></span>
              }
              @case ('done') {
                <span class="size-2 rounded-full bg-slate-400 dark:bg-slate-600"></span>
              }
              @default {
                <span
                  class="bg-background size-2 rounded-full inset-ring-[1.5px] inset-ring-slate-300 dark:inset-ring-slate-700"
                ></span>
              }
            }
          </button>
        </li>
      }
    </ul>
  `,
})
export class IssueRail {
  readonly issues = input.required<Issue[]>();
  readonly currentId = input.required<string | null>();
  readonly expand = output();
  /** Named so no native DOM event (like `select` from an input) can be mistaken for it. */
  readonly selectIssue = output<string>();

  protected readonly issueLabel = issueLabel;

  protected statusOf(issue: Issue) {
    return issueStatus(issue, this.currentId());
  }

  protected tooltip(issue: Issue): string {
    const title =
      issue.title.length > TOOLTIP_TITLE_LENGTH
        ? `${issue.title.slice(0, TOOLTIP_TITLE_LENGTH).trimEnd()}…`
        : issue.title;
    return issue.key ? `${issue.key} · ${title}` : title;
  }
}
