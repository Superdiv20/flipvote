import { Component, input, output, signal, viewChild } from '@angular/core';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { type FieldErrorText, fieldError, lengthLimit } from '../../../shared/length-limit';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSheet, HlmSheetImports } from '@spartan-ng/helm/sheet';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';

const NAME_REQUIRED = marker('forms.nameRequired');

/**
 * Settings for yourself, in a sheet from the right. Opened from the account menu, so it has no
 * trigger of its own: the parent calls `open()`.
 */
@Component({
  selector: 'flipvote-profile-settings',
  imports: [
    FormField,
    FormRoot,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSheetImports,
    TranslocoPipe,
  ],
  template: `
    <hlm-sheet side="right">
      <hlm-sheet-content *hlmSheetPortal class="gap-0">
        <hlm-sheet-header>
          <h2 hlmSheetTitle>{{ 'account.profileSettings' | transloco }}</h2>
          <p hlmSheetDescription>{{ 'profile.description' | transloco }}</p>
        </hlm-sheet-header>

        <form class="flex flex-1 flex-col gap-6 p-4" [formRoot]="profileForm">
          <hlm-field>
            <label hlmFieldLabel for="profile-name">{{ 'forms.yourName' | transloco }}</label>
            <input
              hlmInput
              id="profile-name"
              type="text"
              autocomplete="nickname"
              [formField]="profileForm.name"
              [attr.aria-describedby]="nameError() ? 'profile-name-error' : 'profile-name-hint'"
            />
            @if (nameError(); as error) {
              <hlm-field-error id="profile-name-error" forceShow>{{
                error.key | transloco: error.params
              }}</hlm-field-error>
            } @else {
              <p hlmFieldDescription id="profile-name-hint">
                {{ 'profile.nameHint' | transloco }}
              </p>
            }
          </hlm-field>

          <hlm-sheet-footer class="mt-auto p-0">
            <button hlmBtn hlmSheetClose variant="outline" type="button">
              {{ 'common.cancel' | transloco }}
            </button>
            <button hlmBtn type="submit">{{ 'common.save' | transloco }}</button>
          </hlm-sheet-footer>
        </form>
      </hlm-sheet-content>
    </hlm-sheet>
  `,
})
export class ProfileSettings {
  /** The name to start from each time the sheet opens. */
  readonly name = input.required<string>();
  /** The trimmed new name. Only emitted when it actually changed. */
  readonly rename = output<string>();

  private readonly sheet = viewChild.required(HlmSheet);

  private readonly model = signal({ name: '' });

  protected readonly profileForm = form(
    this.model,
    (path) => {
      required(path.name, { message: NAME_REQUIRED });
      // `required` accepts a name of only spaces.
      pattern(path.name, /\S/, { message: NAME_REQUIRED });
      lengthLimit(path.name, NAME_MAX_LENGTH, marker('forms.nameTooLong'));
    },
    {
      submission: {
        action: async (field) => {
          const name = field().value().name.trim();
          if (name !== this.name()) this.rename.emit(name);
          this.sheet().close();
          return undefined;
        },
      },
    },
  );

  open(): void {
    // Start from the current name every time, so a cancelled edit doesn't linger.
    this.profileForm().reset({ name: this.name() });
    this.sheet().open();
  }

  protected nameError(): FieldErrorText | null {
    return fieldError(this.profileForm.name);
  }
}
