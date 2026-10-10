import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { ISSUE_LIMITS } from '@flipvote/protocol';
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
import { fieldError, lengthLimit } from '../../../shared/length-limit';
import { issueTitleLimits } from './issue-title-limits';
import type { IssueDetails } from './issue-types';

const DESCRIPTION_FIELD_MAX_LENGTH = ISSUE_LIMITS.description;

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
          <input
            hlmInput
            id="title"
            type="text"
            [formField]="fullIssueForm.title"
            [attr.aria-describedby]="fieldError(fullIssueForm.title) ? 'title-error' : null"
          />
          @if (fieldError(fullIssueForm.title); as message) {
            <hlm-field-error id="title-error" forceShow>{{ message }}</hlm-field-error>
          }
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel for="link">Link</label>
          <input
            hlmInput
            id="link"
            type="url"
            [formField]="fullIssueForm.link"
            [attr.aria-describedby]="fieldError(fullIssueForm.link) ? 'link-error' : null"
          />
          @if (fieldError(fullIssueForm.link); as message) {
            <hlm-field-error id="link-error" forceShow>{{ message }}</hlm-field-error>
          }
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel for="description">Description</label>
          <textarea
            hlmTextarea
            id="description"
            placeholder="Add your description here."
            [formField]="fullIssueForm.description"
            [attr.aria-describedby]="
              fieldError(fullIssueForm.description)
                ? 'description-error description-count'
                : 'description-count'
            "
          ></textarea>
          @if (fieldError(fullIssueForm.description); as message) {
            <hlm-field-error id="description-error" forceShow>{{ message }}</hlm-field-error>
          }
          <p
            hlmFieldDescription
            id="description-count"
            [class.text-destructive]="
              (fullIssueForm.description().value()?.trim().length || 0) >
              DESCRIPTION_FIELD_MAX_LENGTH
            "
          >
            Characters: {{ fullIssueForm.description().value()?.length || 0 }}/{{
              DESCRIPTION_FIELD_MAX_LENGTH
            }}
          </p>
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

  public readonly DESCRIPTION_FIELD_MAX_LENGTH = DESCRIPTION_FIELD_MAX_LENGTH;
  protected readonly fieldError = fieldError;

  public readonly fullIssueForm = form(
    this._model,
    (schemaPath) => {
      required(schemaPath.title, { message: 'Give the issue a title.' });
      // The same limits as the server, so the form says what's too long and doesn't submit; the
      // server's ISSUE_TOO_LONG stays as the fallback. The title may start with a tracker key,
      // which is measured on its own.
      issueTitleLimits(schemaPath.title);
      lengthLimit(
        schemaPath.link,
        ISSUE_LIMITS.link,
        `Links can have at most ${ISSUE_LIMITS.link} characters.`,
      );
      lengthLimit(
        schemaPath.description,
        ISSUE_LIMITS.description,
        `Descriptions can have at most ${ISSUE_LIMITS.description} characters.`,
      );
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
