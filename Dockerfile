# Multi-stage production Dockerfile for Fredrik Bot
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native dependencies and build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production runner image
FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data 2>/dev/null || true

# Pre-create session and data directory
RUN mkdir -p session data

EXPOSE 3000

CMD ["npm", "start"]
