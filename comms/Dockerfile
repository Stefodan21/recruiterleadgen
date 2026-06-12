FROM node:20-slim
WORKDIR /app

# Copy package files and install all dependencies (including dev deps like ts-node)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source files
COPY . .

# Default command: run TypeScript entry directly using ts-node (must be installed as a dependency/devDependency)
CMD ["npm", "run", "start"]
