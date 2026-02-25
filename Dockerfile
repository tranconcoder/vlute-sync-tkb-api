# Stage 1: Installer
FROM oven/bun:1 AS installer
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Assuming 'bun run bundle' outputs to a 'dist' folder or similar.
# We copy the built files and production dependencies.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
# If you bundle dependencies, you might not need node_modules. 
# Included here just in case.
COPY --from=installer /app/node_modules ./node_modules

EXPOSE 3000

# Start the application
CMD ["bun", "run", "dist/main.js"]
