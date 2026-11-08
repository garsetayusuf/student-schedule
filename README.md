# Student Schedule API

Small NestJS API for subjects and time-zone-aware class events.

## Prerequisites

- Node.js 24 or newer.
- pnpm 12.18.0 installed. If Corepack is available, `corepack prepare pnpm@12.18.0 --activate` also works.
- Docker Compose for the zero-manual-setup path, or PostgreSQL 16 locally.

## Run from scratch manually

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
pnpm start:dev
```

The API listens on `http://localhost:8343`. Interactive Scalar/OpenAPI documentation is available at `http://localhost:8343/api-docs`. The seeded test tokens are `token-alice` and `token-bob`.

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

## Request IDs and logs

Every response includes `x-request-id`. If the client sends one, it is preserved; otherwise the API generates one. Completed requests emit structured JSON logs containing the request ID, method, path, status, and duration. Sensitive request and response fields are redacted, and large response bodies are truncated.

## CI

`.github/workflows/ci.yml` starts PostgreSQL, applies migrations, seeds users, builds, lints, and runs `npm test`.

## Assumptions

- Authentication uses the seeded fixed bearer tokens required by the test.
- No login or registration flow is included.
- PostgreSQL is the source of truth.
- Event local wall-clock values are stored separately from their derived UTC instants.
- No real customer data, credentials, or production secrets are included.

## What I Would Build Next

- Parent schedule access with explicit student approval and revocation.
- A durable premium entitlement pipeline for Stripe and RevenueCat webhooks.
- Rate limiting, metrics, database backups, and production alerting.

## Repository

https://github.com/garsetayusuf/student-schedule.git

## Live API

https://student-schedule.seri.my.id

## API Documentation

https://student-schedule.seri.my.id/api-docs

## AI Tools Used

Oh My Pi was used for requirement analysis, architecture planning, implementation review, test coverage planning, and documentation drafting. Official NestJS and Prisma documentation were used to verify framework and ORM APIs.
