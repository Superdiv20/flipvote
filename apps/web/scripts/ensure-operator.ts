/**
 * Creates `operator.local.ts` with placeholders when it is missing, so a fresh clone builds. An
 * existing file is never touched: it holds the operator's real details.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const local = join(import.meta.dir, '../src/app/features/legal/operator.local.ts');

const PLACEHOLDERS = `import type { Operator } from './operator';

/** The operator's real details. Git ignores this file, see \`operator.ts\`. */
export const OPERATOR: Operator = {
  name: '[Full name]',
  street: '[Street and number]',
  city: '[Postcode and city]',
  phone: '[Phone number]',
  email: '[Email]',
};
`;

if (!existsSync(local)) {
  writeFileSync(local, PLACEHOLDERS);
  console.log('Created operator.local.ts with placeholders. Fill in your details for the imprint.');
}
