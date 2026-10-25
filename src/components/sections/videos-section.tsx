"use client";

import { useState } from "react";
import { ScrollView } from "@/components/scroll-view";
import { Badge } from "@/components/ui/badge";
import { VIDEOS_LIST } from "@/content/videos";
import { ArrowUpRight, ChevronDown, Video } from "lucide-react";
import { useEffect, useRef } from "react";
import YouTubePlayer from "../ui/youtube-player";
import { trackMediaEvent } from "@/lib/mediaAnalytics";

const YEARS = [...new Set(VIDEOS_LIST.map((video) => video.year))].sort(
  (a, b) => b - a,
);

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);

    if (
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      if (
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.startsWith("/embed/")
      ) {
        return parsed.pathname.split("/")[2] || null;
      }
    }

    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
};

export default function VideosSection() {
  const [openYear, setOpenYear] = useState<number | null>(YEARS[0] ?? null);

  const accordionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (openYear === null || !shouldScrollRef.current) return;

    shouldScrollRef.current = false;

    const frame = requestAnimationFrame(() => {
      accordionRefs.current[openYear]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [openYear]);

  const toggleYear = (year: number) => {
    shouldScrollRef.current = true;
    setOpenYear((current) => (current === year ? null : year));
  };

  return (
    <section id="videos" className="bg-background py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-12 px-6 md:space-y-20">
        {/* Section heading */}
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <ScrollView>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
              Visuals
            </span>
          </ScrollView>

          <ScrollView delay={0.1}>
            <h2 className="text-4xl font-medium tracking-tight lg:text-5xl">
              My Videos
            </h2>
          </ScrollView>

          <ScrollView delay={0.2}>
            <p className="text-muted-foreground">
              Discover my music videos, lyric videos, and visual projects.
              <br />
              Watch directly here or open them on YouTube.
            </p>
          </ScrollView>
        </div>

        {/* Year accordions */}
        <div className="space-y-4">
          {YEARS.map((year) => {
            const isOpen = openYear === year;

            const videos = VIDEOS_LIST.filter((video) => video.year === year);

            return (
              <div
                key={year}
                ref={(element) => {
                  accordionRefs.current[year] = element;
                }}
                className="border-border scroll-mt-24 overflow-hidden rounded-2xl border"
              >
                {/* Accordion trigger */}
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  aria-expanded={isOpen}
                  aria-controls={`videos-year-${year}`}
                  className="hover:bg-muted/40 flex w-full items-center justify-between px-6 py-6 text-left transition-colors md:px-8"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-medium tracking-tight md:text-4xl">
                      {year}
                    </h3>

                    <Badge variant="secondary">
                      {videos.length} {videos.length === 1 ? "video" : "videos"}
                    </Badge>
                  </div>

                  <ChevronDown
                    className={`size-5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion content */}
                <div
                  id={`videos-year-${year}`}
                  hidden={!isOpen}
                  className="px-6 md:px-8"
                >
                  {isOpen && (
                    <div className="border-border border-t">
                      {videos.map((video) => {
                        const videoId = getYouTubeVideoId(video.url);

                        return (
                          <article
                            key={video.url}
                            className="border-border border-b py-10 last:border-b-0 md:py-12"
                          >
                            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12">
                              {/* Video information */}
                              <div className="space-y-5 lg:col-span-2">
                                <ScrollView viewMargin="0px 0px -145px 0px">
                                  <h4 className="text-2xl font-medium tracking-tight md:text-3xl">
                                    {video.name}
                                  </h4>
                                </ScrollView>

                                {video.tags.length > 0 && (
                                  <ScrollView delay={0.1}>
                                    <div className="flex flex-wrap gap-2">
                                      {video.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </ScrollView>
                                )}

                                {videoId && (
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
                                    onClick={() =>
                                      trackMediaEvent("youtube_click", {
                                        title: video.name,
                                        url: video.url,
                                        videoId:
                                          new URL(video.url).searchParams.get(
                                            "v",
                                          ) ?? undefined,
                                      })
                                    }
                                  >
                                    Watch on YouTube
                                    <ArrowUpRight className="size-4" />{" "}
                                  </a>
                                )}
                              </div>

                              {/* YouTube player */}
                              <div className="lg:col-span-3">
                                <ScrollView delay={0.15}>
                                  {videoId ? (
                                    <>
                                      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                                        <YouTubePlayer
                                          videoId={videoId}
                                          title={video.name}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="border-border bg-muted/30 flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border">
                                      <Video className="text-muted-foreground size-6" />
                                      <span className="text-muted-foreground text-sm">
                                        Video unavailable
                                      </span>
                                    </div>
                                  )}
                                </ScrollView>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
