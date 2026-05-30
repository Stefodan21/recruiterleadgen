use std::fs;
use std::io::{self, Read};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Profile {
    url: String,
    file_path: String,
    #[serde(rename = "type")]
    file_type: String,
}

#[derive(Deserialize)]
struct Manifest {
    profiles: Vec<Profile>,
}

#[derive(Serialize)]
struct RawProfile {
    url: String,
    text: String,
}

fn extract_html(path: &str) -> String {
    let html = match fs::read_to_string(path) {
        Ok(s) => s,
        Err(_) => return String::new(),
    };

    let mut result = String::new();
    let mut in_tag = false;
    let mut in_script = false;
    let mut in_style = false;
    let mut tag_buf = String::new();

    for c in html.chars() {
        if in_tag {
            if c == '>' {
                in_tag = false;
                let name = tag_buf.trim().to_lowercase();
                match name.as_str() {
                    "script"  => in_script = true,
                    "/script" => in_script = false,
                    "style"   => in_style = true,
                    "/style"  => in_style = false,
                    _ => {}
                }
                tag_buf.clear();
                result.push(' ');
            } else if tag_buf.len() < 16 && (c.is_alphanumeric() || c == '/' || c == '!') {
                tag_buf.push(c);
            }
        } else if c == '<' {
            in_tag = true;
            tag_buf.clear();
        } else if !in_script && !in_style {
            result.push(c);
        }
    }

    // Collapse whitespace
    let mut out = String::new();
    let mut last_space = true;
    for c in result.chars() {
        if c.is_whitespace() {
            if !last_space { out.push(' '); last_space = true; }
        } else {
            out.push(c);
            last_space = false;
        }
    }

    out.replace("&amp;",  "&")
       .replace("&lt;",   "<")
       .replace("&gt;",   ">")
       .replace("&quot;", "\"")
       .replace("&apos;", "'")
       .replace("&#39;",  "'")
       .replace("&nbsp;", " ")
       .trim()
       .to_string()
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).expect("Failed to read stdin");

    let manifest: Manifest = serde_json::from_str(&input).expect("Failed to parse manifest");

    let results: Vec<RawProfile> = manifest.profiles.into_iter().map(|p| {
        let text = match p.file_type.as_str() {
            "resume_pdf"  => format!("[PDF not implemented: {}]", p.file_path),
            "resume_docx" => format!("[DOCX not implemented: {}]", p.file_path),
            _             => extract_html(&p.file_path),
        };
        RawProfile { url: p.url, text }
    }).collect();

    println!("{}", serde_json::to_string_pretty(&results).expect("Failed to serialize"));
}
