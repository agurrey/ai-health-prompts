'use client';

import { useState } from 'react';
import { getVideoThumbnail, getVideoId } from '@/lib/video';

interface VideoPlayerProps {
  demoSearch: string;
  name: string;
}

export default function VideoPlayer({ demoSearch, name }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = getVideoThumbnail(demoSearch);
  const videoId = getVideoId(demoSearch);

  if (!videoId) {
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(demoSearch)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-zinc-900 flex items-center justify-center"
      >
        <img src="/exercise-placeholder.svg" alt={name} className="w-full h-full object-cover" />
      </a>
    );
  }

  if (playing) {
    return (
      <div className="relative aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={name}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="block relative aspect-video bg-zinc-900 w-full cursor-pointer group"
    >
      {thumbnail ? (
        <img src={thumbnail} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <img src="/exercise-placeholder.svg" alt={name} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
    </button>
  );
}
