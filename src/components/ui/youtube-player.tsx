"use client";

import { useEffect, useRef, useState } from "react";

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

  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube API unavailable"));
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("Failed to load YouTube API"));
      };
      document.body.appendChild(script);
    }
  });

  return apiPromise;
}

function hasMediaConsent(): boolean {
  try {
    const stored = localStorage.getItem("cookie-consent");

    if (!stored) return false;

    const consent = JSON.parse(stored);

    return consent?.media === true;
  } catch {
    return false;
  }
}

type YouTubePlayerProps = {
  videoId: string;
  title: string;
};

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mediaConsent, setMediaConsent] = useState(false);

  useEffect(() => {
    const updateConsent = () => {
      setMediaConsent(hasMediaConsent());
    };

    updateConsent();

    window.addEventListener("cookie-consent-updated", updateConsent);

    window.addEventListener("storage", updateConsent);

    return () => {
      window.removeEventListener("cookie-consent-updated", updateConsent);

      window.removeEventListener("storage", updateConsent);
    };
  }, []);

  useEffect(() => {
    if (!mediaConsent) return;

    let active = true;
    let player: YouTubePlayerInstance | null = null;

    loadYouTubeAPI()
      .then((YT) => {
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
      })
      .catch((error) => {
        console.error("YouTube player error:", error);
      });

    return () => {
      active = false;

      if (player) {
        players.delete(player);
        player.destroy();
      }
    };
  }, [videoId, mediaConsent]);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      role="group"
      aria-label={`YouTube player for ${title}`}
    >
      {mediaConsent ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-sm text-sm text-white/70">
            Enable third-party media to watch this video.
          </p>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("open-cookie-settings"));
            }}
            className="rounded-full border border-white/25 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 cursor-pointer"
          >
            Cookie Settings
          </button>
        </div>
      )}
    </div>
  );
}
