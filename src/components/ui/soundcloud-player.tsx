"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { getCookieConsent } from "@/components/CookieBanner";
import { createSongAnalytics } from "@/lib/songAnalytics";

type WaveformData = {
  width: number;
  height: number;
  samples: number[];
};

type SoundCloudWidget = {
  play: () => void;
  pause: () => void;
  seekTo: (milliseconds: number) => void;
  getPosition: (callback: (position: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  bind: (
    event: string,
    callback: (data?: { currentPosition?: number }) => void,
  ) => void;
  unbind: (event: string) => void;
};

type WidgetAPI = {
  (iframe: HTMLIFrameElement): SoundCloudWidget;
  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    FINISH: string;
    PLAY_PROGRESS: string;
    ERROR: string;
  };
};

declare global {
  interface Window {
    SC?: {
      Widget: WidgetAPI;
    };
  }
}

type SoundCloudPlayerProps = {
  trackUrl: string;
  waveformUrl: string;
  title?: string;
  barCount?: number;
};

type ActivePlayer = {
  widget: SoundCloudWidget;
  iframe: HTMLIFrameElement;
  onPause: () => void;
};

const activePlayers = new Set<ActivePlayer>();

let apiPromise: Promise<WidgetAPI> | null = null;

function loadSoundCloudAPI(): Promise<WidgetAPI> {
  if (window.SC?.Widget) {
    return Promise.resolve(window.SC.Widget);
  }

  if (!apiPromise) {
    apiPromise = new Promise<WidgetAPI>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://w.soundcloud.com/player/api.js"]',
      );

      const script = existing ?? document.createElement("script");

      const onLoad = () => {
        if (window.SC?.Widget) {
          resolve(window.SC.Widget);
        } else {
          reject(new Error("SoundCloud Widget API unavailable"));
        }
      };

      const onError = () => {
        reject(new Error("Failed to load SoundCloud Widget API"));
      };

      if (window.SC?.Widget) {
        resolve(window.SC.Widget);
        return;
      }

      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });

      if (!existing) {
        script.src = "https://w.soundcloud.com/player/api.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }).catch((error: unknown) => {
      apiPromise = null;
      throw error;
    });
  }

  return apiPromise;
}

function isIframeAvailable(iframe: HTMLIFrameElement): boolean {
  return iframe.isConnected && iframe.contentWindow !== null;
}

function safelyPause(player: ActivePlayer) {
  if (!isIframeAvailable(player.iframe)) return;

  try {
    player.widget.pause();
  } catch {
    // Ignore errors during iframe teardown.
  }
}

function pauseOtherPlayers(current: ActivePlayer) {
  for (const player of activePlayers) {
    if (player === current) continue;

    if (!isIframeAvailable(player.iframe)) {
      activePlayers.delete(player);
      continue;
    }

    safelyPause(player);
    player.onPause();
  }
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return "0:00";
  }

  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function normalizeWaveform(data: WaveformData, barCount: number): number[] {
  if (!data.samples.length || data.height <= 0) {
    return [];
  }

  return Array.from({ length: barCount }, (_, index) => {
    const start = Math.floor((index / barCount) * data.samples.length);

    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) / barCount) * data.samples.length),
    );

    const segment = data.samples.slice(start, end);

    const average =
      segment.reduce((sum, value) => sum + value, 0) / segment.length;

    const normalized = Math.max(0, Math.min(1, average / data.height));

    const contrast = Math.pow(normalized, 5.3);
    const heightBoost = 1.8;

    return Math.max(3, Math.min(100, contrast * 100 * heightBoost));
  });
}

export default function SoundCloudPlayer({
  trackUrl,
  waveformUrl,
  title = "Audio track",
  barCount = 100,
}: SoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);

  const analyticsRef = useRef<ReturnType<typeof createSongAnalytics> | null>(
    null,
  );

  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const playingRef = useRef(false);
  const timestampRef = useRef(0);

  const draggingRef = useRef(false);
  const dragProgressRef = useRef(0);

  const [mediaConsent, setMediaConsent] = useState(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep media consent synchronized with the cookie banner.
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

  const safeBarCount = Math.max(
    1,
    Math.floor(Number.isFinite(barCount) ? barCount : 100),
  );

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      url: trackUrl,
      auto_play: "false",
      single_active: "false",
      visual: "false",
      show_artwork: "false",
      show_comments: "false",
      show_user: "false",
      hide_related: "true",
      sharing: "false",
      buying: "false",
      download: "false",
    });

    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [trackUrl]);

  const waveform = useMemo(() => {
    if (!waveformData) return [];

    return normalizeWaveform(waveformData, safeBarCount);
  }, [waveformData, safeBarCount]);

  // Load waveform data only after media consent.
  useEffect(() => {
    if (!mediaConsent || !waveformUrl) {
      return;
    }

    const controller = new AbortController();

    fetch(waveformUrl, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Waveform HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: WaveformData) => {
        if (controller.signal.aborted) return;

        if (
          !Array.isArray(data.samples) ||
          !Number.isFinite(data.height) ||
          data.height <= 0
        ) {
          throw new Error("Invalid waveform data");
        }

        setWaveformData(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        console.error("Waveform loading failed:", err);
      });

    return () => controller.abort();
  }, [waveformUrl, mediaConsent]);

  // Initialize SoundCloud and analytics only after media consent.
  useEffect(() => {
    if (!mediaConsent || !trackUrl) {
      return;
    }

    const iframe = iframeRef.current;

    if (!iframe) return;

    let active = true;
    let player: ActivePlayer | null = null;
    let events: WidgetAPI["Events"] | null = null;

    let readyTimer: ReturnType<typeof setInterval> | null = null;

    const analytics = createSongAnalytics({
      title,
      trackUrl,
    });

    analyticsRef.current = analytics;

    loadSoundCloudAPI()
      .then((Widget) => {
        if (!active || !isIframeAvailable(iframe)) {
          return;
        }

        const widget = Widget(iframe);

        player = {
          widget,
          iframe,
          onPause: () => {
            if (!active || !playingRef.current) {
              return;
            }

            analytics.pause();

            positionRef.current = Math.min(
              durationRef.current || Infinity,
              positionRef.current + (performance.now() - timestampRef.current),
            );

            playingRef.current = false;
            setPlaying(false);
            setPosition(positionRef.current);
          },
        };

        events = Widget.Events;
        widgetRef.current = widget;

        activePlayers.add(player);

        const updateDuration = () => {
          if (!active || !isIframeAvailable(iframe)) {
            return;
          }

          widget.getDuration((ms) => {
            if (!active || !Number.isFinite(ms) || ms <= 0) {
              return;
            }

            durationRef.current = ms;
            setDuration(ms);
            setReady(true);
            setError(null);

            if (readyTimer) {
              clearInterval(readyTimer);
              readyTimer = null;
            }
          });
        };

        widget.bind(Widget.Events.READY, updateDuration);

        widget.bind(Widget.Events.PLAY, () => {
          if (!active) return;

          analytics.play();

          playingRef.current = true;
          timestampRef.current = performance.now();

          setPlaying(true);

          if (player) {
            pauseOtherPlayers(player);
          }
        });

        widget.bind(Widget.Events.PAUSE, () => {
          if (!active) return;

          analytics.pause();

          if (playingRef.current) {
            positionRef.current = Math.min(
              durationRef.current || Infinity,
              positionRef.current + (performance.now() - timestampRef.current),
            );
          }

          playingRef.current = false;
          setPlaying(false);
          setPosition(positionRef.current);
        });

        widget.bind(Widget.Events.PLAY_PROGRESS, (data) => {
          if (
            !active ||
            draggingRef.current ||
            typeof data?.currentPosition !== "number"
          ) {
            return;
          }

          positionRef.current = data.currentPosition;
          timestampRef.current = performance.now();

          analytics.progress(data.currentPosition);
        });

        widget.bind(Widget.Events.FINISH, () => {
          if (!active) return;

          analytics.finish();

          playingRef.current = false;
          positionRef.current = 0;
          timestampRef.current = performance.now();

          setPlaying(false);
          setPosition(0);
          setPreviewProgress(null);
        });

        widget.bind(Widget.Events.ERROR, () => {
          if (!active) return;

          analytics.pause();

          playingRef.current = false;
          setPlaying(false);
          setReady(false);

          setError("Unable to play this track.");
        });

        updateDuration();

        readyTimer = setInterval(updateDuration, 500);
      })
      .catch((err: unknown) => {
        if (!active) return;

        console.error("SoundCloud initialization failed:", err);

        setError("Unable to initialize SoundCloud.");
      });

    return () => {
      active = false;

      analytics.destroy();

      if (analyticsRef.current === analytics) {
        analyticsRef.current = null;
      }

      if (readyTimer) {
        clearInterval(readyTimer);
      }

      if (player) {
        activePlayers.delete(player);

        if (events) {
          for (const event of Object.values(events)) {
            try {
              player.widget.unbind(event);
            } catch {
              // Ignore teardown errors.
            }
          }
        }

        safelyPause(player);
      }

      if (player && widgetRef.current === player.widget) {
        widgetRef.current = null;
      }

      playingRef.current = false;
    };
  }, [trackUrl, title, mediaConsent]);

  // Reset playback state when media consent or track changes.
  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setError(null);
    setPreviewProgress(null);

    positionRef.current = 0;
    durationRef.current = 0;
    playingRef.current = false;
    draggingRef.current = false;
    timestampRef.current = performance.now();

    if (!mediaConsent) {
      widgetRef.current = null;
      setWaveformData(null);
    }
  }, [mediaConsent, trackUrl]);

  // Smooth visual playback progress.
  useEffect(() => {
    if (!mediaConsent) return;

    let frame = 0;
    let lastSync = 0;

    const animate = (now: number) => {
      if (playingRef.current) {
        const elapsed = now - timestampRef.current;

        const nextPosition = Math.min(
          durationRef.current || Infinity,
          positionRef.current + elapsed,
        );

        if (!draggingRef.current) {
          setPosition(nextPosition);
        }

        if (!draggingRef.current && now - lastSync >= 500) {
          lastSync = now;

          const widget = widgetRef.current;

          widget?.getPosition((actualPosition) => {
            if (
              widget !== widgetRef.current ||
              !playingRef.current ||
              draggingRef.current ||
              !Number.isFinite(actualPosition)
            ) {
              return;
            }

            const currentTime = performance.now();

            const predictedPosition =
              positionRef.current + (currentTime - timestampRef.current);

            const difference = actualPosition - predictedPosition;

            if (Math.abs(difference) < 150) {
              return;
            }

            if (Math.abs(difference) < 1500) {
              positionRef.current = predictedPosition + difference * 0.2;
            } else {
              positionRef.current = actualPosition;
            }

            timestampRef.current = currentTime;
          });
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [mediaConsent]);

  // Request playback directly from the user's interaction.
  // SoundCloud events are the source of truth for playback state.
  const togglePlayback = useCallback(() => {
    const widget = widgetRef.current;
    const iframe = iframeRef.current;

    if (
      !mediaConsent ||
      !widget ||
      !iframe ||
      !isIframeAvailable(iframe) ||
      !ready ||
      error
    ) {
      return;
    }

    if (playingRef.current) {
      // Let the PAUSE event confirm the paused state.
      widget.pause();
      return;
    }

    // Do not set playingRef or setPlaying here.
    // Wait for SoundCloud's PLAY event.
    widget.play();
  }, [ready, error, mediaConsent]);

  const seek = useCallback(
    (percentage: number) => {
      const widget = widgetRef.current;
      const iframe = iframeRef.current;

      if (
        !mediaConsent ||
        !widget ||
        !iframe ||
        !isIframeAvailable(iframe) ||
        !ready ||
        durationRef.current <= 0
      ) {
        return;
      }

      const clamped = Math.max(0, Math.min(100, percentage));

      const nextPosition = (clamped / 100) * durationRef.current;

      analyticsRef.current?.seek();

      positionRef.current = nextPosition;
      timestampRef.current = performance.now();

      setPosition(nextPosition);
      widget.seekTo(nextPosition);
    },
    [ready, mediaConsent],
  );

  const getPointerProgress = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) return 0;

    return Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mediaConsent || !ready || duration <= 0) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    draggingRef.current = true;

    event.currentTarget.setPointerCapture(event.pointerId);

    const percentage = getPointerProgress(event);

    dragProgressRef.current = percentage;
    setPreviewProgress(percentage);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !ready || duration <= 0) {
      return;
    }

    const percentage = getPointerProgress(event);

    dragProgressRef.current = percentage;
    setPreviewProgress(percentage);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    const percentage = getPointerProgress(event);

    draggingRef.current = false;
    dragProgressRef.current = percentage;

    seek(percentage);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setPreviewProgress(null);
  };

  const handlePointerCancel = () => {
    draggingRef.current = false;
    setPreviewProgress(null);
  };

  const progress =
    duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;

  const displayedProgress = previewProgress ?? progress;

  const bars = waveform.length
    ? waveform
    : Array.from({ length: safeBarCount }, () => 8);

  return (
    <div
      role="group"
      aria-label={`Audio player for ${title}`}
      className="relative w-full"
    >
      {/* Hidden SoundCloud iframe */}
      {mediaConsent && trackUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[166px] w-full overflow-hidden opacity-0"
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={`SoundCloud player for ${title}`}
            width="100%"
            height="166"
            allow="autoplay; encrypted-media; fullscreen"
            loading="eager"
            tabIndex={-1}
            className="border-0"
          />
        </div>
      )}

      {!mediaConsent ? (
        <div className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center">
          <p className="text-xs leading-relaxed text-white/60">
            Enable third-party media to listen to this track.
          </p>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("open-cookie-settings"));
            }}
            className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
          >
            Cookie Settings
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex items-center gap-3">
            {/* Play / Pause button */}
            <button
              type="button"
              onClick={togglePlayback}
              disabled={!ready || !!error}
              aria-label={playing ? `Pause ${title}` : `Play ${title}`}
              className="relative -top-2.5 flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-full border border-white bg-white text-black transition-all duration-200 hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playing ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Waveform and timestamps */}
            <div className="min-w-0 flex-1">
              <div
                role="slider"
                tabIndex={ready && duration > 0 ? 0 : -1}
                aria-label={`Seek within ${title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-valuetext={formatTime(position)}
                aria-disabled={!ready || duration <= 0}
                onKeyDown={(event) => {
                  if (!ready || duration <= 0) {
                    return;
                  }

                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    seek(progress + 5);
                  }

                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    seek(progress - 5);
                  }

                  if (event.key === "Home") {
                    event.preventDefault();
                    seek(0);
                  }

                  if (event.key === "End") {
                    event.preventDefault();
                    seek(100);
                  }
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className="relative h-20 w-full cursor-pointer touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {/* Inactive waveform */}
                <div className="absolute inset-0 flex items-center gap-[4px]">
                  {bars.map((height, index) => (
                    <div
                      key={index}
                      className="min-w-0 flex-1 rounded-full bg-[#555555]"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Active waveform */}
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - displayedProgress}% 0 0)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center gap-[2px]">
                    {bars.map((height, index) => (
                      <div
                        key={index}
                        className="min-w-0 flex-1 rounded-full bg-white"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-1 flex justify-between text-xs tabular-nums text-white/40">
                <span>
                  {formatTime(
                    draggingRef.current && previewProgress !== null
                      ? (previewProgress / 100) * duration
                      : position,
                  )}
                </span>

                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
