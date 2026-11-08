# Student Schedule API

Small NestJS API for subjects and time-zone-aware class events.

## Prerequisites

- Node.js 24 or newer.
- pnpm 12.18.0 through Corepack.
- Docker Compose for the zero-manual-setup path, or PostgreSQL 16 locally.

## Run from scratch

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm prisma generate && pnpm prisma migrate deploy && pnpm db:seed
pnpm start:dev
```

The API listens on `http://localhost:3000`. Scalar documentation is available at `/api-docs`. The seeded test tokens are `token-alice` and `token-bob`.

For the simplest setup, use Docker Compose instead:

```bash
docker compose up --build
```

Compose starts PostgreSQL, applies Prisma migrations, seeds the two test users, and starts the non-root API image.

## Run tests

With PostgreSQL available and `.env` configured:

```bash
npm test
```

The suite covers authentication, user isolation for GET/PATCH/DELETE, invalid event ordering and calendar dates, weekly recurrence, London daylight-saving conversion, the database health endpoint, DTO/service edge cases, response envelopes, and request logging.

## Recurrence

Events may include an inclusive weekly recurrence:

```json
{
  "recurrence": {
    "weekly": {
      "until": "2026-12-18"
    }
  }
}
```

`GET /events` expands occurrences with `occurrenceStart` while preserving the event's local wall-clock time across DST. PATCH and DELETE operate on the complete series. Occurrence-level overrides are not implemented.

## Request IDs and logs

Every response includes `x-request-id`. If the client sends one, it is preserved; otherwise the API generates one. Completed requests emit structured JSON logs containing the request ID, method, path, status, and duration. Sensitive request and response fields are redacted, and large response bodies are truncated.

## CI

`.github/workflows/ci.yml` starts PostgreSQL, applies migrations, seeds users, builds, lints, and runs `npm test`.

## Scope and assumptions

- Authentication is intentionally fixed bearer tokens, as required by the test. No login or registration flow is included.
- Event local wall-clock values are stored separately from their derived UTC instants.
- No real customer data, credentials, or production secrets are included.

## AI tools used

AI assistance was used for requirement analysis, architecture comparison against local reference conventions, implementation planning, and code review. Official NestJS and Prisma documentation were used to verify framework APIs.
