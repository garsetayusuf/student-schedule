# Student Schedule API

Small NestJS API for subjects and time-zone-aware class events.

## Run locally

```bash
cp .env.example .env
pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm db:seed
pnpm start:dev
```

The API listens on `http://localhost:3000`. Scalar documentation is available at `/api-docs`. The seeded test tokens are `token-alice` and `token-bob`.

## Run tests

Start PostgreSQL with the values in `.env`, then run:

```bash
npm test
```

The suite covers authentication, user isolation for GET/PATCH/DELETE, invalid event ordering, London daylight-saving conversion, the database health endpoint, DTO/service edge cases, response envelopes, and request logging.

## Docker

```bash
docker compose up --build
```

Compose starts PostgreSQL, applies Prisma migrations, seeds the two test users, and starts the non-root API image.

## Request IDs and logs

Every response includes `x-request-id`. If the client sends one, it is preserved; otherwise the API generates one. Completed requests emit structured JSON logs containing the request ID, method, path, status, and duration.

## CI

`.github/workflows/ci.yml` starts PostgreSQL, applies migrations, seeds users, builds, lints, and runs `npm test`.

## Scope and assumptions

- Authentication is intentionally fixed bearer tokens, as required by the test.
- Recurrence is documented in `DESIGN.md` but is not implemented because it is marked stretch work.
- Event local wall-clock values are stored separately from their derived UTC instants.
- No real customer data, credentials, or production secrets are included.

## AI tools used

AI assistance was used for requirement analysis, architecture comparison against the local reference conventions, implementation planning, and code review. Official NestJS and Prisma documentation were used to verify framework APIs.
