import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('jefe workers page', () => {
  const source = readFileSync(join(process.cwd(), 'src/app/dashboard/jefe/trabajadores/page.tsx'), 'utf8');

  test('shows a worker search form and lists active approved contractors', () => {
    expect(source).toContain('listPublicProviders({ query })');
    expect(source).toContain('htmlFor="worker-search"');
    expect(source).toContain('name="q"');
    expect(source).toContain('Contratistas activados');
    expect(source).toContain('providers.items.map');
    expect(source).toContain('<PublicProviderCard');
    expect(source).not.toContain('ModePlaceholderCard');
  });
});
