"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  trackUrl?: string;
  barCount?: number;
};

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

  const seconds = Math.floor(ms / 1000);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function normalizeWaveform(data: WaveformData, barCount: number): number[] {
  if (!data.samples.length || data.height <= 0) return [];

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

export default function AudioPlayer({
  audioUrl,
  waveformUrl,
  title = "Audio track",
  trackUrl,
  barCount = 100,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const analyticsRef = useRef<ReturnType<typeof createSongAnalytics> | null>(
    null,
  );

  const draggingRef = useRef(false);
  const playingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeBarCount = Math.max(
    1,
    Math.floor(Number.isFinite(barCount) ? barCount : 100),
  );

  const waveform = useMemo(
    () => (waveformData ? normalizeWaveform(waveformData, safeBarCount) : []),
    [waveformData, safeBarCount],
  );

  const bars = waveform.length
    ? waveform
    : Array.from({ length: safeBarCount }, () => 8);

  // Load waveform data independently of SoundCloud.
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

  // Preserve existing song analytics.
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

  // When another track starts, pause this one.
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

  // Smooth waveform progress between native timeupdate events.
  useEffect(() => {
    let frame = 0;

    const animate = () => {
      const audio = audioRef.current;

      if (audio && !audio.paused && !draggingRef.current) {
        setPosition(audio.currentTime * 1000);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  // iOS: play() must happen directly inside the tap handler.
  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setError(null);

    void audio.play().catch((err: unknown) => {
      console.error("Audio playback failed:", err);
      setError("Unable to play this track.");
    });
  }, []);

  const seek = useCallback((percentage: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    const clamped = Math.max(0, Math.min(100, percentage));

    const nextTime = (clamped / 100) * audio.duration;

    analyticsRef.current?.seek();

    audio.currentTime = nextTime;
    setPosition(nextTime * 1000);
  }, []);

  const getPointerProgress = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) return 0;

    return Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !ready ||
      duration <= 0 ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    draggingRef.current = true;

    event.currentTarget.setPointerCapture(event.pointerId);

    setPreviewProgress(getPointerProgress(event));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    setPreviewProgress(getPointerProgress(event));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    const percentage = getPointerProgress(event);

    draggingRef.current = false;

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

          analyticsRef.current?.play();

          window.dispatchEvent(
            new CustomEvent("site-audio-play", {
              detail: event.currentTarget,
            }),
          );
        }}
        onPause={() => {
          if (playingRef.current) {
            analyticsRef.current?.pause();
          }

          playingRef.current = false;
          setPlaying(false);
        }}
        onTimeUpdate={(event) => {
          const ms = event.currentTarget.currentTime * 1000;

          if (!draggingRef.current) {
            setPosition(ms);
          }

          analyticsRef.current?.progress(ms);
        }}
        onEnded={(event) => {
          playingRef.current = false;
          setPlaying(false);
          setPosition(0);

          analyticsRef.current?.finish();

          event.currentTarget.currentTime = 0;
        }}
        onError={() => {
          playingRef.current = false;
          setPlaying(false);
          setReady(false);
          setError("Unable to load this audio file.");
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Play / Pause button */}
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
