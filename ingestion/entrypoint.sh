#!/bin/sh
set -e

# 1. Fetch the codebase (Go)
./fetch_codebase

# 2. Discover profiles and produce manifest.json (Go)
./discover_profiles > manifest.json

# 3. Extract content (Rust)
cat manifest.json | ./extract_content > raw_profiles.json
