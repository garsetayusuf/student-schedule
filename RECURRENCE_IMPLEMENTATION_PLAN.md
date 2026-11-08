# Weekly Event Recurrence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional weekly recurrence through an inclusive `recurrence.weekly.until` date while preserving local wall-clock time, UTC/DST correctness, user ownership, and series-level PATCH/DELETE semantics.

**Architecture:** An `Event` remains the series template. A nullable `recurrenceUntil` PostgreSQL `DATE` marks a weekly series; non-recurring events keep it null. `GET /events` fetches only the authenticated user's candidate templates, expands weekly dates in memory, recalculates each occurrence's UTC instants in the event's IANA time zone, filters overlap, and returns `occurrenceStart`. PATCH and DELETE continue to address the whole template series.

**Tech Stack:** NestJS, Fastify, Prisma 7, PostgreSQL, Zod, `@js-temporal/polyfill`, Scalar, Vitest.

## Global Constraints

- `recurrence` is optional and only supports `{ weekly: { until: "YYYY-MM-DD" } }`.
- `until` is inclusive and must be a real calendar date on or after the event's local start date.
- Every recurrence query MUST include the authenticated `userId`.
- A recurring event's local start time MUST remain unchanged across daylight-saving transitions.
- `GET /events` MUST return `occurrenceStart` for expanded occurrences and sort by `startUtc`.
- PATCH and DELETE operate on the complete series; occurrence-level overrides are not implemented.
- Invalid recurrence input returns the existing `422 validation_error` envelope.
- Existing non-recurring event behavior and the three mandatory PDF tests MUST remain green.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `prisma/schema.prisma` | Add nullable `recurrenceUntil` to `Event`. |
| `prisma/migrations/<timestamp>_add_event_recurrence/migration.sql` | Prisma-generated schema migration. |
| `src/modules/events/dto/create-event.dto.ts` | Zod recurrence request schema and inferred create type. |
| `src/modules/events/dto/patch-event.dto.ts` | Optional/null recurrence patch schema and inferred patch type. |
| `src/modules/events/dto/event-response.dto.ts` | Recurrence and `occurrenceStart` OpenAPI response schema. |
| `src/modules/events/event-recurrence.ts` | Pure weekly occurrence expansion and date/time calculations. |
| `src/modules/events/events.service.ts` | Persist recurrence, fetch candidates, expand, sort, and map responses. |
| `src/modules/events/events.controller.ts` | Existing routes, unchanged paths, updated DTO types. |
| `test/unit/event-recurrence.spec.ts` | Pure expansion, inclusive until, local-time, and DST tests. |
| `test/unit/events.service.spec.ts` | Series persistence and ownership behavior. |
| `test/schedule.spec.ts` | HTTP recurrence create, list, patch, delete, and validation behavior. |
| `DESIGN.md` | Keep the implemented series-template model and future override limitation accurate. |

## Interfaces

```ts
export interface WeeklyRecurrenceDto {
  weekly: { until: string };
}

export interface RecurrenceResponseDto {
  weekly: { until: string };
}

export interface EventOccurrence {
  occurrenceStart: string;
  startUtc: Date;
  endUtc: Date;
}

export function expandWeeklyOccurrences(
  event: EventTemplate,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
): EventOccurrence[];
```

`EventTemplate` contains `startLocal`, `endLocal`, `timeZone`, and nullable `recurrenceUntil`; the function has no database dependency.

## Task 1: Add recurrence input and persistence

**Files:** `prisma/schema.prisma`, `src/modules/events/dto/create-event.dto.ts`, `src/modules/events/dto/patch-event.dto.ts`, `src/modules/events/events.service.ts`

- [ ] Add `recurrenceUntil DateTime? @map("recurrence_until") @db.Date` to `Event`.
- [ ] Extend the create schema with strict optional `recurrence.weekly.until`; keep all unrelated recurrence shapes rejected.
- [ ] Extend the patch schema with `recurrence` optional and nullable. `null` removes recurrence from the series.
- [ ] Validate `until` with `Temporal.PlainDate.from()` and reject dates before the event's local start date.
- [ ] Persist the date at UTC midnight only as a calendar-date storage value; never use it as an instant for event display.
- [ ] Merge recurrence into the full PATCH object before validation, just like title, subject, start, end, and time zone.
- [ ] Generate and apply the migration only through Prisma:

```bash
pnpm prisma migrate dev --name add_event_recurrence
pnpm prisma generate
```

## Task 2: Implement pure weekly expansion

**Files:** `src/modules/events/event-recurrence.ts`, `src/modules/events/event-time.ts`, `test/unit/event-recurrence.spec.ts`

- [ ] Calculate the template's local wall-clock duration from `startLocal` and `endLocal`.
- [ ] Iterate local calendar dates by seven days from the template start date through inclusive `recurrenceUntil`.
- [ ] For each occurrence, construct local start and end `Temporal.PlainDateTime` values, then call the existing DST-rejecting UTC conversion independently for each occurrence.
- [ ] Return only occurrences whose UTC interval overlaps `[rangeStartUtc, rangeEndUtc)`.
- [ ] Preserve the same local start time before and after London DST changes.
- [ ] Test: until is included; dates after until are excluded; a range with no overlap returns no occurrences; invalid DST wall-clock times reject; the 08:00 London example returns 08:00Z before DST and 07:00Z after DST.

## Task 3: Expand event service responses

**Files:** `src/modules/events/events.service.ts`, `src/modules/events/dto/event-response.dto.ts`, `src/modules/events/events.controller.ts`

- [ ] Fetch candidate events with `where: { userId, startUtc: { lt: rangeEndUtc }, OR: [{ recurrenceUntil: null, endUtc: { gt: rangeStartUtc } }, { recurrenceUntil: { gte: rangeStartLocalDate } }] }`.
- [ ] Keep single-event GET scoped by `{ id, userId }`; return `404` for a series owned by another user.
- [ ] Return one mapped response for a non-recurring event.
- [ ] Return one mapped response per recurring occurrence, preserving the series `id`, title, subject, time zone, recurrence, and adding `occurrenceStart`.
- [ ] Sort the combined result by `startUtc` ascending after expansion.
- [ ] Add `recurrence` and optional `occurrenceStart` to the Scalar response schema.
- [ ] Keep PATCH and DELETE series-level. A patched series expands using the new template values; deleting it removes all future occurrences.

## Task 4: Add HTTP and ownership tests

**Files:** `test/schedule.spec.ts`, `test/unit/events.service.spec.ts`

- [ ] Create a recurring Alice event and assert the response includes the recurrence object.
- [ ] Query a range and assert every expected weekly `occurrenceStart` is present, including the inclusive `until` date.
- [ ] Assert occurrence UTC values across Europe/London DST while local `start` remains 08:00.
- [ ] Assert Bob receives `404` for GET, PATCH, and DELETE using the recurring series ID.
- [ ] Assert invalid, prior, and unknown recurrence fields return `422`.
- [ ] Assert PATCH changes all expanded series occurrences and DELETE removes the series from future range results.
- [ ] Retain the existing non-recurring tests and all user-scoping assertions.

## Task 5: Update docs and verify

**Files:** `DESIGN.md`, `README.md`

- [ ] State that the current implementation stores recurrence on the event template and expands weekly occurrences at read time.
- [ ] State that PATCH/DELETE are series-level and occurrence overrides remain future work.
- [ ] Document the recurrence request example and `occurrenceStart` response field.
- [ ] Run the complete verification set:

```bash
npm test
npm run build
npm run lint
pnpm exec prettier --check "src/**/*.ts" "test/**/*.ts" "prisma/**/*.ts" "prisma.config.ts" "*.json" "*.yml" "pnpm-workspace.yaml"
```

- [ ] Run the Docker migration and API smoke test when the local container daemon is available.

## Acceptance Checklist

- [ ] Existing mandatory tests remain green.
- [ ] Recurrence request accepts only the specified weekly shape.
- [ ] `until` is inclusive and calendar-valid.
- [ ] Weekly occurrences preserve local wall-clock time across DST.
- [ ] `occurrenceStart` is returned for expanded rows.
- [ ] Ownership is enforced for series reads and mutations.
- [ ] Series PATCH and DELETE behavior is deterministic.
- [ ] Scalar documents recurrence request/response fields and errors.
- [ ] No recurrence implementation uses user-provided IDs without `userId` scope.
