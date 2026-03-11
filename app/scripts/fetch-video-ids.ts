/**
 * Fetches YouTube video IDs for all exercise demoSearch queries.
 * Generates src/data/video-map.json.
 *
 * Usage: YOUTUBE_API_KEY=... npx tsx scripts/fetch-video-ids.ts
 *
 * Rate: 100ms between calls. ~222 queries fits YouTube free tier (10,000 units/day, search = 100 units each).
 */

import { exercises } from '../src/data/exercises';
import { warmupExercises } from '../src/data/warmup-exercises';
import { beginnerMovements, intermediateMovements, advancedMovements } from '../src/data/wod-formats';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error('Set YOUTUBE_API_KEY env variable');
  process.exit(1);
}

interface VideoEntry {
  videoId: string;
  title: string;
  channelTitle: string;
  scrapedAt: string;
}

type VideoMap = Record<string, VideoEntry>;

// Collect all unique demoSearch queries
function collectQueries(): string[] {
  const queries = new Set<string>();

  for (const ex of exercises) {
    if (ex.demoSearch) queries.add(ex.demoSearch);
  }
  for (const w of warmupExercises) {
    if (w.demoSearch) queries.add(w.demoSearch);
  }
  for (const m of [...beginnerMovements, ...intermediateMovements, ...advancedMovements]) {
    if (m.demoSearch) queries.add(m.demoSearch);
  }

  return Array.from(queries).sort();
}

async function searchYouTube(query: string): Promise<VideoEntry | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key', API_KEY!);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      console.error(`  API error for "${query}": ${res.status} ${text.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  Fetch error for "${query}":`, err);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const queries = collectQueries();
  console.log(`Found ${queries.length} unique demoSearch queries`);

  const outPath = path.join(__dirname, '..', 'src', 'data', 'video-map.json');

  // Load existing map if present (incremental updates)
  let videoMap: VideoMap = {};
  if (fs.existsSync(outPath)) {
    videoMap = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    console.log(`Loaded existing map with ${Object.keys(videoMap).length} entries`);
  }

  // Only fetch missing queries
  const missing = queries.filter(q => !videoMap[q]);
  console.log(`${missing.length} queries need fetching`);

  for (let i = 0; i < missing.length; i++) {
    const query = missing[i];
    process.stdout.write(`[${i + 1}/${missing.length}] "${query}" ... `);

    const entry = await searchYouTube(query);
    if (entry) {
      videoMap[query] = entry;
      console.log(`OK (${entry.videoId})`);
    } else {
      console.log('SKIP');
    }

    // Rate limit
    if (i < missing.length - 1) await sleep(100);
  }

  // Sort keys for stable output
  const sorted: VideoMap = {};
  for (const key of Object.keys(videoMap).sort()) {
    sorted[key] = videoMap[key];
  }

  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(sorted).length} entries to ${outPath}`);
}

main().catch(console.error);
