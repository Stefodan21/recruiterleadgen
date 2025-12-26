FROM node:20-slim

WORKDIR /app

# Install system dependencies for pg (SSL)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package.json package-lock.json* ./

RUN npm install --production=false

# Copy the TypeScript exporters
COPY to_csv.ts .
COPY to_db.ts .
COPY to_airtable.ts .

# Default command does nothing — CI will specify the script
CMD ["node"]
