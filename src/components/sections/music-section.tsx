"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollView } from "@/components/scroll-view";
import { Badge } from "@/components/ui/badge";
import { SINGLES_LIST } from "@/content/music";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { trackMediaEvent } from "@/lib/mediaAnalytics";
import AudioPlayer from "../ui/soundcloud-player";
import SingleArtwork from "../ui/soundcloud-artwork";

const YEARS = [...new Set(SINGLES_LIST.map((single) => single.year))].sort(
  (a, b) => b - a,
);

export default function MusicSection() {
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

  const [barCount, setBarCount] = useState(170);

  useEffect(() => {
    const updateBarCount = () => {
      const width = window.innerWidth;

      if (width <= 425) {
        setBarCount(28);
      } else if (width <= 768) {
        setBarCount(56);
      } else {
        setBarCount(75);
      }
    };

    updateBarCount();

    window.addEventListener("resize", updateBarCount);

    return () => {
      window.removeEventListener("resize", updateBarCount);
    };
  }, []);

  return (
    <section id="music" className="bg-background py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-12 px-6 md:space-y-20">
        {/* Section heading */}
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <ScrollView>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
              Releases
            </span>
          </ScrollView>

          <ScrollView delay={0.1}>
            <h2 className="text-4xl font-medium tracking-tight lg:text-5xl">
              My Music
            </h2>
          </ScrollView>

          <ScrollView delay={0.2}>
            <p className="text-muted-foreground">
              Explore my latest singles and releases.
              <br />
              Hit play. Find your favorite. Save it on Spotify.
            </p>
          </ScrollView>
        </div>

        {/* Year accordions */}
        <div className="space-y-4">
          {YEARS.map((year) => {
            const isOpen = openYear === year;

            const singles = SINGLES_LIST.filter(
              (single) => Number(single.year) === year,
            );

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
                  aria-controls={`music-year-${year}`}
                  className="hover:bg-muted/40 flex w-full items-center justify-between px-6 py-6 text-left transition-colors md:px-8"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-medium tracking-tight md:text-4xl">
                      {year}
                    </h3>

                    <Badge variant="secondary">
                      {singles.length}{" "}
                      {singles.length === 1 ? "track" : "tracks"}
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
                  id={`music-year-${year}`}
                  hidden={!isOpen}
                  className="px-6 md:px-8"
                >
                  {isOpen && (
                    <div className="border-border border-t">
                      {singles.map((single) => (
                        <article
                          key={single.url}
                          className="border-border border-b pt-10 pb-20 first:pt-10 last:border-b-0 last:pb-10 md:py-12"
                        >
                          <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:items-center lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                            {/* Album artwork */}
                            <ScrollView>
                              <div className="flex w-full justify-center md:justify-start">
                                <div className="w-full sm:max-w-[380px] md:max-w-none">
                                  <SingleArtwork
                                    artworkUrl={single.artworkUrl}
                                    title={single.name}
                                  />
                                </div>
                              </div>
                            </ScrollView>

                            {/* Track information and player */}
                            <div className="flex min-w-0 flex-col gap-5">
                              {/* Title, tags and year */}
                              <ScrollView>
                                <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:justify-between md:text-left">
                                  <div className="space-y-3">
                                    <h4 className="text-2xl font-medium tracking-tight md:text-3xl">
                                      {single.name}
                                    </h4>

                                    {single.tags.length > 0 && (
                                      <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                                        {single.tags.map((tag) => (
                                          <Badge key={tag} variant="outline">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </ScrollView>

                              {/* Interactive SoundCloud waveform */}
                              {single.audioUrl && (
                                <ScrollView
                                  delay={0.1}
                                  viewMargin="0px 0px -125px 0px"
                                >
                                  <AudioPlayer
                                    audioUrl={single.audioUrl}
                                    waveformUrl={single.waveform}
                                    title={single.name}
                                    barCount={barCount}
                                    trackUrl={single.audioUrl}
                                  />
                                </ScrollView>
                              )}

                              {/* Spotify CTA */}
                              <ScrollView delay={0.15}>
                                <div className="border-border flex  border-t pt-4 md:justify-start">
                                  <a
                                    href={single.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Listen to ${single.name} on Spotify`}
                                    onClick={() =>
                                      trackMediaEvent("spotify_click", {
                                        title: single.name,
                                        url: single.url,
                                      })
                                    }
                                    className="group text-foreground inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
                                  >
                                    Open on Spotify
                                    <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                  </a>
                                </div>
                              </ScrollView>
                            </div>
                          </div>
                        </article>
                      ))}

                      {singles.length === 0 && (
                        <p className="text-muted-foreground py-10 text-center">
                          No singles available for {year}.
                        </p>
                      )}
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
