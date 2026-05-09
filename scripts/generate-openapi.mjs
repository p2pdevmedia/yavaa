import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { getOpenApiDocument } from '../src/lib/openapi.ts';

const outputPath = resolve(process.cwd(), process.env.OPENAPI_OUTPUT_PATH || 'public/openapi.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(getOpenApiDocument(), null, 2)}\n`, 'utf8');

console.log(`Wrote OpenAPI document to ${outputPath}`);
