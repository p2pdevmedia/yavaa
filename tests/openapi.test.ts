import { describe, expect, it } from 'vitest';

import { getOpenApiDocument } from '@/lib/openapi';

describe('openapi foundation', () => {
  it('includes the foundation and stage 02 routes and auth schema', () => {
    const document = getOpenApiDocument();

    expect(document.openapi).toBe('3.1.0');
    expect(document.paths['/api/health']).toBeDefined();
    expect(document.paths['/api/session']).toBeDefined();
    expect(document.paths['/api/me']).toBeDefined();
    expect(document.paths['/api/me/profile']).toBeDefined();
    expect(document.paths['/api/me/addresses']).toBeDefined();
    expect(document.paths['/api/me/contractor-profile']).toBeDefined();
    expect(document.paths['/api/catalog/categories']).toBeDefined();
    expect(document.paths['/api/catalog/markets']).toBeDefined();
    expect(document.paths['/api/providers']).toBeDefined();
    expect(document.paths['/api/providers/{contractorProfileId}']).toBeDefined();
    expect(document.paths['/api/bookings']).toBeDefined();
    expect(document.paths['/api/bookings/{bookingId}']).toBeDefined();
    expect(document.paths['/api/emergencies']).toBeDefined();
    expect(document.paths['/api/emergencies/{emergencyRequestId}']).toBeDefined();
    expect(document.paths['/api/emergencies/{emergencyRequestId}/response']).toBeDefined();
    expect(document.paths['/api/admin/emergencies/{emergencyRequestId}/reassign']).toBeDefined();
    expect(document.paths['/api/admin/categories']).toBeDefined();
    expect(document.paths['/api/admin/contractors/{contractorProfileId}']).toBeDefined();
    expect(document.components?.securitySchemes?.bearerAuth).toBeDefined();
  });
});
