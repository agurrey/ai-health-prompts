import videoMap from '@/data/video-map.json';

const map = videoMap as Record<string, { videoId: string; title: string; channelTitle: string; scrapedAt: string }>;

export function getVideoThumbnail(demoSearch: string): string | null {
  const entry = map[demoSearch];
  if (!entry) return null;
  return `https://img.youtube.com/vi/${entry.videoId}/mqdefault.jpg`;
}

export function getVideoId(demoSearch: string): string | null {
  return map[demoSearch]?.videoId ?? null;
}

export function getVideoUrl(demoSearch: string): string | null {
  const id = getVideoId(demoSearch);
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}
