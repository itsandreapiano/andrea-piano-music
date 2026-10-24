"use client";

import { useEffect, useRef } from "react";

type PlayerStateEvent = {
  data: number;
  target: YouTubePlayerInstance;
};

type YouTubePlayerInstance = {
  pauseVideo: () => void;
  destroy: () => void;
};

type YouTubeAPI = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number | string>;
      events: {
        onStateChange: (event: PlayerStateEvent) => void;
      };
    },
  ) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const players = new Set<YouTubePlayerInstance>();

let apiPromise: Promise<YouTubeAPI> | null = null;

function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) {
        resolve(window.YT);
      }
    };

    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return apiPromise;
}

type YouTubePlayerProps = {
  videoId: string;
  title: string;
};

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let player: YouTubePlayerInstance | null = null;

    loadYouTubeAPI().then((YT) => {
      if (!active || !containerRef.current) return;

      player = new YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 1,
          rel: 0,
          playsinline: 1,
          fs: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event) => {
            // YouTube state 1 = playing
            if (event.data === 1) {
              players.forEach((other) => {
                if (other !== event.target) {
                  other.pauseVideo();
                }
              });
            }
          },
        },
      });

      players.add(player);
    });

    return () => {
      active = false;

      if (player) {
        players.delete(player);
        player.destroy();
      }
    };
  }, [videoId]);

  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-xl bg-black"
      role="group"
      aria-label={`YouTube player for ${title}`}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
