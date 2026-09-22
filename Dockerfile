# Multi-stage production Dockerfile for Fredrik Bot
FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive

# Install build essentials for native addons
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build

# Production runner image
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies (FFmpeg & Python)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Pre-create session and data directory
RUN mkdir -p session data

EXPOSE 3000

CMD ["npm", "start"]
