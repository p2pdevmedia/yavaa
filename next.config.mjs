/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingIncludes: {
    '/supabase': ['./node_modules/.prisma/client/**/*']
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
