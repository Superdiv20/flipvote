import { Component, inject, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsLeft } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { AddIssueDialog, type AddIssueDialogContext } from './add-issue-dialog';
import { AddIssueField } from './add-issue-field';
import { IssueList } from './issue-list';
import { IssueRail } from './issue-rail';
import type { Issue } from '@flipvote/protocol';
import type { IssueDetails } from './issue-types';

/**
 * Issues docked on the left, 300px wide or collapsed to a 56px rail. From `lg` up it pushes the
 * table aside; below that it keeps the rail's space and the expanded panel overlays the table.
 */
@Component({
  selector: 'flipvote-issue-drawer',
  imports: [NgIcon, HlmButtonImports, AddIssueField, IssueList, IssueRail],
  providers: [provideIcons({ lucideChevronsLeft })],
  host: {
    class:
      'relative shrink-0 transition-[width] duration-220 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
    '[class]': "collapsed() ? 'w-14' : 'w-14 lg:w-85'",
  },
  template: `
    <div
      class="bg-background absolute inset-y-0 left-0 z-20 overflow-hidden shadow-[inset_-1px_0_0_var(--border)] transition-[width,box-shadow] duration-220 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
      [class]="collapsed() ? 'w-14' : 'w-85 max-lg:shadow-float'"
    >
      <section
        class="absolute inset-y-0 left-0 flex w-85 flex-col transition-opacity duration-180 ease-out motion-reduce:transition-none"
        [class]="collapsed() ? 'opacity-0' : 'opacity-100'"
        [inert]="collapsed()"
        aria-labelledby="issues-title"
      >
        <div class="flex h-14 shrink-0 items-center gap-2 pr-2.5 pl-4">
          <h2 id="issues-title" class="text-sm font-semibold">Issues</h2>
          <span
            class="bg-muted flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
            [attr.aria-label]="issues().length + ' issues'"
          >
            {{ issues().length }}
          </span>
          <span class="flex-1"></span>
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            aria-label="Collapse issues"
            (click)="toggle.emit()"
          >
            <ng-icon name="lucideChevronsLeft" />
          </button>
        </div>
        <flipvote-issue-list
          class="min-h-0 flex-1 overflow-y-auto px-2"
          [issues]="issues()"
          [currentId]="currentId()"
          (select)="select.emit($event)"
          (open)="openIssue($event)"
          (remove)="remove.emit($event)"
        />
        <flipvote-add-issue-field
          class="px-4 pt-3 pb-4 shadow-[inset_0_1px_0_var(--border)]"
          (add)="add.emit($event)"
          (create)="create.emit($event)"
        />
      </section>
      <flipvote-issue-rail
        class="absolute inset-y-0 left-0 w-14 transition-opacity duration-180 ease-out motion-reduce:transition-none"
        [class]="collapsed() ? 'opacity-100' : 'opacity-0'"
        [inert]="!collapsed()"
        [issues]="issues()"
        [currentId]="currentId()"
        (expand)="toggle.emit()"
        (select)="select.emit($event)"
      />
    </div>
  `,
})
export class IssueDrawer {
  readonly issues = input.required<Issue[]>();
  readonly currentId = input.required<string | null>();
  readonly collapsed = input.required<boolean>();

  /** The user asked to collapse or expand. */
  readonly toggle = output();
  readonly select = output<string>();
  readonly add = output<string>();
  readonly create = output<IssueDetails>();
  readonly update = output<{ id: string; details: IssueDetails }>();
  readonly remove = output<string>();

  private readonly dialog = inject(HlmDialogService);

  protected openIssue(issue: Issue): void {
    const { title, link, description } = issue;
    this.dialog
      .open<IssueDetails, AddIssueDialogContext>(AddIssueDialog, {
        context: { issue: { title, link, description } },
        contentClass: 'w-[min(28rem,calc(100vw-2rem))]',
      })
      .closed$.subscribe((details) => {
        if (details) this.update.emit({ id: issue.id, details });
      });
  }
}
