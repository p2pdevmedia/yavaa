# Public Agent API Docs Design

## Goal

Expose the existing Agent API guide at `/docs/api` so people and agents can read the supported Yavaa API contract from the website.

## Security Analysis

Publishing the Agent API guide is acceptable because the document contains only public contract information and placeholder examples. It must not expose real environment values, access tokens, cookies, database credentials, service role keys, private blob paths, or user data.

The page must not add a new API surface. It should only render static documentation. The actual platform security remains in the existing API routes, Supabase bearer token validation, local user resolution, active-status checks, role checks, and onboarding checks.

The highest risk is accidentally publishing secrets or implying that the publishable Supabase key is a privileged secret. The page should explicitly say that agents use the Supabase publishable key, never the service role key, and that a valid bearer token does not bypass server-side Yavaa permissions.

## Design

- Add a public Next.js route at `src/app/docs/api/page.tsx`.
- Render the committed Markdown guide from `docs/api/agent-api.md`.
- Keep the route static with no cookies, request headers, search params, or database calls.
- Use the existing Yavaa page shell and visual language.
- Add a short visible security review above the rendered guide.
- Preserve the Markdown guide as the source of truth for agent builders.

## Testing

- Add a focused Vitest file-reading test for the route.
- Assert that the page renders `/docs/api`, the Agent API guide, the security review, and service-role warnings.
- Assert that the page does not reference real env values or read request/auth state.

## Quality Gate

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
