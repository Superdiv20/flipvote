import { type FieldTree, maxLengthError, type SchemaPath, validate } from '@angular/forms/signals';

/**
 * Like Signal Forms' `maxLength`, but without the native `maxlength` attribute: the field may run
 * over, says why, and the form won't submit. Measured after trimming, as the server measures it.
 */
export function lengthLimit(path: SchemaPath<string>, max: number, message?: string): void {
  validate(path, ({ value }) =>
    value().trim().length > max
      ? maxLengthError(max, { message: message ?? `Keep it to ${max} characters.` })
      : null,
  );
}

/**
 * The first error of a field, once the user has changed or left it, so an empty form doesn't
 * open with errors but a too long value shows up while typing.
 */
export function fieldError(field: FieldTree<string>): string | null {
  const state = field();
  if (!(state.dirty() || state.touched()) || !state.invalid()) return null;
  return state.errors()[0]?.message ?? null;
}
