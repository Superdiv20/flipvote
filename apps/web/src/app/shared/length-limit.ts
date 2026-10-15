import { type FieldTree, maxLengthError, type SchemaPath, validate } from '@angular/forms/signals';
import { marker } from '@jsverse/transloco-keys-manager/marker';

/** A form error, ready for the `transloco` pipe: `{{ error.key | transloco: error.params }}`. */
export type FieldErrorText = { key: string; params: { max?: number } };

const DEFAULT_TOO_LONG = marker('forms.tooLong');

/**
 * Like Signal Forms' `maxLength`, but without the native `maxlength` attribute: the field may run
 * over, says why, and the form won't submit. Measured after trimming, as the server measures it.
 *
 * `messageKey` is a translation key; the error carries it instead of a finished sentence, so the
 * text follows a language switch. The limit is passed to it as `{max}`.
 */
export function lengthLimit(
  path: SchemaPath<string>,
  max: number,
  messageKey: string = DEFAULT_TOO_LONG,
): void {
  validate(path, ({ value }) =>
    value().trim().length > max ? maxLengthError(max, { message: messageKey }) : null,
  );
}

/**
 * The first error of a field, once the user has changed or left it, so an empty form doesn't
 * open with errors but a too long value shows up while typing. Every validator in the app puts a
 * translation key into `message`.
 */
export function fieldError(field: FieldTree<string>): FieldErrorText | null {
  const state = field();
  if (!(state.dirty() || state.touched()) || !state.invalid()) return null;
  const error = state.errors()[0];
  if (!error?.message) return null;
  const max = 'maxLength' in error ? (error.maxLength as number) : undefined;
  return { key: error.message, params: { max } };
}
