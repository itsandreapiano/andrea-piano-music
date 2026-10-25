import { getCookieConsent } from "@/components/CookieBanner";

type MediaEvent = "spotify_click" | "youtube_click" | "video_play";

type MediaAnalyticsOptions = {
  title: string;
  url: string;
  videoId?: string;
};

export function trackMediaEvent(
  eventName: MediaEvent,
  { title, url, videoId }: MediaAnalyticsOptions,
) {
  if (typeof window === "undefined") return;
  if (getCookieConsent()?.analytics !== true) return;
  if (typeof window.gtag !== "function") return;

  const isSpotify = eventName === "spotify_click";

  window.gtag("event", eventName, {
    ...(isSpotify
      ? {
          song_title: title,
          spotify_url: url,
        }
      : {
          video_title: title,
          video_url: url,
          ...(videoId ? { video_id: videoId } : {}),
        }),
    transport_type: "beacon",
  });
}
