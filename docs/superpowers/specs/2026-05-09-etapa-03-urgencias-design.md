# Etapa 03 - Urgencias

Date: 2026-05-09

## Status

Draft spec ready for user review before implementation planning.

## Context

Etapa 03 already has:

- public provider discovery
- scheduled bookings
- OpenAPI coverage for the implemented routes
- Prisma migrations applied for the booking slice

The next slice is the urgent request flow. This needs to support:

- create an emergency request
- notify compatible contractors
- accept or ignore from the contractor side
- time out and re-dispatch when nobody answers
- admin reassignment when the automatic flow cannot resolve the request

## Goal

Implement a deterministic emergency request flow that stays separate from scheduled bookings.

The client should be able to request help now, and the system should keep state in the database until a contractor accepts or the request is explicitly closed.

## Non-goals

This slice does not include:

- chat
- files
- payments
- debt enforcement
- ratings
- service pricing
- weekly availability scheduling
- complex dispatch optimization

Those belong to later stages or later slices.

## Recommended approach

Use a dedicated emergency aggregate instead of overloading the scheduled booking model.

Why:

- scheduled bookings already have a stable lifecycle
- urgent requests have a different lifecycle and different participants
- separating them keeps permissions and testing simpler
- dispatch rounds and timeouts are easier to reason about as first-class state

## Data model

### `ContractorProfile`

Add a boolean flag for emergency eligibility:

- `acceptsEmergencies Boolean @default(false)`

This is the simplest deterministic signal for whether a contractor can receive urgent requests in this slice.

### `EmergencyRequest`

Core fields:

- `id`
- `clientUserId`
- `categoryId`
- `addressId`
- `description`
- `status`
- `assignedContractorProfileId` nullable
- `dispatchRound`
- `expiresAt`
- `acceptedAt` nullable
- `cancelledAt` nullable
- `createdAt`
- `updatedAt`

Recommended statuses:

- `OPEN`
- `DISPATCHING`
- `ACCEPTED`
- `CANCELLED_BY_CLIENT`
- `REASSIGNMENT_NEEDED`
- `EXPIRED`

### `EmergencyRequestCandidate`

Track every contractor that was considered for a dispatch round.

Core fields:

- `id`
- `emergencyRequestId`
- `contractorProfileId`
- `dispatchRound`
- `status`
- `notifiedAt`
- `respondedAt` nullable
- `responseNote` nullable
- `createdAt`
- `updatedAt`

Recommended statuses:

- `NOTIFIED`
- `ACCEPTED`
- `IGNORED`
- `EXPIRED`
- `REVOKED`

This table is the audit trail for who was notified and what happened next.

## Matching rules

When the client creates an urgent request, the system should select contractors that satisfy all of these:

- user is active
- contractor profile is approved
- contractor profile has `acceptsEmergencies = true`
- contractor has the requested category
- contractor works in the market of the selected address

The first dispatch round can use a small deterministic batch. The exact batch size should be fixed in code so tests are predictable.

## Flow

### 1. Create request

Client submits:

- category
- address
- description

The system:

- validates ownership of the address
- validates category and market compatibility
- creates the emergency request
- creates the initial candidate rows
- marks the request `DISPATCHING`
- records an audit log entry

### 2. Contractor response

Contractors can only respond to candidates assigned to them.

Allowed actions:

- `accept`
- `ignore`

On accept:

- the request becomes `ACCEPTED`
- the contractor is assigned
- all other active candidate rows are revoked or expired
- audit log is recorded

On ignore:

- the candidate becomes `IGNORED`
- the request stays open if other candidates remain

### 3. Timeout and re-dispatch

If the current dispatch round expires and nobody accepted:

- the request becomes `REASSIGNMENT_NEEDED`
- a later dispatch round can create fresh candidate rows
- previously ignored or expired candidates stay immutable

If no compatible contractors remain:

- the request becomes `EXPIRED`

### 4. Client republish

The client can republish their own expired request.

Republishing creates a new emergency request with the same category, address, and description. The expired request stays immutable for auditability. A republished request has a shorter activity window of 2 hours from the republication moment.

### 5. Client cancel

The client can cancel an open or dispatching request.

That transitions the request to `CANCELLED_BY_CLIENT` and stops any pending candidate rows from being actionable.

### 6. Admin reassignment

Admin can force a reassignment when the automatic flow stalls.

This action should:

- pick a new contractor set
- increment the dispatch round
- record the reason in audit metadata

## API surface

Recommended routes:

- `POST /api/emergencies`
- `GET /api/emergencies`
- `GET /api/emergencies/[emergencyRequestId]`
- `PATCH /api/emergencies/[emergencyRequestId]`
- `PATCH /api/emergencies/[emergencyRequestId]/response`
- `PATCH /api/admin/emergencies/[emergencyRequestId]/reassign`

Request shapes should remain typed and documented in OpenAPI.

## Permissions

### Client

Can:

- create their own emergency request
- view their own emergency requests
- cancel their own open request

Cannot:

- see unrelated requests
- respond as a contractor
- reassign as admin

### Contractor

Can:

- view only the requests they were notified about
- accept or ignore while the candidate is still actionable

Cannot:

- view unrelated emergencies
- accept after the request is already assigned or closed
- see private data from other candidates

### Admin

Can:

- view all requests
- force reassignment
- close a broken request if needed

## Error handling

Map domain failures to explicit API responses:

- `forbidden` -> `403`
- `not-found` -> `404`
- `invalid-request` -> `400`
- `invalid-state` -> `422`
- `invalid-address` -> `422`
- `invalid-category` -> `422`
- `invalid-contractor` -> `422`

Do not return vague failures for expected domain errors.

## Testing

Minimum coverage for this slice:

- unit tests for candidate selection
- unit tests for accept, ignore, timeout, cancel, and reassign transitions
- permission tests for client, contractor, and admin access
- OpenAPI tests for the new endpoints
- database tests for the new tables and enum values
- Playwright smoke for client creation and initial state visibility

## Implementation notes

- Keep the matching logic in `src/lib/emergencies.ts`.
- Keep server-side permission checks centralized.
- Use audit logging for every sensitive state transition.
- Keep the database as the source of truth for dispatch state.
- Avoid tying urgent flow to chat or files in this slice.

## Exit criteria

This slice is done when:

- a client can create an urgent request
- compatible contractors can accept or ignore it
- the request times out and can be re-dispatched
- admin can force reassignment
- OpenAPI and tests cover the new endpoints
- `npm run build` passes
