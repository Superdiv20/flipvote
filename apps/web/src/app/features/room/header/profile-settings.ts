import { Component, input, output, signal, viewChild } from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSheet, HlmSheetImports } from '@spartan-ng/helm/sheet';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';

const NAME_REQUIRED = 'Enter the name the others will see.';

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
  ],
  template: `
    <hlm-sheet side="right">
      <hlm-sheet-content *hlmSheetPortal class="gap-0">
        <hlm-sheet-header>
          <h2 hlmSheetTitle>Profile settings</h2>
          <p hlmSheetDescription>Only this browser remembers them.</p>
        </hlm-sheet-header>

        <form class="flex flex-1 flex-col gap-6 p-4" [formRoot]="profileForm">
          <hlm-field>
            <label hlmFieldLabel for="profile-name">Your name</label>
            <input
              hlmInput
              id="profile-name"
              type="text"
              autocomplete="nickname"
              [formField]="profileForm.name"
              [attr.aria-describedby]="nameError() ? 'profile-name-error' : 'profile-name-hint'"
            />
            @if (nameError(); as message) {
              <hlm-field-error id="profile-name-error" forceShow>{{ message }}</hlm-field-error>
            } @else {
              <p hlmFieldDescription id="profile-name-hint">
                Shown at the table and in the participant list.
              </p>
            }
          </hlm-field>

          <hlm-sheet-footer class="mt-auto p-0">
            <button hlmBtn hlmSheetClose variant="outline" type="button">Cancel</button>
            <button hlmBtn type="submit">Save</button>
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
      maxLength(path.name, NAME_MAX_LENGTH, {
        message: `Keep it under ${NAME_MAX_LENGTH + 1} characters.`,
      });
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

  protected nameError(): string | null {
    const field = this.profileForm.name();
    if (!field.touched() || !field.invalid()) return null;
    return field.errors()[0]?.message ?? NAME_REQUIRED;
  }
}
