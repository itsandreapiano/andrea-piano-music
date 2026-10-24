import { ScrollView } from "./scroll-view";
import Image from "next/image";
import Link from "next/link";

export default function ContentSection() {
  return (
    <section className="py-16 md:py-32" id="about">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <div className="space-y-6 md:space-y-12">
          <ScrollView>
            <h2 className="text-balance text-4xl font-medium lg:text-5xl">
              Who I am
            </h2>
          </ScrollView>

          <ScrollView>
            <Image
              className="aspect-[16/9] w-full rounded-(--radius) object-cover grayscale-75"
              src="/images/me.jpg"
              alt="Andrea Piano"
              height={480}
              width={720}
              loading="lazy"
            />
          </ScrollView>

          <div className="space-y-6 leading-relaxed">
            <ScrollView>
              <p>
                Hi! My name is Andrea Piano, and I&apos;m a singer and
                songwriter based in Poznań, Poland. Originally from Sardinia, I
                spent years traveling and living in different places before
                finally establishing a new home base here.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                Music has been my biggest passion since I was a kid. I started
                out playing the piano, tried with the guitar (that didn&apos;t
                work out so well lol), and eventually got into making rap music,
                gaining some interesting recognition in my local music scene as
                a teenager.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                Over the years, my curiosity and open-mindedness pushed me to
                explore other genres too, especially rock, indie, R&amp;B, funk,
                and electronic music. So you might be wondering... what kind of
                music does he actually make today? Good question. A little bit
                of everything, but with rock music at the heart of it all.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                I just don&apos;t like labels. Never did, never will. Have a
                listen and judge for yourself. Visit my{" "}
                <Link
                  href="/music"
                  className="text-foreground underline font-semibold underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Music
                </Link>{" "}
                page.
              </p>
            </ScrollView>

            <ScrollView>
              <hr className="border-border border-t mb-10" />

              <p>
                I created this website because I wanted a place where my music
                could truly feel at home. A safe space. Somewhere beyond
                streaming platforms and social media, where I can share not only
                the songs I release, but also the stories, ideas, and
                experiences behind them, as well as my perspective on the world.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                Let&apos;s be honest and straightforward: social media is pretty
                fucked up these days. Everything seems to revolve around
                attention, followers, numbers, and algorithms. Somewhere along
                the way, genuine human connection has taken a back seat. And
                that&apos;s not what music is about for me.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                That&apos;s why I decided to create my own little corner of the
                internet. And since I&apos;m also a Web &amp; Software Developer
                (which is currently how I make a living), I thought to myself…
                why not bring all my skills together and build something TRULY
                aligned with my life&apos;s mission?
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                And... dun dun! That&apos;s how this website came to life. A
                place where my music comes first. Where I can express myself
                freely, without having to worry about censorship or stupid
                moderation filters. Where people can follow my journey without
                an algorithm deciding what they get to see and what they
                don&apos;t.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                No chasing trends, no fighting for attention. Just music,
                stories, my perspective on the world, and hopefully some real
                human connection.
              </p>
            </ScrollView>

            <ScrollView>
              <p>
                And that&apos;s also why{" "}
                <strong className="text-foreground font-semibold">
                  subscribing to my newsletter is one of the best ways you can
                  support me.
                </strong>{" "}
                Whenever I release a new song or have something meaningful to
                share, you&apos;ll hear about it directly from me. No
                algorithms, no unnecessary noise, and definitely no spam.
              </p>
            </ScrollView>

            <ScrollView>
              <p>And don&apos;t worry, you can unsubscribe anytime.</p>
            </ScrollView>

            <ScrollView>
              <p>Thanks for being here. It means the world to me.</p>
            </ScrollView>

            <ScrollView>
              <div className="space-y-2 mt-16">
                <p>I love you, truly.</p>
                <p>Andrea</p>
              </div>
            </ScrollView>
          </div>
        </div>
      </div>
    </section>
  );
}
