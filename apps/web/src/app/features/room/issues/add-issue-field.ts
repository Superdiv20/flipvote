import { Component, inject, output, signal } from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { form, FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '../../../../../libs/ui/dialog/src/lib/hlm-dialog.service';
import { AddIssueDialog } from './add-issue-dialog';

/** Adds an issue on Enter; pasting several lines adds one issue per line. */
@Component({
  selector: 'flipvote-add-issue-field',
  imports: [HlmInputImports, HlmInputGroupImports, FormField, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideArrowRight, lucidePlus })],
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
          aria-describedby="add-issue-hint"
          autocomplete="off"
          (keydown.enter)="submit()"
          (paste)="paste($event)"
        />
        <hlm-input-group-addon align="inline-end">
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

  protected readonly _model = signal({
    title: '',
  });

  public readonly quickIssueForm = form(this._model);

  public openAddIssueDialog() {
    this._hlmDialogService.open(AddIssueDialog, {
      context: {
        title: this.quickIssueForm.title().value(),
      },
    });
  }

  protected submit(): void {
    const text = this.quickIssueForm.title().value().trim();
    if (!text) return;
    this.add.emit(text);
    this.quickIssueForm.title().value.set('');
  }

  protected paste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/\r?\n/.test(text.trim())) return;
    event.preventDefault();
    this.add.emit(text);
  }
}
