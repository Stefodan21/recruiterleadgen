// link_collector.ts
import fs from "fs";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";



// No per-host cap; emit everything we find.
const MAX_PER_HOST = Infinity;
const s3accesskeyid = process.env.S3_ACCESS_KEY_ID;
const s3secretaccesskey = process.env.S3_SECRET_ACCESS_KEY;
const s3SeenBucket = process.env.S3_SEEN_BUCKET;
const s3SeenKey = process.env.S3_SEEN_KEY ?? "profile_links.json";

const canUseS3 = Boolean(s3accesskeyid && s3secretaccesskey && s3SeenBucket);
const localSeenPath = path.join(process.cwd(), process.env.LOCAL_SEEN_FILE ?? "seen_local.json");

const client = new S3Client({
  forcePathStyle: true,
  region: 'us-east-1',
  endpoint: 'https://iijngbyiamyqmsgylgui.storage.supabase.co/storage/v1/s3',
  credentials: s3accesskeyid && s3secretaccesskey
    ? {
        accessKeyId: s3accesskeyid,
        secretAccessKey: s3secretaccesskey,
      }
    : undefined,
  requestHandler: new NodeHttpHandler({
    requestTimeout: 30000, // 30 seconds
  }),
});


interface S3Object {
  Bucket: string;
  Key: string;
}

const seenObject: S3Object | null = s3SeenBucket
  ? {
      Bucket: s3SeenBucket,
      Key: s3SeenKey,
    }
  : null;

// ---------------------------------------------
// Load persistent seen URLs from S3
// ---------------------------------------------
async function loadSeen(s3Object: S3Object | null): Promise<Set<string>> {
  // Prefer S3 when credentials and bucket are provided; otherwise fall back to local file
  if (canUseS3 && s3Object) {
    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: s3Object.Bucket,
          Key: s3Object.Key,
        })
      );

      const body = await response.Body?.transformToString();
      if (!body) {
        console.info('S3 seen object empty — starting with empty seen set');
        return new Set<string>();
      }

      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed)) {
        console.warn('S3 seen object did not contain an array — ignoring');
        return new Set<string>();
      }

      return new Set<string>(parsed.filter((item): item is string => typeof item === "string"));
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === "NoSuchKey") {
        console.info('S3 seen key not found — starting with empty seen set');
        return new Set<string>();
      }

      console.warn(`Failed to load seen links from S3, falling back to local file: ${error instanceof Error ? error.message : "unknown error"}`);
      // fall through to local fallback
    }
  }

  // Local fallback
  try {
    if (!fs.existsSync(localSeenPath)) return new Set<string>();
    const body = fs.readFileSync(localSeenPath, "utf8");
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(parsed.filter((item): item is string => typeof item === "string"));
  } catch (err) {
    console.warn('Failed to load local seen file — starting with empty set', err instanceof Error ? err.message : err);
    return new Set<string>();
  }
}

// ---------------------------------------------
// Save updated seen URLs
// ---------------------------------------------
async function saveSeen(seen: Set<string>, s3Object: S3Object | null): Promise<void> {
  if (canUseS3 && s3Object) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: s3Object.Bucket,
          Key: s3Object.Key,
          Body: JSON.stringify([...seen]),
          ContentType: "application/json",
        })
      );
      return;
    } catch (error) {
      console.warn(`Failed to save seen links to S3, will fall back to local file: ${error instanceof Error ? error.message : "unknown error"}`);
      // fall through to local fallback
    }
  }

  // Local fallback
  try {
    fs.writeFileSync(localSeenPath, JSON.stringify([...seen], null, 2), "utf8");
  } catch (err) {
    throw new Error(`Failed to save seen links to local file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ---------------------------------------------
// Local helpers
// ---------------------------------------------
function extractUrls(data: any): string[] {
  if (!data) return [];

  const urls: string[] = [];

  if (Array.isArray((data as any).results)) {
    urls.push(...(data as any).results.map((r: any) => r.url || r.link).filter(Boolean));
  }

  if (Array.isArray((data as any).items)) {
    urls.push(...(data as any).items.map((r: any) => r.link || r.url).filter(Boolean));
  }

  return urls;
}

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function boisFilter(url: string): boolean {
  const BLOCKED = [
    "wix.com",
    "arc.dev",
    "hire",
    "jobs",
    "wordpress.com",
    "blogspot.com",
    "medium.com",
    "template",
    "agency",
    "marketing",
    "shop",
    "store",
    "ecommerce"
  ];

  const lower = url.toLowerCase();
  return !BLOCKED.some(b => lower.includes(b));
}

// ---------------------------------------------
// MAIN FUNCTION — persistent dedupe
// ---------------------------------------------
export async function collectLinks(output: any): Promise<string[]> {
  const seen = await loadSeen(seenObject); // persistent dedupe memory
  const freshLinks: string[] = [];
  const entries = Array.isArray(output) ? output : [output];

  for (const entry of entries) {
    const urls = extractUrls(entry);

    const cleaned = urls
      .map(normalizeUrl)
      .filter((url): url is string => url !== null)
      .filter(boisFilter);

    const unique = Array.from(new Set(cleaned));
    const limited = unique.slice(0, MAX_PER_HOST);

    for (const url of limited) {
      if (!seen.has(url)) {
        freshLinks.push(url);
        seen.add(url);
      }
    }
  }

  // Save updated seen list
  await saveSeen(seen, seenObject);

  // Write artifact for ingestion
  fs.writeFileSync(
    path.join(process.cwd(), "new_links.json"),
    JSON.stringify(freshLinks, null, 2)
  );


  return freshLinks;
}
