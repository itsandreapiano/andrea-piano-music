"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { createSongAnalytics } from "@/lib/songAnalytics";

type WaveformData = {
  width: number;
  height: number;
  samples: number[];
};

type AudioPlayerProps = {
  audioUrl: string;
  waveformUrl: string;
  title?: string;
  barCount?: number;
  trackUrl?: string;
};

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

    const normalized = clamp(average / data.height, 0, 1);

    const contrast = Math.pow(normalized, 5.3);

    return clamp(contrast * 180, 3, 100);
  });
}

export default function AudioPlayer({
  audioUrl,
  waveformUrl,
  title = "Audio track",
  barCount = 100,
  trackUrl,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timestampRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const analyticsRef = useRef<ReturnType<typeof createSongAnalytics> | null>(
    null,
  );

  const draggingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const previewRef = useRef(0);
  const playingRef = useRef(false);

  const pointerStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  // Animation clock used to interpolate between audio samples.
  const clockRef = useRef({
    position: 0,
    timestamp: 0,
    playing: false,
  });

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);

  const safeBarCount = Math.max(
    1,
    Math.floor(Number.isFinite(barCount) ? barCount : 100),
  );

  const waveform = useMemo(
    () => (waveformData ? normalizeWaveform(waveformData, safeBarCount) : []),
    [waveformData, safeBarCount],
  );

  const bars = useMemo(
    () =>
      waveform.length
        ? waveform
        : Array.from({ length: safeBarCount }, () => 8),
    [waveform, safeBarCount],
  );

  const updateVisuals = useCallback(
    (positionMs: number, durationMs: number) => {
      const percentage =
        durationMs > 0 ? clamp((positionMs / durationMs) * 100, 0, 100) : 0;

      if (progressRef.current) {
        progressRef.current.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      }

      if (timestampRef.current) {
        const formatted = formatTime(positionMs);

        if (timestampRef.current.textContent !== formatted) {
          timestampRef.current.textContent = formatted;
        }
      }
    },
    [],
  );

  const syncClock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    clockRef.current = {
      position: audio.currentTime * 1000,
      timestamp: performance.now(),
      playing: !audio.paused && !audio.ended,
    };
  }, []);

  // Load local waveform JSON.
  useEffect(() => {
    const controller = new AbortController();

    setWaveformData(null);

    fetch(waveformUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Waveform HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data: WaveformData) => {
        if (
          !controller.signal.aborted &&
          Array.isArray(data.samples) &&
          Number.isFinite(data.height) &&
          data.height > 0
        ) {
          setWaveformData(data);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Waveform loading failed:", err);
        }
      });

    return () => controller.abort();
  }, [waveformUrl]);

  // Analytics.
  useEffect(() => {
    const analytics = createSongAnalytics({
      title,
      trackUrl: trackUrl ?? audioUrl,
    });

    analyticsRef.current = analytics;

    return () => {
      analytics.destroy();

      if (analyticsRef.current === analytics) {
        analyticsRef.current = null;
      }
    };
  }, [title, trackUrl, audioUrl]);

  // Pause other players when one starts.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pauseOnOtherPlay = (event: Event) => {
      const otherAudio = (event as CustomEvent<HTMLAudioElement>).detail;

      if (otherAudio !== audio) {
        audio.pause();
      }
    };

    window.addEventListener("site-audio-play", pauseOnOtherPlay);

    return () => {
      window.removeEventListener("site-audio-play", pauseOnOtherPlay);
    };
  }, []);

  // Smooth waveform animation.
  useEffect(() => {
    let frame = 0;

    const animate = (now: number) => {
      const audio = audioRef.current;

      if (audio && !draggingRef.current) {
        const durationMs = audio.duration * 1000;

        if (Number.isFinite(durationMs) && durationMs > 0) {
          const clock = clockRef.current;

          const predictedPosition = clamp(
            clock.position + (clock.playing ? now - clock.timestamp : 0),
            0,
            durationMs,
          );

          updateVisuals(predictedPosition, durationMs);
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [updateVisuals]);

  // Reset on source changes.
  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setDuration(0);
    setPosition(0);
    setError(null);

    draggingRef.current = false;
    activePointerRef.current = null;
    playingRef.current = false;

    clockRef.current = {
      position: 0,
      timestamp: performance.now(),
      playing: false,
    };

    updateVisuals(0, 0);
  }, [audioUrl, updateVisuals]);

  // iPhone-safe playback.
  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setError(null);

    // Must execute synchronously within the user gesture.
    void audio.play().catch((err: unknown) => {
      console.error("Audio playback failed:", err);
      setError("Unable to play this track.");
    });
  }, []);

  // Native seek.
  const seek = useCallback(
    (percentage: number) => {
      const audio = audioRef.current;

      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const nextTime = (clamp(percentage, 0, 100) / 100) * audio.duration;

      analyticsRef.current?.seek();

      audio.currentTime = nextTime;

      syncClock();

      const positionMs = nextTime * 1000;

      setPosition(positionMs);

      updateVisuals(positionMs, audio.duration * 1000);
    },
    [syncClock, updateVisuals],
  );

  const getPointerProgress = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) return 0;

    return clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;

    if (
      !audio ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0 ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    activePointerRef.current = event.pointerId;

    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    // Mouse: allow immediate seeking.
    // Touch: wait to determine the gesture.
    if (event.pointerType === "mouse") {
      draggingRef.current = true;

      event.currentTarget.setPointerCapture(event.pointerId);

      const percentage = getPointerProgress(event);

      previewRef.current = percentage;

      updateVisuals(
        (percentage / 100) * audio.duration * 1000,
        audio.duration * 1000,
      );
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      activePointerRef.current !== event.pointerId ||
      !pointerStartRef.current
    ) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;

    if (!draggingRef.current) {
      // Ignore small movements and vertical scrolling.
      if (Math.abs(deltaX) < 12 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.5) {
        return;
      }

      draggingRef.current = true;
    }

    const percentage = getPointerProgress(event);

    previewRef.current = percentage;

    updateVisuals(
      (percentage / 100) * audio.duration * 1000,
      audio.duration * 1000,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    if (draggingRef.current) {
      const percentage = getPointerProgress(event);
      seek(percentage);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    draggingRef.current = false;
    activePointerRef.current = null;
    pointerStartRef.current = null;
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return;

    draggingRef.current = false;
    activePointerRef.current = null;
    pointerStartRef.current = null;

    syncClock();

    const audio = audioRef.current;

    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      updateVisuals(audio.currentTime * 1000, audio.duration * 1000);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    const percentage = (audio.currentTime / audio.duration) * 100;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        seek(percentage + 5);
        break;

      case "ArrowLeft":
        event.preventDefault();
        seek(percentage - 5);
        break;

      case "Home":
        event.preventDefault();
        seek(0);
        break;

      case "End":
        event.preventDefault();
        seek(100);
        break;
    }
  };

  const progress =
    duration > 0 ? clamp((position / duration) * 100, 0, 100) : 0;

  return (
    <div
      role="group"
      aria-label={`Audio player for ${title}`}
      className="relative w-full"
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const seconds = event.currentTarget.duration;

          if (Number.isFinite(seconds) && seconds > 0) {
            setDuration(seconds * 1000);
            setReady(true);
            setError(null);
            syncClock();
          }
        }}
        onDurationChange={(event) => {
          const seconds = event.currentTarget.duration;

          if (Number.isFinite(seconds) && seconds > 0) {
            setDuration(seconds * 1000);
            setReady(true);
          }
        }}
        onPlay={(event) => {
          playingRef.current = true;
          setPlaying(true);
          setError(null);

          syncClock();

          analyticsRef.current?.play();

          window.dispatchEvent(
            new CustomEvent("site-audio-play", {
              detail: event.currentTarget,
            }),
          );
        }}
        onPause={(event) => {
          if (playingRef.current) {
            analyticsRef.current?.pause();
          }

          playingRef.current = false;
          setPlaying(false);

          syncClock();

          updateVisuals(
            event.currentTarget.currentTime * 1000,
            event.currentTarget.duration * 1000,
          );
        }}
        onTimeUpdate={(event) => {
          const ms = event.currentTarget.currentTime * 1000;

          setPosition(ms);
          analyticsRef.current?.progress(ms);
        }}
        onSeeking={syncClock}
        onSeeked={syncClock}
        onEnded={(event) => {
          playingRef.current = false;

          setPlaying(false);
          setPosition(0);

          analyticsRef.current?.finish();

          event.currentTarget.currentTime = 0;

          syncClock();
          updateVisuals(0, event.currentTarget.duration * 1000);
        }}
        onError={() => {
          playingRef.current = false;
          setPlaying(false);
          setReady(false);
          setError("Unable to load this audio file.");
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!!error}
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
            ref={sliderRef}
            role="slider"
            tabIndex={ready && duration > 0 ? 0 : -1}
            aria-label={`Seek within ${title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={formatTime(position)}
            aria-disabled={!ready || duration <= 0}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="relative h-20 w-full cursor-pointer touch-pan-y select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {/* Inactive waveform */}
            <div className="absolute inset-0 flex items-center gap-[4px]">
              {bars.map((height, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-1 rounded-full bg-[#555555]"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            {/* Active waveform */}
            <div
              ref={progressRef}
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{
                clipPath: "inset(0 100% 0 0)",
                willChange: "clip-path",
              }}
            >
              <div className="absolute inset-0 flex items-center gap-[2px]">
                {bars.map((height, index) => (
                  <div
                    key={index}
                    className="min-w-0 flex-1 rounded-full bg-white"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-1 flex justify-between text-xs tabular-nums text-white/40">
            <span ref={timestampRef}>{formatTime(position)}</span>
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
