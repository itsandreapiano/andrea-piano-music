"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  SiInstagram,
  SiSoundcloud,
  SiSpotify,
  SiYoutube,
} from "react-icons/si";

import { Logo } from "@/components/logo";
import { ScrollView } from "@/components/scroll-view";
import { NAV_LINKS } from "@/content/nav";
import { usePathname } from "next/navigation";
import Image from "next/image";

const SOCIAL_LINKS = [
  {
    name: "Spotify",
    href: "https://open.spotify.com/artist/0u4Ykq3Y4OHlEV1lXc5Edv?si=PuONhxC3TDW2a8twDGBM3Q",

    icon: SiSpotify,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@itsandreapiano",
    icon: SiYoutube,
  },
  {
    name: "SoundCloud",
    href: "https://soundcloud.com/itsandreapiano",
    icon: SiSoundcloud,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/itsandreapiano/",
    icon: SiInstagram,
  },
];

export default function FooterSection() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }
  return (
    <footer className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* Logo */}
        <ScrollView>
          <Link href="/" aria-label="Andrea Piano - Home">
            <Image
              className="mx-auto block w-fit"
              src="/images/logo.png"
              alt="Andrea Piano"
              width={65}
              height={65}
              priority
            />
          </Link>
        </ScrollView>

        {/* Navigation */}
        <ScrollView stagger delay={0.1}>
          <nav
            aria-label="Footer navigation"
            className="my-8 flex flex-wrap justify-center gap-x-5 gap-y-4 text-sm"
          >
            {NAV_LINKS.filter((link) => link.visible).map((link) => (
              <motion.div
                key={link.href}
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.8,
                    filter: "blur(10px)",
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  },
                }}
              >
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-primary block transition-colors duration-150"
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
          </nav>
        </ScrollView>

        {/* Social media */}
        <ScrollView delay={0.15} viewMargin="0px 0px -20px 0px">
          <div className="my-8 flex flex-wrap items-center justify-center gap-6">
            {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                title={name}
                className="text-muted-foreground hover:text-primary transition-colors duration-150"
              >
                <Icon className="size-6" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </ScrollView>

        {/* Copyright */}

        {/* Copyright & legal */}
        <ScrollView delay={0.2} viewMargin="0px 0px -20px 0px">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Andrea Piano. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground/70 text-xs transition-colors duration-150"
              >
                Privacy Policy
              </Link>

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("open-cookie-settings"))
                }
                className="text-muted-foreground/70 cursor-pointer text-xs transition-colors duration-150"
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </ScrollView>
      </div>
    </footer>
  );
}
