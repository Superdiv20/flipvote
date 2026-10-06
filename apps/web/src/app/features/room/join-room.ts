import { Component, output, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { Logo } from '../../shared/logo';

const NAME_MESSAGE = 'Enter the name the others will see.';

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
  ],
  host: { class: 'flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12' },
  template: `
    <flipvote-logo />
    <section hlmCard class="w-full max-w-sm shadow-table" aria-labelledby="join-room-title">
      <div hlmCardHeader>
        <h1 hlmCardTitle id="join-room-title" class="text-xl font-semibold tracking-tight">
          Join the planning session
        </h1>
        <p hlmCardDescription>
          Pick a name for the table. This browser remembers it for next time.
        </p>
      </div>

      <form hlmCardContent class="flex flex-col gap-6" [formRoot]="joinForm">
        <hlm-field>
          <label hlmFieldLabel for="display-name">Your name</label>
          <input
            hlmInput
            id="display-name"
            type="text"
            autocomplete="nickname"
            placeholder="Ana"
            [formField]="joinForm.name"
            [attr.aria-describedby]="nameInvalid() ? 'display-name-error' : null"
          />
          @if (nameInvalid()) {
            <hlm-field-error id="display-name-error" forceShow>{{ nameError() }}</hlm-field-error>
          }
        </hlm-field>

        <button
          hlmBtn
          type="submit"
          class="w-full bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          Join room
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
      maxLength(schemaPath.name, NAME_MAX_LENGTH, {
        message: `Keep it under ${NAME_MAX_LENGTH + 1} characters.`,
      });
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
    const name = this.joinForm.name();
    return name.touched() && name.invalid();
  }

  /** The first error of the name field, e.g. too long, rather than one fixed text. */
  protected nameError(): string {
    return this.joinForm.name().errors()[0]?.message ?? NAME_MESSAGE;
  }
}
