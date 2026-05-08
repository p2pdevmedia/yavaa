import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const document = {
  openapi: '3.1.0',
  info: {
    title: 'Yavaa API',
    version: '0.1.0',
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
};

const outputPath = resolve(process.cwd(), process.env.OPENAPI_OUTPUT_PATH || 'public/openapi.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Wrote OpenAPI document to ${outputPath}`);
