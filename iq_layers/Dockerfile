# Build stage
FROM node:20 AS build
WORKDIR /app

# Copy package files and install dev dependencies to build TypeScript
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# Runtime image
FROM node:18-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
ENV NODE_ENV=production
# prune dev deps if any (best-effort)
RUN npm prune --production || true

# Default command - adjust to your actual entrypoint
CMD ["node", "dist/main.js"]
