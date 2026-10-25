import { getCookieConsent } from "@/components/CookieBanner";

type SongAnalyticsOptions = {
  title: string;
  trackUrl: string;
};

const PLAY_THRESHOLD_MS = 5000;
const FLUSH_INTERVAL_MS = 15000;
const MAX_PROGRESS_GAP_MS = 3000;
const PROGRESS_TOLERANCE_MS = 500;

function hasAnalyticsConsent(): boolean {
  return (
    typeof window !== "undefined" && getCookieConsent()?.analytics === true
  );
}

function sendSongEvent(
  name: "song_play" | "song_listen_time",
  params: Record<string, string | number>,
): boolean {
  if (!hasAnalyticsConsent()) return false;
  if (typeof window.gtag !== "function") return false;

  window.gtag("event", name, {
    ...params,
    transport_type: "beacon",
  });

  return true;
}

export function createSongAnalytics({ title, trackUrl }: SongAnalyticsOptions) {
  let playing = false;
  let totalMs = 0;
  let pendingMs = 0;
  let playReported = false;

  let lastPosition: number | null = null;
  let lastProgressTimestamp: number | null = null;

  const songParams = {
    song_title: title,
    song_url: trackUrl,
  };

  function resetProgressReference() {
    lastPosition = null;
    lastProgressTimestamp = null;
  }

  function resetCounters() {
    totalMs = 0;
    pendingMs = 0;
    playReported = false;
    resetProgressReference();
  }

  function flush() {
    if (!hasAnalyticsConsent()) {
      pendingMs = 0;
      return;
    }

    const seconds = Math.floor(pendingMs / 1000);

    if (seconds <= 0) return;

    const sent = sendSongEvent("song_listen_time", {
      ...songParams,
      listen_seconds: seconds,
    });

    if (sent) {
      pendingMs -= seconds * 1000;
    }
  }

  function progress(positionMs: number) {
    if (!playing || !Number.isFinite(positionMs)) return;

    if (!hasAnalyticsConsent()) {
      resetCounters();
      return;
    }

    const now = performance.now();

    if (lastPosition !== null && lastProgressTimestamp !== null) {
      const positionDelta = positionMs - lastPosition;
      const elapsed = now - lastProgressTimestamp;

      const validProgress =
        positionDelta > 0 &&
        elapsed > 0 &&
        elapsed <= MAX_PROGRESS_GAP_MS &&
        positionDelta <= elapsed + PROGRESS_TOLERANCE_MS;

      if (validProgress) {
        const listenedMs = Math.min(positionDelta, elapsed);

        totalMs += listenedMs;
        pendingMs += listenedMs;

        if (!playReported && totalMs >= PLAY_THRESHOLD_MS) {
          const sent = sendSongEvent("song_play", songParams);

          if (sent) {
            playReported = true;
          }
        }

        if (pendingMs >= FLUSH_INTERVAL_MS) {
          flush();
        }
      }
    }

    lastPosition = positionMs;
    lastProgressTimestamp = now;
  }

  function handleConsentChange() {
    if (!hasAnalyticsConsent()) {
      resetCounters();
    } else {
      resetProgressReference();
    }
  }

  function handleVisibilityChange() {
    // Don't count a long period without progress updates.
    resetProgressReference();

    if (document.visibilityState === "hidden") {
      flush();
    }
  }

  function handlePageHide() {
    flush();
    resetProgressReference();
  }

  window.addEventListener("cookie-consent-updated", handleConsentChange);

  window.addEventListener("storage", handleConsentChange);

  document.addEventListener("visibilitychange", handleVisibilityChange);

  window.addEventListener("pagehide", handlePageHide);

  return {
    play() {
      if (playing) return;

      playing = true;
      resetProgressReference();
    },

    progress,

    pause() {
      if (!playing) return;

      playing = false;
      resetProgressReference();
      flush();
    },

    seek() {
      resetProgressReference();
    },

    finish() {
      playing = false;
      flush();
      resetCounters();
    },

    reset() {
      playing = false;
      resetCounters();
    },

    flush,

    destroy() {
      playing = false;
      flush();

      window.removeEventListener("cookie-consent-updated", handleConsentChange);

      window.removeEventListener("storage", handleConsentChange);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("pagehide", handlePageHide);
    },
  };
}
