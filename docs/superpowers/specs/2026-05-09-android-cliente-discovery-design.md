# Android Cliente Discovery Design

## Goal

Build the first real Android product slice for client-side public discovery: users can open the native app, browse categories and markets, find public providers, and inspect an approved provider profile without signing in.

## Scope

This slice turns the Android scaffold from an authenticated technical demo into a public marketplace entry point. Discovery is read-only and uses the existing public backend contract:

1. `GET /api/catalog/categories`
2. `GET /api/catalog/markets`
3. `GET /api/providers?category=&market=`
4. `GET /api/providers/{contractorProfileId}`

The app must not invent provider data that the API does not expose. Ratings, prices, distance, review counts, availability schedules, portfolio photos, and booking actions stay out of scope until the backend contract supports them.

## User Flow

1. The app opens to public discovery, not to mandatory login.
2. The user sees a Spanish-first home screen with a market selector, category shortcuts, and provider results.
3. The user can filter providers by category and market.
4. Empty states explain that no providers match the selected filters.
5. Network and parsing errors are visible, retryable, and deterministic.
6. The user can open a provider profile.
7. The profile shows public-safe provider data: display name, bio, categories, market, work zones, profile photo when available, and whether emergencies are accepted.
8. Reservation/contact CTAs are visible only as future-state placeholders or disabled actions. They must not imply that booking is implemented.

## Architecture

The Android app remains a single Gradle module for now. Add a focused discovery vertical instead of introducing multi-module architecture early.

Source boundaries:

- `core/network`: owns typed public discovery DTOs and HTTP methods.
- `feature/discovery`: owns discovery UI state, ViewModels, screens, list cards, filters, and profile detail.
- `core/ui/theme`: extends existing colors and typography toward the documented design direction.
- `navigation`: starts at public discovery and keeps auth as an explicit secondary route for later protected actions.

The discovery ViewModels should depend on `YavaaApiClient`, not on Supabase Auth. Public endpoints do not send bearer tokens.

## Design Direction

Android should adapt the local design reference from `docs/design` and `designe/`, not copy the prototype CSS directly.

Use the `terracotta` palette as the default mobile theme:

- background: `#F6EFE3`
- surface: `#FFFBF3`
- ink: `#1F1A14`
- muted: `#6B6258`
- line: `#E5DBC8`
- primary: `#C0492A`
- primary ink: `#FFF5EC`
- verified/accent success: `#2F6B3A`

Interaction patterns:

- bottom navigation with `Inicio`, `Buscar`, `Reservas`, `Mensajes`, `Tú`
- cards for providers
- chips for category and market filters
- pills for `Acepta urgencias` / `Sin urgencias`
- explicit loading, empty, error, and retry states
- stable Spanish labels suitable for automated tests

For this slice, bottom tabs can include disabled or placeholder destinations for future domains, but only `Inicio` and provider profile navigation should be functional.

## Screens

### Discovery Home

Responsibilities:

- Load categories, markets, and initial provider results.
- Select a default market from the primary market when available.
- Render a search-first marketplace home using the design direction.
- Show category shortcuts from `GET /api/catalog/categories`.
- Show provider cards from `GET /api/providers`.
- Support retry when catalog or provider loading fails.

### Provider Results

Responsibilities:

- Apply selected category and market filters.
- Keep filter state explicit in ViewModel state.
- Display empty results separately from network errors.
- Render only public fields returned by the API.

Provider results stay inside `DiscoveryHomeScreen` for this slice. The only new detail route is `ProviderProfileScreen`.

### Provider Profile

Responsibilities:

- Load `GET /api/providers/{contractorProfileId}`.
- Show provider identity, bio, categories, market, work zones, emergency support, and profile photo or deterministic initials fallback.
- Show not-found as a stable screen when the API returns `provider: null` or `404`.
- Keep booking/contact actions disabled or clearly marked unavailable until the booking slice exists.

## API Contract

Typed Android models should mirror the current OpenAPI/public TypeScript shapes:

- `PublicCatalogCategory`
- `PublicCatalogMarket`
- `PublicProviderCard`
- `PublicProviderProfile`

Parsing must ignore unknown fields so Android can tolerate additive backend changes. Missing required fields should fail loudly in tests.

No API changes are required for this slice unless implementation discovers an OpenAPI mismatch. If APIs change, update `public/openapi.json`, route tests, Android DTOs, and Android client tests together.

## State And Error Handling

Each screen state must be deterministic:

- `Idle` before loading begins.
- `Loading` while a request is active.
- `Ready` with data and current filters.
- `Empty` when the request succeeds with no providers.
- `Error` with a short Spanish message and retry action.
- `NotFound` for missing provider profile.

Do not use optimistic state for discovery. The server response is the source of truth.

## Permissions And Security

Discovery is public and read-only. Android must not send Supabase service role keys and must not require a Supabase session for public discovery.

The backend remains responsible for hiding unapproved contractors and inactive users. Android should not attempt to enforce approval status beyond trusting the public API response.

## Testing

Unit tests should cover:

- public endpoint URL construction with category and market filters
- JSON parsing for categories, markets, provider list, and provider profile
- no `Authorization` header on public discovery calls
- ViewModel loading, success, empty, error, and filter update states
- provider profile not-found state

Instrumentation or Compose UI tests can be added when the local Android SDK is available, but this slice should still have useful JVM tests.

## Out Of Scope

- booking creation
- emergency request creation
- chat
- login-required actions
- contractor mode
- profile editing
- ratings and reviews
- distance calculations
- payment or debt state
- push notifications
- generated OpenAPI client

## Completion Criteria

- Android opens to public discovery.
- Discovery uses real public API endpoints.
- Provider filters are functional.
- Provider profile is functional.
- Loading, empty, error, retry, and not-found states are implemented.
- Android unit tests cover client and ViewModel behavior.
- Existing Android auth scaffold remains accessible and not broken.
- No server-side permission assumptions are moved into Android.
