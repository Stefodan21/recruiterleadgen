# -----------------------------
# Stage 1 — Build Go binaries
# -----------------------------
FROM golang:1.22-bookworm AS go-builder

WORKDIR /app

# Copy Go files
COPY fetch_codebase.go .
COPY discover_profiles.go .
COPY go.mod .

# Build each Go file as its own binary
RUN go build -o fetch_codebase fetch_codebase.go
RUN go build -o discover_profiles discover_profiles.go


# -----------------------------
# Stage 2 — Build Rust binary
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

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Go binaries
COPY --from=go-builder /app/fetch_codebase .
COPY --from=go-builder /app/discover_profiles .

# Copy Rust binary
COPY --from=rust-builder /app/target/release/extract_content .

# Install Node.js for fetch_links.ts
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy Node app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY fetch_links.ts tsconfig.json ./

# Copy entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
