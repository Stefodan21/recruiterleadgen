FROM node:18-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:18-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
ENV NODE_ENV=production
RUN npm prune --production || true
CMD ["node", "dist/index.js"]
