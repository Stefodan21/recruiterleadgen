FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENTRYPOINT []

CMD ["npx", "ts-node", "main.ts"]
