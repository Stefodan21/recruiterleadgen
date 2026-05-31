# -----------------------------
# Stage 1 — Build Rust binary
# -----------------------------
FROM rust:1.75-bookworm AS rust-builder

WORKDIR /app

COPY Cargo.toml .
COPY main.rs .

RUN cargo build --release


# -----------------------------
# Stage 3 — Final runtime image
# -----------------------------
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime deps + Node.js (via NodeSource for current LTS)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy Rust binary
COPY --from=rust-builder /app/target/release/extract_content .

# Copy Node app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY fetch_links.ts tsconfig.json ./

# Copy entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
