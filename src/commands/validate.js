import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validate as schemaValidate } from '@three-ws/avatar-schema';
import { style, symbols, success, failure } from '../style.js';

/**
 * `three-ws-avatar validate <path>` — validate a manifest file against the schema.
 *
 * Exit code 0 if valid, 1 otherwise.
 */
export async function validate({ positional, flags }) {
	const [filePath] = positional;
	if (!filePath) {
		failure('validate: missing <path> argument');
		return 1;
	}
	const full = resolve(process.cwd(), filePath);
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(full, 'utf8'));
	} catch (err) {
		failure(`could not parse JSON at ${filePath}`);
		process.stderr.write(`  ${style.dim(err.message)}\n`);
		return 1;
	}

	const result = schemaValidate(manifest);
	if (result.valid) {
		if (flags.json) {
			console.log(JSON.stringify({ valid: true, path: filePath }));
		} else {
			success(`${style.bold(filePath)} is valid`);
		}
		return 0;
	}

	if (flags.json) {
		console.log(JSON.stringify({ valid: false, path: filePath, errors: result.errors }));
	} else {
		const count = result.errors.length;
		failure(`${style.bold(filePath)} is invalid ${style.dim(`(${count} ${count === 1 ? 'error' : 'errors'})`)}`);
		for (const err of result.errors) {
			const where = style.cyan(err.instancePath || '/');
			process.stderr.write(`  ${style.red(symbols.bullet)} ${where} ${err.message}\n`);
		}
	}
	return 1;
}
