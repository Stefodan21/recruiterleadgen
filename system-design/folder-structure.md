
recruiterleadgen/
│
├── .github/
│   └── workflows/
│       └── pipeline.yml          # CI orchestration (artifacts + caching)
│                                 # Jobs: Search → Ingestion → Deduplication → Field Extraction → Export
│
├── search/                       # Step 1: Boolean query + portfolio discovery
│   ├── bool_query.ts             # TypeScript → build recruiter Boolean strings with site filters (vercel, s3, github.io, etc)
│   │                             # Generates batch Boolean queries per hosting service for discovery
│   │                             # Strong typing + async/await for clean query generation
│   │
│   ├── crawler.ts                # TypeScript → executes queries against search engine APIs (Google/Bing)
│   │                             # Runs queries in parallel to speed up discovery
│   │                             # Light retry logic for occasional network hiccups
│   ├── link_collector.ts         # TypeScript → aggregates ~100–200 candidate profile root links per batch query set
│   │                             # Deduplicates + normalizes results, outputs profile_links.json
│   │                             # Output: profile_links.json (artifact for ingestion stage)
│   │
│   ├── Dockerfile                # Base: node:20-alpine → lightweight Node.js runtime → stable networking, SSL/DNS
│   │                             # Workload: network-heavy, CPU-light
│   │                             
│   └── package.json              # Dependencies: axios, node-fetch, typescript, ts-node, logging libs
│
│
│
├── ingestion/
│   ├── fetch_codebase.go         # Go → clone repos / download site bundles (zip/tar/html)
│   │                             # Handles retrieval: network + disk I/O heavy
│   │                             # Uses goroutines for concurrent downloads
│   │
│   ├── discover_profiles.go      # Go → locate candidate files (resume.*, README.*, about.*, /public/, /docs/)
│   │                             # Scans repo/file structures to identify potential resume/profile sources
│   │                             # Outputs list of raw files for parsing
│   │
│   ├── extract_content.rs        # Rust → parse HTML/DOCX/PDF into normalized text blobs
│   │                             # Regex + text cleaning, memory-safe normalization
│   │                             # Converts raw files into structured text
│   │                             # Outputs raw_profiles.json
│   │
│   ├── Dockerfile                # Multi-stage build:
│   │                             # Base: Debian Bookworm Slim
│   │                             # 1. Build Go binaries (fetch_codebase, discover_profiles)
│   │                             # 2. Build Rust binaries (extract_content, deduplicate)
│   │                             # 3. Copy all binaries into final slim image
│   │                             # Final container runs Go for retrieval, then Rust for parsing/deduplication
│   │
│   ├── entrypoint.sh             # Orchestration script:
│   │                             # 1. Run ./fetch_codebase (Go)
│   │                             # 2. Run ./discover_profiles (Go)
│   │                             # 3. Run ./extract_content (Rust)
│   │                             # 4. Run ./deduplicate (Rust, parallel hashing)
│   │                             # Produces unique_profiles.json
│   │
│   ├── go.mod                    # Go module definition for dependencies (net/http, os, archive/zip, encoding/json)
│   │
│   ├── Cargo.toml                # Rust crate definition for dependencies (regex, serde_json, sha2, blake3, rayon)
│   │
│   └── deduplicate.rs            # Rust → deduplication stage
│                                 # CPU-heavy: optimized hashing + parallel comparison
│                                 # Uses rayon for parallel hashing across CPU cores
│                                 # Hashes normalized profiles, collapses duplicates
│                                 # Outputs unique_profiles.json
│
│
├── field_extraction/             # Step 4: Pull structured candidate fields
│   ├── extract_contact.rs        # Rust → regex-based extraction: LinkedIn, GitHub, email, phone
│   │                             # Memory-safe, blazing fast regex parsing
│   ├── map_fields.rs             # Rust → map into defined DB fields
│   ├── Dockerfile                # Base: rust:1.80-slim → regex crate, serde for JSON
│   └── Cargo.toml                # Dependencies: regex, serde_json
│
├── export/                       # Step 5: Save structured results
│   ├── to_csv.ts                 # TypeScript → export to CSV
│   ├── to_db.ts                  # TypeScript → export to DB (PostgreSQL, SQLite)
│   ├── to_airtable.ts            # TypeScript → append/update records in Airtable table
│   ├── Dockerfile                # Base: node:20-slim → DB drivers + API calls
│   └── package.json              # Dependencies: pg, sqlite3, airtable npm client
│
├── common/                       # Shared utilities (no business logic)
│   ├── caching.go                # Go → HTTP cache, profile cache, content hash cache
│   ├── hashing.go                # Go → deterministic hashing (stable keys)
│   ├── logging.ts                # TypeScript → structured logs
│   ├── io.py                     # Python → read/write helpers
│   ├── models.rs                 # Rust → typed dataclasses for Candidate, ContactInfo
│   ├── airtable_client.ts        # TypeScript → wrapper for Airtable API (check_seen, update_seen)
│   └── seen_profiles.json/db     # Persistent lookup table of URL → hash mappings
│
├── docs/
│   ├── folder-structure.md       # Folder structure documentation
│   ├── architecture.md           # High-level system design
│   ├── workflow_diagram.png      # Visual pipeline diagram
│   └── data_flow.md              # Artifact hand-off documentation
└── README.md

