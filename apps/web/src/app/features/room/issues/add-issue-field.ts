import { Component, inject, output, signal } from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { form, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucidePlus, lucideShieldAlert } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { AddIssueDialog, type AddIssueDialogContext } from './add-issue-dialog';
import { fieldError } from '../../../shared/length-limit';
import { issueTitleLimits } from './issue-title-limits';
import type { IssueDetails } from './issue-types';

/** Quick add: one issue from a single line on Enter. The plus button opens the full dialog. */
@Component({
  selector: 'flipvote-add-issue-field',
  imports: [HlmInputImports, HlmInputGroupImports, FormField, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideArrowRight, lucidePlus, lucideShieldAlert })],
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <div class="flex items center gap-2">
      <hlm-input-group>
        <label for="add-issue" class="sr-only">Add issue</label>
        <input
          [formField]="quickIssueForm.title"
          hlmInputGroupInput
          id="add-issue"
          class="h-8 text-sm"
          placeholder="Add issue…"
          autocomplete="off"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? 'add-issue-error' : null"
          (keydown.enter)="submit()"
        />
        <hlm-input-group-addon align="inline-end">
          @if (error(); as message) {
            <ng-icon name="lucideShieldAlert" class="text-destructive" />
          } @else {
            <button
              hlmInputGroupButton
              type="submit"
              aria-label="Submit"
              title="Submit"
              size="icon-xs"
              (click)="submit()"
            >
              <ng-icon name="lucideArrowRight" />
            </button>
          }
        </hlm-input-group-addon>
      </hlm-input-group>
      <button
        hlmBtn
        variant="outline"
        aria-label="Open Add Issue Dialog"
        title="Open Add Issue Dialog"
        size="icon"
        (click)="openAddIssueDialog()"
      >
        <ng-icon name="lucidePlus" />
      </button>
    </div>
  `,
})
export class AddIssueField {
  private readonly _hlmDialogService = inject(HlmDialogService);
  readonly add = output<string>();
  /** An issue filled in through the full dialog. */
  readonly create = output<IssueDetails>();

  protected readonly _model = signal({
    title: '',
  });

  // The key and the title each against their own limit, as the server checks them.
  public readonly quickIssueForm = form(this._model, (schemaPath) => {
    issueTitleLimits(schemaPath.title);
  });

  protected error(): string | null {
    return fieldError(this.quickIssueForm.title);
  }

  public openAddIssueDialog() {
    const dialog = this._hlmDialogService.open<IssueDetails, AddIssueDialogContext>(
      AddIssueDialog,
      {
        context: { title: this.quickIssueForm.title().value() },
        contentClass: 'w-[min(28rem,calc(100vw-2rem))]',
      },
    );
    dialog.closed$.subscribe((details) => {
      if (!details) return;
      this.create.emit(details);
      this.quickIssueForm.title().value.set('');
    });
  }

  protected submit(): void {
    const text = this.quickIssueForm.title().value().trim();
    // Too long: the error under the field says so, and the text stays for shortening.
    if (!text || this.quickIssueForm.title().invalid()) return;
    this.add.emit(text);
    this.quickIssueForm.title().value.set('');
  }
}
