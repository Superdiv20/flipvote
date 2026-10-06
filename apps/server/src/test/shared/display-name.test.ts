import { describe, expect, test } from 'bun:test';
import { NAME_MAX_LENGTH } from '@flipvote/protocol';
import { displayName } from '../../shared/display-name';

describe('displayName', () => {
	test('trims the name', () => {
		expect(displayName('  Ana  ')).toEqual({ ok: true, name: 'Ana' });
	});

	test('rejects a blank name', () => {
		expect(displayName('   ')).toEqual({ ok: false, code: 'NAME_REQUIRED' });
	});

	test('measures the length after trimming', () => {
		const name = 'x'.repeat(NAME_MAX_LENGTH);
		expect(displayName(`   ${name}   `)).toEqual({ ok: true, name });
	});

	test('rejects a name over the maximum', () => {
		expect(displayName('x'.repeat(NAME_MAX_LENGTH + 1))).toEqual({ ok: false, code: 'NAME_TOO_LONG' });
	});
});
