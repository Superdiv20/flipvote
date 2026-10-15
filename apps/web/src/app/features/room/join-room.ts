import { Component, output, signal } from '@angular/core';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { type FieldErrorText, fieldError, lengthLimit } from '../../shared/length-limit';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { Logo } from '../../shared/logo';

const NAME_MESSAGE = marker('forms.nameRequired');

/** Asks a visitor without a saved name for one before joining. Emits the trimmed name. */
@Component({
  selector: 'flipvote-join-room',
  imports: [
    FormField,
    FormRoot,
    HlmButtonImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    Logo,
    TranslocoPipe,
  ],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <section hlmCard class="w-full max-w-sm shadow-table" aria-labelledby="join-room-title">
      <div hlmCardHeader>
        <h1 hlmCardTitle id="join-room-title" class="text-xl font-semibold tracking-tight">
          {{ 'room.join.title' | transloco }}
        </h1>
        <p hlmCardDescription>{{ 'room.join.description' | transloco }}</p>
      </div>

      <form hlmCardContent class="flex flex-col gap-6" [formRoot]="joinForm">
        <hlm-field>
          <label hlmFieldLabel for="display-name">{{ 'forms.yourName' | transloco }}</label>
          <input
            hlmInput
            id="display-name"
            type="text"
            autocomplete="nickname"
            [placeholder]="'forms.namePlaceholder' | transloco"
            [formField]="joinForm.name"
            [attr.aria-describedby]="nameInvalid() ? 'display-name-error' : null"
          />
          @if (nameError(); as error) {
            <hlm-field-error id="display-name-error" forceShow>{{
              error.key | transloco: error.params
            }}</hlm-field-error>
          }
        </hlm-field>

        <button
          hlmBtn
          type="submit"
          class="w-full bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          {{ 'room.join.submit' | transloco }}
        </button>
      </form>
    </section>
  `,
})
export class JoinRoom {
  readonly join = output<string>();

  private readonly model = signal({ name: '' });

  protected readonly joinForm = form(
    this.model,
    (schemaPath) => {
      required(schemaPath.name, { message: NAME_MESSAGE });
      // `required` accepts a name of only spaces.
      pattern(schemaPath.name, /\S/, { message: NAME_MESSAGE });
      lengthLimit(schemaPath.name, NAME_MAX_LENGTH, marker('forms.nameTooLong'));
    },
    {
      submission: {
        action: async (field) => {
          this.join.emit(field().value().name.trim());
          return undefined;
        },
      },
    },
  );

  protected nameInvalid(): boolean {
    return this.nameError() !== null;
  }

  /** The first error of the name field, e.g. too long, rather than one fixed text. */
  protected nameError(): FieldErrorText | null {
    return fieldError(this.joinForm.name);
  }
}
