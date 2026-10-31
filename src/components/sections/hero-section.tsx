import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

export default function HeroSection() {
  return (
    <section className="relative flex h-full items-center justify-center overflow-hidden bg-black text-white">
      {" "}
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.webp"
          className="h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </div>
      {/* Hero content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-center">
        <TextEffect
          preset="fade-in-blur"
          speedSegment={0.3}
          as="h1"
          className="text-5xl font-semibold tracking-tight sm:text-7xl lg:text-9xl"
        >
          ANDREA PIANO
        </TextEffect>

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.8,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                y: 20,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                },
              },
            },
          }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white px-8 text-black hover:bg-white/90"
          >
            <Link href="/music">
              Listen to My Music
              <ArrowUpRight className="ml-2 size-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/50 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/videos">Watch Videos</Link>
          </Button>
        </AnimatedGroup>
      </div>
    </section>
  );
}
