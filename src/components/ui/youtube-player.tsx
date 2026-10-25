"use client";

import { useEffect, useRef, useState } from "react";
import { getCookieConsent } from "@/components/CookieBanner";
import { trackMediaEvent } from "@/lib/mediaAnalytics";

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
        apiPromise = null;
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

type YouTubePlayerProps = {
  videoId: string;
  title: string;
};

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mediaConsent, setMediaConsent] = useState(false);

  useEffect(() => {
    const updateConsent = () => {
      setMediaConsent(getCookieConsent()?.media === true);
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

    // Track only one play per playback session.
    let playReported = false;

    const handleAnalyticsConsentChange = () => {
      // Revoking Analytics consent resets the tracking session.
      // It does not interrupt video playback.
      if (getCookieConsent()?.analytics !== true) {
        playReported = false;
      }
    };

    window.addEventListener(
      "cookie-consent-updated",
      handleAnalyticsConsentChange,
    );

    window.addEventListener("storage", handleAnalyticsConsentChange);

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
              if (!active) return;

              // YouTube state 1 = PLAYING
              if (event.data === 1) {
                // Pause other YouTube players.
                players.forEach((other) => {
                  if (other !== event.target) {
                    other.pauseVideo();
                  }
                });

                // Track the first play of the current session.
                if (!playReported && getCookieConsent()?.analytics === true) {
                  trackMediaEvent("video_play", {
                    title,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    videoId,
                  });

                  playReported = true;
                }
              }

              // YouTube state 0 = ENDED
              // A replay starts a new playback session.
              if (event.data === 0) {
                playReported = false;
              }
            },
          },
        });

        players.add(player);
      })
      .catch((error) => {
        if (!active) return;

        console.error("YouTube player error:", error);
      });

    return () => {
      active = false;

      window.removeEventListener(
        "cookie-consent-updated",
        handleAnalyticsConsentChange,
      );

      window.removeEventListener("storage", handleAnalyticsConsentChange);

      if (player) {
        players.delete(player);
        player.destroy();
      }
    };
  }, [videoId, title, mediaConsent]);

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
