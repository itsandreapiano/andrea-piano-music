"use client";

import { useEffect, useState } from "react";

type SoundCloudArtworkProps = {
  trackUrl: string;
  title: string;
};

type SoundCloudOEmbed = {
  thumbnail_url?: string;
};

export default function SoundCloudArtwork({
  trackUrl,
  title,
}: SoundCloudArtworkProps) {
  const [artwork, setArtwork] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setArtwork(null);

    const params = new URLSearchParams({
      url: trackUrl,
      format: "json",
    });

    fetch(`https://soundcloud.com/oembed?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load SoundCloud artwork");
        }

        return response.json() as Promise<SoundCloudOEmbed>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setArtwork(data.thumbnail_url ?? null);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        console.error("SoundCloud artwork error:", error);
      });

    return () => controller.abort();
  }, [trackUrl]);

  return (
    <div className="bg-muted aspect-square w-48 overflow-hidden rounded-xl md:w-full">
      {artwork ? (
        <img
          src={artwork}
          alt={`${title} cover artwork`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="bg-muted h-full w-full animate-pulse" />
      )}
    </div>
  );
}
