import Image from "next/image";
import { ScrollView } from "../scroll-view";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/itsandreapiano";
const BLIK_URL = "https://buy.stripe.com/8x24gBeoK16ucrj1Dy38400";

export default function SupportSection() {
  return (
    <section
      className="bg-gray-50 py-16 md:py-32 dark:bg-transparent"
      id="support"
    >
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        {/* Section heading */}
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <ScrollView>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
              Donations
            </span>
          </ScrollView>

          <ScrollView delay={0.1}>
            <h2 className="text-4xl font-medium tracking-tight lg:text-5xl">
              Support me
            </h2>
          </ScrollView>

          <ScrollView delay={0.2}>
            <p className="text-muted-foreground">
              Love what I do?
              <br />
              Coffee is my secret fuel for turning wild ideas into cool songs.
              <br />
              <em>
                Chip in for a virtual cup, preferably an espresso macchiato with
                oat milk.
              </em>
            </p>
          </ScrollView>
        </div>

        {/* Payment options */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-0">
          {/* Buy Me a Coffee */}
          <ScrollView delay={0.3}>
            <div className="flex h-full flex-col items-center gap-6 text-center md:px-8">
              <h3 className="text-xl font-medium">Buy Me A Coffee ☕</h3>

              <p className="text-muted-foreground">
                Scan or tap the QR code to support my music.
              </p>

              <a
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Support Andrea Piano on Buy Me a Coffee"
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <Image
                  src="/images/bmc_qr.png"
                  alt="Buy Me a Coffee QR code"
                  width={200}
                  height={200}
                  className="h-auto w-full max-w-[200px]"
                />
              </a>

              <p className="text-muted-foreground text-sm">Cheers.</p>
            </div>
          </ScrollView>

          {/* BLIK / Stripe */}
          <ScrollView delay={0.4}>
            <div className="border-border/50 flex h-full flex-col items-center gap-6 border-t pt-12 text-center md:border-t-0 md:border-l md:px-8 md:pt-0">
              <h3 className="text-xl font-medium">BLIK 🇵🇱</h3>

              <p className="text-muted-foreground">
                Supporting from Poland? You can also chip in using BLIK.
              </p>

              <a
                href={BLIK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Support Andrea Piano with BLIK or card"
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <Image
                  src="/images/blik_qr.png"
                  alt="QR code to support Andrea Piano through Stripe"
                  width={300}
                  height={300}
                  className="h-auto w-full max-w-[200px]"
                />
              </a>

              <p className="text-muted-foreground text-sm">
                Dziękuję. <br />
              </p>
            </div>
          </ScrollView>
        </div>
      </div>
    </section>
  );
}
