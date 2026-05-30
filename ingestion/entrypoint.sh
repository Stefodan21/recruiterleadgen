#!/bin/sh
set -e

# 1. Fetch profile pages and download resumes, output raw_profiles.json
npx ts-node fetch_links.ts

# 2. Discover profiles and produce manifest.json (Go)
./discover_profiles > manifest.json

# 3. Extract text content from downloaded files (Rust)
cat manifest.json | ./extract_content > raw_profiles.json
