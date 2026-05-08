import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'designe/**',
      'docs/design/**',
      'playwright-report/**',
      'public/openapi.json',
      'test-results/**'
    ]
  }
];

export default config;
