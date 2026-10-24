"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

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
    // Ignore SoundCloud errors during iframe teardown.
  }
}

function pauseOtherPlayers(current: ActivePlayer) {
  for (const player of activePlayers) {
    if (player === current) continue;

    if (!isIframeAvailable(player.iframe)) {
      activePlayers.delete(player);
      continue;
    }

    // Pause SoundCloud playback
    safelyPause(player);

    // Immediately synchronize the previous player's React state
    player.onPause();
  }
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

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

    // Average amplitude instead of maximum peak
    const average =
      segment.reduce((sum, value) => sum + value, 0) / segment.length;

    // Normalize to a value between 0 and 1
    const normalized = Math.max(0, Math.min(1, average / data.height));

    // Increase contrast between quiet and loud sections
    const contrast = Math.pow(normalized, 5.3);

    // Boost bar heights while preserving contrast
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

  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const playingRef = useRef(false);
  const timestampRef = useRef(0);

  const draggingRef = useRef(false);
  const dragProgressRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeBarCount = Math.max(
    1,
    Math.floor(Number.isFinite(barCount) ? barCount : 100),
  );

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      url: trackUrl,
      auto_play: "false",
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

  // Load waveform data.
  useEffect(() => {
    const controller = new AbortController();

    setWaveformData(null);

    if (!waveformUrl) return;

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
  }, [waveformUrl]);

  // Initialize and manage the SoundCloud widget.
  useEffect(() => {
    if (!trackUrl) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let active = true;
    let player: ActivePlayer | null = null;
    let events: WidgetAPI["Events"] | null = null;

    let readyTimer: ReturnType<typeof setInterval> | null = null;

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

    loadSoundCloudAPI()
      .then((Widget) => {
        if (!active || !isIframeAvailable(iframe)) return;

        const widget = Widget(iframe);

        player = {
          widget,
          iframe,
          onPause: () => {
            if (!active || !playingRef.current) return;

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
          if (!active || !isIframeAvailable(iframe)) return;

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

          playingRef.current = true;
          timestampRef.current = performance.now();
          setPlaying(true);

          if (player) {
            pauseOtherPlayers(player);
          }
        });

        widget.bind(Widget.Events.PAUSE, () => {
          if (!active) return;

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
        });

        widget.bind(Widget.Events.FINISH, () => {
          if (!active) return;

          playingRef.current = false;
          positionRef.current = 0;
          timestampRef.current = performance.now();

          setPlaying(false);
          setPosition(0);
          setPreviewProgress(null);
        });

        widget.bind(Widget.Events.ERROR, () => {
          if (!active) return;

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

      if (readyTimer) {
        clearInterval(readyTimer);
      }

      if (player) {
        activePlayers.delete(player);

        // Detach callbacks before React removes the iframe.
        if (events) {
          for (const event of Object.values(events)) {
            try {
              player.widget.unbind(event);
            } catch {
              // The iframe may already be unavailable.
            }
          }
        }

        // Pause only while the iframe is still accessible.
        safelyPause(player);
      }

      if (player && widgetRef.current === player.widget) {
        widgetRef.current = null;
      }

      playingRef.current = false;
    };
  }, [trackUrl]);

  // Smooth visual playback progress.
  useEffect(() => {
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

            // Ignore tiny timing differences.
            if (Math.abs(difference) < 150) {
              return;
            }

            // Correct moderate drift gradually.
            if (Math.abs(difference) < 1500) {
              positionRef.current = predictedPosition + difference * 0.2;
            } else {
              // Large differences can indicate seeking.
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
  }, []);

  const togglePlayback = useCallback(() => {
    const widget = widgetRef.current;
    const iframe = iframeRef.current;

    if (!widget || !iframe || !isIframeAvailable(iframe) || !ready || error) {
      return;
    }

    if (playingRef.current) {
      positionRef.current = Math.min(
        durationRef.current || Infinity,
        positionRef.current + (performance.now() - timestampRef.current),
      );

      playingRef.current = false;
      setPlaying(false);
      setPosition(positionRef.current);

      widget.pause();
    } else {
      playingRef.current = true;
      timestampRef.current = performance.now();
      setPlaying(true);

      widget.play();

      for (const player of activePlayers) {
        if (player.widget === widget) {
          pauseOtherPlayers(player);
          break;
        }
      }
    }
  }, [ready, error]);

  const seek = useCallback(
    (percentage: number) => {
      const widget = widgetRef.current;
      const iframe = iframeRef.current;

      if (
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

      positionRef.current = nextPosition;
      timestampRef.current = performance.now();
      setPosition(nextPosition);

      widget.seekTo(nextPosition);
    },
    [ready],
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
    if (!ready || duration <= 0) return;

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
    // Only preview while actively dragging.
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

    // Seek only when the pointer is released.
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
      {/* Hidden SoundCloud playback engine */}
      {trackUrl && (
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
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            className="border-0"
          />
        </div>
      )}

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
              if (!ready || duration <= 0) return;

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
    </div>
  );
}
