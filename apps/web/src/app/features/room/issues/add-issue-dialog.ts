import { Component, signal } from '@angular/core';
import { HlmDialogDescription } from '../../../../../libs/ui/dialog/src/lib/hlm-dialog-description';
import {
  HlmDialogClose,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@spartan-ng/helm/dialog';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';

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
  styles: ``,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Add issue</h3>
      <p hlmDialogDescription>Add a new issue with a link and a description.</p>
    </hlm-dialog-header>

    <form [formRoot]="fullIssueForm">
      <hlm-field-group>
        <hlm-field>
          <label hlmFieldLabel id="title-label" for="title">Title</label>
          <input
            hlmInput
            id="title"
            type="text"
            aria-labelledby="title-label"
            [formField]="fullIssueForm.title"
          />
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel id="link-label" for="link">Link</label>
          <input
            hlmInput
            id="link"
            type="text"
            aria-labelledby="link-label"
            [formField]="fullIssueForm.link"
          />
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel id="desription-label" for="desription">Title</label>
          <textarea
            hlmTextarea
            id="description"
            aria-labelledby="description-label"
            placeholder="Add your description here."
            [formField]="fullIssueForm.description"
          ></textarea>
        </hlm-field>
      </hlm-field-group>
    </form>

    <hlm-dialog-footer>
      <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
      <button hlmBtn type="submit">Add issue</button>
    </hlm-dialog-footer>
  `,
})
export class AddIssueDialog {
  private readonly _dialogContext = injectBrnDialogContext<{ title: string }>();

  protected readonly _model = signal({
    title: this._dialogContext.title || '',
    link: '',
    description: '',
  });

  public readonly fullIssueForm = form(this._model, (schemaPath) => {
    required(schemaPath.title);
  });
}
