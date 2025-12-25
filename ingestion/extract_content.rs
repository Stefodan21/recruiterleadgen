use std::fs;
use std::io::{self, Read};
use serde::{Serialize, Deserialize};
use regex::Regex;

// -----------------------------
// Data Structures
// -----------------------------

#[derive(Deserialize)]
struct Manifest {
    profiles: Vec<ProfileFile>,
}

#[derive(Deserialize)]
struct ProfileFile {
    url: String,
    file_path: String,
    #[serde(rename = "type")]
    file_type: String,
}

#[derive(Serialize)]
struct RawProfile {
    url: String,
    text: String,
}

// -----------------------------
// HTML Extraction
// -----------------------------

fn extract_text_from_html(path: &str) -> String {
    let html = fs::read_to_string(path).unwrap_or_default();

    // Remove tags
    let re_tags = Regex::new(r"<[^>]+>").unwrap();
    let no_tags = re_tags.replace_all(&html, " ");

    // Collapse whitespace
    let re_ws = Regex::new(r"\s+").unwrap();
    let cleaned = re_ws.replace_all(&no_tags, " ");

    cleaned.trim().to_string()
}

// -----------------------------
// PDF Extraction (stub)
// -----------------------------

fn extract_text_from_pdf(path: &str) -> String {
    // Placeholder — you can plug in pdf-extract or lopdf later
    format!("PDF extraction not implemented for {}", path)
}

// -----------------------------
// DOCX Extraction (stub)
// -----------------------------

fn extract_text_from_docx(path: &str) -> String {
    // Placeholder — you can plug in docx-rs or zip crate later
    format!("DOCX extraction not implemented for {}", path)
}

// -----------------------------
// Main Pipeline
// -----------------------------

fn main() {
    // Read manifest.json from stdin
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();

    let manifest: Manifest = serde_json::from_str(&input).unwrap();

    let mut results = Vec::new();

    for file in manifest.profiles {
        let text = match file.file_type.as_str() {
            "resume_pdf" => extract_text_from_pdf(&file.file_path),
            "resume_docx" => extract_text_from_docx(&file.file_path),
            "readme" | "public_dir" | "docs_dir" | "about_dir" | "cv_dir" => {
                extract_text_from_html(&file.file_path)
            }
            _ => String::new(),
        };

        results.push(RawProfile {
            url: file.url,
            text,
        });
    }

    // Output raw_profiles.json to stdout
    println!("{}", serde_json::to_string_pretty(&results).unwrap());
}
