# DESIGN

## 1. Data model

Prisma models are `User`, `ApiToken`, `Subject`, and `Event`. A subject belongs to one user. An event belongs to one user and may reference one of that user's subjects. Every service query includes the authenticated `userId`, so another user's record returns `404` rather than revealing that it exists. Events store `startLocal` and `endLocal` as PostgreSQL `timestamp without time zone`, plus an IANA `timeZone`. `startUtc` and `endUtc` are calculated `timestamptz` values used for ordering and range queries. This preserves an 08:00 local class across DST changes. For recurrence, add an event-series record and per-occurrence overrides; editing one occurrence creates an override, while editing future occurrences splits the series.

## 2. Subscriptions

Keep one `StudentEntitlement` record per student as the application's answer to “is this student premium?”. Webhook handlers for Stripe and RevenueCat first store a receipt with the provider name and provider event ID. A unique constraint on those fields makes repeated deliveries harmless. In one transaction, a new receipt updates the student's entitlement status and expiry only when it is newer than the stored provider update time. Older, late webhooks are recorded but do not overwrite newer state. Application code checks only `StudentEntitlement`, never provider-specific webhook tables. If processing fails, the stored receipt can be retried safely because the entitlement update is idempotent.

## 3. Running on AWS + Kubernetes

Build a non-root API image and publish it to ECR. Run the API as an EKS Deployment and PostgreSQL on RDS in private subnets. Store `DATABASE_URL` and other secrets in AWS Secrets Manager, then inject them into pods through Kubernetes secrets. Run `prisma migrate deploy` as one Kubernetes Job before rolling out the new API version. Use backward-compatible migrations: add columns first, deploy code that supports both shapes, then remove old columns in a later release. The first alerts are: sustained HTTP 5xx responses, high p95 request latency, and failed database health checks or exhausted database connections.

## 4. Parent access

Add a `ScheduleAccess` table with `parentUserId`, `studentUserId`, `grantedAt`, and nullable `revokedAt`; the parent-student pair is unique. A student creates a grant for a parent and may revoke it at any time. Parent schedule reads require an active grant in the same query as the child schedule lookup: the parent ID must match the authenticated user, the student ID must match the requested child, and `revokedAt` must be null. No endpoint accepts a parent-provided user ID without this predicate. Missing, revoked, or unrelated grants return `404`, so a parent cannot discover another student's data.