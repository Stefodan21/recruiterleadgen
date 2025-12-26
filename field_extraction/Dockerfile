# ------------------------------------------------------------
# Stage 1: Build Rust binaries
# ------------------------------------------------------------
FROM rust:1.80-slim AS builder

WORKDIR /app

# Copy Cargo manifest first for dependency caching
COPY Cargo.toml Cargo.lock ./

# Create dummy src to build deps
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies only (cached unless Cargo.toml changes)
RUN cargo build --release || true

# Now copy actual source
COPY src ./src

# Build real binaries
RUN cargo build --release

# ------------------------------------------------------------
# Stage 2: Runtime image
# ------------------------------------------------------------
FROM debian:bookworm-slim

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/target/release/extract_contact /usr/local/bin/extract_contact
COPY --from=builder /app/target/release/map_fields /usr/local/bin/map_fields

# Default command (overridden by entrypoint.sh in final pipeline)
CMD ["bash"]
