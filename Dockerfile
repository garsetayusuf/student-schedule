FROM node:24-alpine AS base
WORKDIR /app
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/student_schedule?schema=public
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate && pnpm run build

FROM base AS migrator
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm exec tsx prisma/seed.ts"]

FROM base AS production-dependencies
RUN pnpm prune --prod

FROM node:24-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY package.json ./
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]
