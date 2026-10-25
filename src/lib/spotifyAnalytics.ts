import { getCookieConsent } from "@/components/CookieBanner";

type SpotifyClickOptions = {
  songTitle: string;
  spotifyUrl: string;
};

export function trackSpotifyClick({
  songTitle,
  spotifyUrl,
}: SpotifyClickOptions) {
  if (typeof window === "undefined") return;

  if (getCookieConsent()?.analytics !== true) return;

  if (typeof window.gtag !== "function") return;

  window.gtag("event", "spotify_click", {
    song_title: songTitle,
    spotify_url: spotifyUrl,
    transport_type: "beacon",
  });
}
