# Build stage
FROM oven/bun:1.2.11 as builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src src
COPY tsconfig.json tsconfig.json
RUN bun run build

# Run stage
FROM oven/bun:1.2.11
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY --from=builder /app/dist ./dist
CMD ["bun", "start"]
