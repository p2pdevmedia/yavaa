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
    expect(
      (document.paths['/api/me/profile']?.patch?.requestBody as
        | { content?: Record<string, unknown> }
        | undefined)?.content?.['multipart/form-data']
    ).toBeDefined();
    expect(document.paths['/api/me/addresses']).toBeDefined();
    expect(document.paths['/api/me/addresses/{addressId}']).toBeDefined();
    expect(document.paths['/api/me/addresses/{addressId}']?.patch).toBeDefined();
    expect(document.paths['/api/me/addresses/{addressId}']?.delete).toBeDefined();
    expect(document.paths['/api/me/contractor-profile']).toBeDefined();
    expect(document.paths['/api/catalog/categories']).toBeDefined();
    expect(document.paths['/api/catalog/markets']).toBeDefined();
    expect(document.paths['/api/providers']).toBeDefined();
    expect(document.paths['/api/providers/{contractorProfileId}']).toBeDefined();
    expect(document.paths['/api/bookings']).toBeDefined();
    expect(document.paths['/api/bookings/{bookingId}']).toBeDefined();
    expect(document.paths['/api/bookings/{bookingId}/messages']).toBeDefined();
    expect(document.paths['/api/bookings/{bookingId}/files']).toBeDefined();
    expect(
      (document.paths['/api/bookings/{bookingId}/files']?.post?.requestBody as
        | { content?: Record<string, unknown> }
        | undefined)?.content?.['multipart/form-data']
    ).toBeDefined();
    expect(document.paths['/api/emergencies']).toBeDefined();
    expect(document.paths['/api/emergencies/{emergencyRequestId}']).toBeDefined();
    expect(document.paths['/api/emergencies/{emergencyRequestId}/response']).toBeDefined();
    expect(document.paths['/api/admin/emergencies/{emergencyRequestId}/reassign']).toBeDefined();
    expect(document.paths['/api/admin/users']).toBeDefined();
    expect(document.paths['/api/admin/users/{userId}']).toBeDefined();
    expect(document.paths['/api/admin/users/{userId}/audit-logs']).toBeDefined();
    expect(document.paths['/api/admin/bookings/{bookingId}/correction']).toBeDefined();
    expect(document.paths['/api/admin/categories']).toBeDefined();
    expect(
      (document.paths['/api/admin/categories']?.post?.requestBody as
        | { content?: Record<string, unknown> }
        | undefined)?.content?.['application/json']
    ).toBeDefined();
    expect(document.paths['/api/admin/contractors']).toBeDefined();
    expect(document.paths['/api/admin/contractors/{contractorProfileId}']).toBeDefined();
    expect(document.components?.securitySchemes?.bearerAuth).toBeDefined();
  });

  it('keeps admin user detail and audit activity as separate API resources', () => {
    const document = getOpenApiDocument();
    const userResponseSchema = (
      document.paths['/api/admin/users/{userId}']?.get?.responses?.['200'] as
        | {
            content?: {
              'application/json'?: {
                schema?: {
                  properties?: {
                    user?: {
                      allOf?: Array<{
                        required?: string[];
                        properties?: Record<string, unknown>;
                      }>;
                    };
                  };
                };
              };
            };
          }
        | undefined
    )?.content?.['application/json']?.schema?.properties?.user;
    const detailExtension = userResponseSchema?.allOf?.[1];

    expect(detailExtension?.required).not.toContain('auditLogs');
    expect(detailExtension?.properties).not.toHaveProperty('auditLogs');

    const auditResponseSchema = (
      document.paths['/api/admin/users/{userId}/audit-logs']?.get?.responses?.['200'] as
        | {
            content?: {
              'application/json'?: {
                schema?: {
                  required?: string[];
                  properties?: Record<string, unknown>;
                };
              };
            };
          }
        | undefined
    )?.content?.['application/json']?.schema;

    expect(auditResponseSchema?.required).toContain('auditLogs');
    expect(auditResponseSchema?.properties).toHaveProperty('auditLogs');
  });
});
