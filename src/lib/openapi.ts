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
