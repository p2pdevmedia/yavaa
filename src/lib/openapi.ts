import type { OpenAPIV3 } from 'openapi-types';

import { APP_NAME, APP_VERSION } from '@/lib/app-metadata';

export function getOpenApiDocument(): OpenAPIV3.Document {
  return {
    openapi: '3.1.0',
    info: {
      title: `${APP_NAME} API`,
      version: APP_VERSION,
      description: 'Foundation API contract for Yavaa.'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ],
    paths: {
      '/api/health': {
        get: {
          operationId: 'getHealth',
          summary: 'Health check',
          tags: ['foundation'],
          responses: {
            '200': {
              description: 'Service health and build metadata.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['status', 'app', 'version', 'configured'],
                    properties: {
                      status: { type: 'string', enum: ['ok'] },
                      app: { type: 'string' },
                      version: { type: 'string' },
                      configured: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['database', 'supabase'],
                        properties: {
                          database: { type: 'boolean' },
                          supabase: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/session': {
        get: {
          operationId: 'getSessionBootstrap',
          summary: 'Session bootstrap',
          tags: ['auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Authentication handshake state.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['authenticated', 'configured', 'user', 'reason'],
                    properties: {
                      authenticated: { type: 'boolean' },
                      configured: { type: 'boolean' },
                      reason: {
                        anyOf: [
                          { type: 'string', enum: ['missing-token', 'supabase-not-configured', 'invalid-token'] },
                          { type: 'null' }
                        ]
                      },
                      user: {
                        anyOf: [
                          {
                            type: 'object',
                            additionalProperties: false,
                            required: ['id', 'email'],
                            properties: {
                              id: { type: 'string' },
                              email: { anyOf: [{ type: 'string' }, { type: 'null' }] }
                            }
                          },
                          { type: 'null' }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/me': {
        get: {
          operationId: 'getMe',
          summary: 'Authenticated user state',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Authenticated identity and linked app user data.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['authenticated', 'configured', 'reason', 'identity', 'appUser', 'matchedBy', 'permissionContext'],
                    properties: {
                      authenticated: { type: 'boolean' },
                      configured: { type: 'boolean' },
                      reason: {
                        anyOf: [
                          { type: 'string', enum: ['missing-token', 'supabase-not-configured', 'invalid-token'] },
                          { type: 'null' }
                        ]
                      },
                      identity: {
                        anyOf: [
                          {
                            type: 'object',
                            additionalProperties: false,
                            required: ['id', 'email'],
                            properties: {
                              id: { type: 'string' },
                              email: { anyOf: [{ type: 'string' }, { type: 'null' }] }
                            }
                          },
                          { type: 'null' }
                        ]
                      },
                      matchedBy: {
                        anyOf: [
                          { type: 'string', enum: ['supabase_auth_id', 'email'] },
                          { type: 'null' }
                        ]
                      },
                      permissionContext: {
                        anyOf: [
                          {
                            type: 'object',
                            additionalProperties: false,
                            required: ['userId', 'status', 'roles'],
                            properties: {
                              userId: { type: 'string' },
                              status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'] },
                              roles: {
                                type: 'array',
                                items: { type: 'string', enum: ['client', 'contractor', 'admin', 'support'] }
                              }
                            }
                          },
                          { type: 'null' }
                        ]
                      },
                      appUser: {
                        anyOf: [
                          {
                            type: 'object',
                            additionalProperties: false,
                            required: ['id', 'email', 'displayName', 'status', 'roles', 'profile', 'addresses', 'contractorProfile'],
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              displayName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                              status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'] },
                              roles: {
                                type: 'array',
                                items: { type: 'string', enum: ['client', 'contractor', 'admin', 'support'] }
                              },
                              profile: {
                                anyOf: [
                                  {
                                    type: 'object',
                                    additionalProperties: false,
                                    required: ['firstName', 'lastName', 'avatarUrl', 'phone', 'bio'],
                                    properties: {
                                      firstName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      lastName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      avatarUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      phone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      bio: { anyOf: [{ type: 'string' }, { type: 'null' }] }
                                    }
                                  },
                                  { type: 'null' }
                                ]
                              },
                              addresses: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  additionalProperties: false,
                                  required: ['id', 'label', 'line1', 'line2', 'city', 'province', 'postalCode', 'notes', 'type', 'isDefault', 'market'],
                                  properties: {
                                    id: { type: 'string' },
                                    label: { type: 'string' },
                                    line1: { type: 'string' },
                                    line2: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                    city: { type: 'string' },
                                    province: { type: 'string' },
                                    postalCode: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                    notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                    type: { type: 'string' },
                                    isDefault: { type: 'boolean' },
                                    market: {
                                      anyOf: [
                                        {
                                          type: 'object',
                                          additionalProperties: false,
                                          required: ['id', 'slug', 'city', 'province', 'country'],
                                          properties: {
                                            id: { type: 'string' },
                                            slug: { type: 'string' },
                                            city: { type: 'string' },
                                            province: { type: 'string' },
                                            country: { type: 'string' }
                                          }
                                        },
                                        { type: 'null' }
                                      ]
                                    }
                                  }
                                }
                              },
                              contractorProfile: {
                                anyOf: [
                                  {
                                    type: 'object',
                                    additionalProperties: false,
                                    required: ['id', 'approvalStatus', 'dniNumber', 'dniFrontUrl', 'dniBackUrl', 'profilePhotoUrl', 'reviewNotes', 'submittedAt', 'reviewedAt', 'reviewedByUserId', 'addressId', 'categories', 'workZones'],
                                    properties: {
                                      id: { type: 'string' },
                                      approvalStatus: { type: 'string', enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] },
                                      dniNumber: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      dniFrontUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      dniBackUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      profilePhotoUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      reviewNotes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      submittedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      reviewedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      reviewedByUserId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      addressId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                                      categories: { type: 'array', items: { type: 'object' } },
                                      workZones: { type: 'array', items: { type: 'object' } }
                                    }
                                  },
                                  { type: 'null' }
                                ]
                              }
                            }
                          },
                          { type: 'null' }
                        ]
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Missing or invalid session token.'
            }
          }
        }
      },
      '/api/me/profile': {
        patch: {
          operationId: 'updateMeProfile',
          summary: 'Update personal profile',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Updated profile state.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'The authenticated user is suspended or blocked.' },
            '404': { description: 'The authenticated identity is not linked to a Yavaa user.' }
          }
        }
      },
      '/api/me/addresses': {
        get: {
          operationId: 'listMyAddresses',
          summary: 'List personal addresses',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Address list for the authenticated user.' },
            '401': { description: 'Missing or invalid session token.' }
          }
        },
        post: {
          operationId: 'createMyAddress',
          summary: 'Create personal address',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Created address and refreshed user state.' },
            '400': { description: 'Invalid address payload.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'The authenticated user is suspended or blocked.' }
          }
        }
      },
      '/api/me/contractor-profile': {
        get: {
          operationId: 'getMyContractorProfile',
          summary: 'Get contractor profile',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Contractor profile for the authenticated user.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'The authenticated user cannot access contractor data.' }
          }
        },
        patch: {
          operationId: 'updateMyContractorProfile',
          summary: 'Update contractor profile',
          tags: ['me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Updated contractor profile and refreshed user state.' },
            '400': { description: 'Invalid contractor profile payload.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'The authenticated user cannot access contractor data.' },
            '422': { description: 'The selected address does not belong to the authenticated user.' }
          }
        }
      },
      '/api/catalog/categories': {
        get: {
          operationId: 'listCatalogCategories',
          summary: 'Public active categories',
          tags: ['catalog'],
          responses: {
            '200': { description: 'Active public categories.' }
          }
        }
      },
      '/api/catalog/markets': {
        get: {
          operationId: 'listCatalogMarkets',
          summary: 'Public markets and work zones',
          tags: ['catalog'],
          responses: {
            '200': { description: 'Public market catalog.' }
          }
        }
      },
      '/api/admin/categories': {
        get: {
          operationId: 'adminListCategories',
          summary: 'List categories for admin management',
          tags: ['admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'All categories for admin review.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'Only active admins can manage categories.' }
          }
        },
        post: {
          operationId: 'adminUpsertCategory',
          summary: 'Create or update category',
          tags: ['admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Category created or updated.' },
            '400': { description: 'Invalid category payload.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'Only active admins can manage categories.' }
          }
        }
      },
      '/api/admin/contractors/{contractorProfileId}': {
        patch: {
          operationId: 'reviewContractorProfile',
          summary: 'Approve or reject contractor profile',
          tags: ['admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'contractorProfileId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Updated contractor review state.' },
            '400': { description: 'Invalid review payload.' },
            '401': { description: 'Missing or invalid session token.' },
            '403': { description: 'Only active admins can review contractor profiles.' },
            '404': { description: 'Contractor profile not found.' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      }
    }
  } as OpenAPIV3.Document;
}
