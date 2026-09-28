import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import {
  HlmDialogClose,
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import type { IssueDetails } from './issue-types';

export interface AddIssueDialogContext {
  /** Prefills the title when adding. */
  title?: string;
  /** The issue to edit. Without it the dialog adds a new issue. */
  issue?: IssueDetails;
}

/** Adds an issue, or edits one when opened with `issue`. Closes with the entered `IssueDetails`. */
@Component({
  imports: [
    HlmDialogHeader,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogFooter,
    HlmDialogClose,
    FormField,
    FormRoot,
    HlmInputImports,
    HlmFieldImports,
    HlmTextareaImports,
    HlmButtonImports,
  ],
  host: {
    class: 'flex flex-col gap-4',
  },
  selector: 'flipvote-add-issue-dialog',
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>{{ editing ? 'Edit issue' : 'Add issue' }}</h3>
      <p hlmDialogDescription>
        {{
          editing
            ? 'Change the title, link or description.'
            : 'Add a new issue with a link and a description.'
        }}
      </p>
    </hlm-dialog-header>

    <form class="flex flex-col gap-4" [formRoot]="fullIssueForm">
      <hlm-field-group>
        <hlm-field>
          <label hlmFieldLabel for="title">Title</label>
          <input hlmInput id="title" type="text" [formField]="fullIssueForm.title" />
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel for="link">Link</label>
          <input hlmInput id="link" type="url" [formField]="fullIssueForm.link" />
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel for="description">Description</label>
          <textarea
            hlmTextarea
            id="description"
            placeholder="Add your description here."
            [formField]="fullIssueForm.description"
          ></textarea>
        </hlm-field>
      </hlm-field-group>

      <hlm-dialog-footer>
        <button hlmBtn type="button" variant="outline" hlmDialogClose>Cancel</button>
        <button hlmBtn type="submit">{{ editing ? 'Save changes' : 'Add issue' }}</button>
      </hlm-dialog-footer>
    </form>
  `,
})
export class AddIssueDialog {
  private readonly _dialogRef = inject<BrnDialogRef<IssueDetails>>(BrnDialogRef);
  private readonly _dialogContext = injectBrnDialogContext<AddIssueDialogContext>();

  protected readonly editing = !!this._dialogContext.issue;

  protected readonly _model = signal({
    title: this._dialogContext.issue?.title ?? this._dialogContext.title ?? '',
    link: this._dialogContext.issue?.link ?? '',
    description: this._dialogContext.issue?.description ?? '',
  });

  public readonly fullIssueForm = form(
    this._model,
    (schemaPath) => {
      required(schemaPath.title);
    },
    {
      submission: {
        action: async (field) => {
          const { title, link, description } = field().value();
          this._dialogRef.close({
            title: title.trim(),
            link: link.trim() || undefined,
            description: description.trim() || undefined,
          });
          return undefined;
        },
      },
    },
  );
}
