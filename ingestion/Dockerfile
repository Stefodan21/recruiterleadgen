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
# Stage 2 — Build Rust binaries
# -----------------------------
FROM rust:1.75-bookworm AS rust-builder

WORKDIR /app

# Copy Rust extractor
COPY extract_content.rs .

# Build Rust binary
RUN rustc extract_content.rs -o extract_content


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
COPY --from=rust-builder /app/extract_content .

# Copy entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
