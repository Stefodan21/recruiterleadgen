#!/bin/sh
set -e

# 1. Fetch profile pages and download resumes, writes manifest.json
npx ts-node fetch_links.ts

# 2. Extract text content from downloaded files (Rust)
cat manifest.json | ./extract_content > raw_profiles.json
