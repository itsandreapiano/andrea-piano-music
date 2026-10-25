import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Andrea Piano",
  description:
    "Learn how Andrea Piano collects, uses, and protects personal information, including contact messages, newsletter subscriptions, analytics, and embedded media.",
};

const CONTACT_EMAIL = "itsandreapiano@gmail.com";
const LAST_UPDATED = "October 25, 2026";

const emailLink = `mailto:${CONTACT_EMAIL}`;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-28 md:pb-32 md:pt-36">
        {/* Back navigation */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-12 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        {/* Header */}
        <header className="mb-16 border-b border-border pb-12">
          <div className="text-muted-foreground mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
            <ShieldCheck className="size-4" />
            Privacy & Data Protection
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Privacy Policy
          </h1>

          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
            Your privacy matters. This policy explains how personal information
            is collected, used, stored, and protected when you visit my website,
            contact me, subscribe to my newsletter, or interact with embedded
            music and video content.
          </p>

          <p className="text-muted-foreground mt-6 text-xs">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <article className="space-y-14 text-sm leading-7 md:text-base md:leading-8">
          {/* 1 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Who I am</h2>

            <p className="text-muted-foreground">
              This website is operated by Andrea Piano, an independent musician
              based in Poznań, Poland.
            </p>

            <p className="text-muted-foreground mt-4">
              For the purposes of the General Data Protection Regulation (GDPR),
              I am the controller of personal information collected directly
              through this website.
            </p>

            <p className="text-muted-foreground mt-4">
              If you have questions about this policy or wish to exercise your
              privacy rights, you can contact me at{" "}
              <a
                href={emailLink}
                className="text-foreground underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              2. Information I collect
            </h2>

            <p className="text-muted-foreground">
              Depending on how you use this website, I may process the following
              categories of personal information:
            </p>

            <ul className="text-muted-foreground mt-4 list-disc space-y-3 pl-6">
              <li>
                <strong className="text-foreground">
                  Contact information:
                </strong>{" "}
                your name, email address, and the contents of messages you send
                through the contact form.
              </li>

              <li>
                <strong className="text-foreground">
                  Newsletter information:
                </strong>{" "}
                your email address and information needed to manage your
                subscription, including records of your subscription consent.
              </li>

              <li>
                <strong className="text-foreground">
                  Technical information:
                </strong>{" "}
                information such as IP address, browser type, device
                information, and request logs that may be processed when you
                access the website.
              </li>

              <li>
                <strong className="text-foreground">
                  Analytics information:
                </strong>{" "}
                information about how you interact with the website when you
                have enabled optional analytics.
              </li>

              <li>
                <strong className="text-foreground">Cookie preferences:</strong>{" "}
                your choices regarding essential storage, analytics, and
                third-party media.
              </li>
            </ul>

            <p className="text-muted-foreground mt-4">
              I do not intentionally request sensitive personal information
              through the website. Please avoid including unnecessary sensitive
              information in contact messages.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              3. Purposes and legal bases
            </h2>

            <p className="text-muted-foreground">
              Personal information is processed for the following purposes and
              under the following GDPR legal bases:
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold">Responding to messages</h3>
                <p className="text-muted-foreground mt-1">
                  I use the information you submit to read and respond to your
                  inquiry. The legal basis is my legitimate interest in
                  communicating with people who contact me (Article 6(1)(f)
                  GDPR). Where a message concerns steps toward an agreement,
                  Article 6(1)(b) GDPR may apply instead.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Sending newsletters</h3>
                <p className="text-muted-foreground mt-1">
                  I use your email address to send newsletters only when you
                  have subscribed. The legal basis is your consent (Article
                  6(1)(a) GDPR).
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Website analytics</h3>
                <p className="text-muted-foreground mt-1">
                  I use optional analytics to understand website traffic and
                  improve the experience. The legal basis is your consent
                  (Article 6(1)(a) GDPR).
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Embedded music and videos</h3>
                <p className="text-muted-foreground mt-1">
                  I enable third-party SoundCloud and YouTube players when you
                  choose to allow third-party media. The legal basis for
                  consent-dependent processing is Article 6(1)(a) GDPR.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Website security and operation
                </h3>
                <p className="text-muted-foreground mt-1">
                  Technical information may be processed to deliver the website,
                  maintain its security, prevent abuse, and resolve technical
                  problems. The legal basis is my legitimate interest in
                  operating a secure and functional website (Article 6(1)(f)
                  GDPR).
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Legal obligations and claims</h3>
                <p className="text-muted-foreground mt-1">
                  Where necessary, information may be retained or processed to
                  comply with applicable legal obligations (Article 6(1)(c)
                  GDPR) or to establish, exercise, or defend legal claims
                  (Article 6(1)(f) GDPR).
                </p>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Contact form</h2>

            <p className="text-muted-foreground">
              When you submit the contact form, I collect the name, email
              address, and message you provide so I can respond to your inquiry.
            </p>

            <p className="text-muted-foreground mt-4">
              Contact form submissions are processed through Brevo&apos;s
              transactional email service and delivered to my Gmail inbox,
              provided by Google. Brevo and Google may process the information
              necessary to deliver, receive, and manage these messages.
            </p>

            <p className="text-muted-foreground mt-4">
              I use this information solely to handle your inquiry and any
              related correspondence. Submitting the contact form does not
              subscribe you to my newsletter or authorize unrelated marketing
              communications.
            </p>

            <p className="text-muted-foreground mt-4">
              Providing this information is voluntary, but a name, valid email
              address, and message are required to submit the form and receive a
              response. There is no statutory obligation to provide this
              information.
            </p>

            <p className="text-muted-foreground mt-4">
              Contact messages are retained only for as long as reasonably
              necessary to handle the inquiry and any directly related follow-up
              correspondence. Messages are deleted when they are no longer
              needed, unless a longer period is required by law or reasonably
              necessary in connection with a legal claim.
            </p>

            <p className="text-muted-foreground mt-4">
              The checkbox displayed alongside the contact form acknowledges
              that you have been informed about the processing described in this
              Privacy Policy. It is not consent to receive marketing emails.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              5. Newsletter subscriptions
            </h2>

            <p className="text-muted-foreground">
              You can subscribe to receive occasional emails about new music,
              releases, videos, and artist updates.
            </p>

            <p className="text-muted-foreground mt-4">
              Newsletter subscriptions and email delivery are managed through{" "}
              <a
                href="https://www.brevo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                Brevo
              </a>
              , an email marketing service provider. Brevo processes your email
              address and subscription-related information on my behalf to
              manage and deliver the newsletter.
            </p>

            <p className="text-muted-foreground mt-4">
              Subscription is based on your affirmative consent. I use a single
              opt-in subscription process and maintain available subscription
              records to help demonstrate when and how consent was provided.
            </p>

            <p className="text-muted-foreground mt-4">
              I do not use individual email-open tracking pixels or
              click-tracking links to monitor your engagement with newsletter
              messages.
            </p>

            <p className="text-muted-foreground mt-4">
              Your subscription remains active until you unsubscribe or the
              newsletter service is discontinued. You can withdraw consent at
              any time by clicking the unsubscribe link included in newsletter
              emails or by contacting me directly.
            </p>

            <p className="text-muted-foreground mt-4">
              Following unsubscription, your email address is removed from the
              active mailing list. Limited suppression or consent records may be
              retained where necessary to respect your unsubscribe request,
              demonstrate compliance, or prevent unwanted future messages.
            </p>

            <p className="text-muted-foreground mt-4">
              For more information about Brevo&apos;s handling of personal
              information, see{" "}
              <a
                href="https://www.brevo.com/legal/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground inline-flex items-center gap-1"
              >
                Brevo&apos;s Privacy Policy
                <ArrowUpRight className="size-3.5" />
              </a>
              .
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              6. Website hosting and service providers
            </h2>

            <p className="text-muted-foreground">
              This website is hosted using{" "}
              <a
                href="https://vercel.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                Vercel
              </a>
              . Vercel may process technical information necessary to deliver
              the website, operate its infrastructure, maintain security, and
              provide hosting services.
            </p>

            <p className="text-muted-foreground mt-4">
              I also use Google email services to receive and manage contact
              correspondence, Brevo to manage newsletter subscriptions, and
              Google Analytics to measure website usage when analytics consent
              has been granted.
            </p>

            <p className="text-muted-foreground mt-4">
              These providers may process personal information as service
              providers or, depending on the service and activity, as
              independent controllers under their own privacy terms.
            </p>

            <p className="text-muted-foreground mt-4">
              I share personal information only where necessary to provide these
              services, comply with applicable law, or protect legitimate rights
              and interests. I do not sell personal information.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              7. SoundCloud and YouTube
            </h2>

            <p className="text-muted-foreground">
              My website includes music and video content provided through
              SoundCloud and YouTube.
            </p>

            <p className="text-muted-foreground mt-4">
              The embedded SoundCloud audio player and YouTube video player are
              loaded only after you enable the{" "}
              <strong className="text-foreground">Third-party media</strong>{" "}
              preference in the cookie settings.
            </p>

            <p className="text-muted-foreground mt-4">
              Before you enable this preference, the embedded players remain
              blocked and do not initialize their playback services. You can
              still browse the website and view available release information
              without enabling third-party media.
            </p>

            <p className="text-muted-foreground mt-4">
              Once enabled, SoundCloud and YouTube may receive technical
              information, including your IP address, browser details, the
              content requested, and information about your interaction with
              their services. They may also use cookies or similar technologies
              in accordance with their own policies.
            </p>

            <p className="text-muted-foreground mt-4">
              You can withdraw third-party media consent at any time through
              Cookie Settings. Withdrawing consent prevents the embedded players
              from continuing to operate on this website.
            </p>

            <p className="text-muted-foreground mt-4">
              For additional information, please review the privacy policies of{" "}
              <a
                href="https://soundcloud.com/pages/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                SoundCloud
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground"
              >
                Google
              </a>
              , which operates YouTube.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Google Analytics</h2>

            <p className="text-muted-foreground">
              This website uses Google Analytics 4 (GA4), a web analytics
              service provided by Google, to understand how visitors interact
              with the website and improve its content, usability, and
              performance.
            </p>

            <p className="text-muted-foreground mt-4">
              Google Analytics is an optional service. Its analytics scripts and
              tracking functionality are enabled only after you accept the{" "}
              <strong className="text-foreground">Analytics</strong> category in
              the cookie settings.
            </p>

            <p className="text-muted-foreground mt-4">
              When enabled, Google Analytics may process information such as
              pages visited, interactions with the website, approximate
              geographic location, device and browser information, session
              information, and online identifiers.
            </p>

            <p className="text-muted-foreground mt-4">
              Google Analytics may use cookies, including identifiers such as{" "}
              <code className="text-foreground">_ga</code> and{" "}
              <code className="text-foreground">_ga_*</code>, to distinguish
              visits and support website measurement.
            </p>

            <p className="text-muted-foreground mt-4">
              The legal basis for optional analytics processing is your consent
              under Article 6(1)(a) GDPR.
            </p>

            <p className="text-muted-foreground mt-4">
              You may withdraw your analytics consent at any time through Cookie
              Settings. Withdrawing consent prevents further optional analytics
              collection on this website. Withdrawal does not undo processing
              that lawfully occurred before consent was withdrawn.
            </p>

            <p className="text-muted-foreground mt-4">
              For more information, see{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground inline-flex items-center gap-1"
              >
                Google&apos;s Privacy Policy
                <ArrowUpRight className="size-3.5" />
              </a>
              .
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              9. Cookies and privacy preferences
            </h2>

            <p className="text-muted-foreground">
              This website uses essential browser storage and offers optional
              technologies controlled through a cookie preferences interface.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold">Essential storage</h3>
                <p className="text-muted-foreground mt-1">
                  Essential storage supports the operation of the website and
                  remembers your cookie preferences. The cookie preferences are
                  stored locally in your browser so the website can respect your
                  choices.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-muted-foreground mt-1">
                  Optional analytics technologies help measure website traffic
                  and usage. They remain disabled unless you explicitly enable
                  Analytics.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Third-party media</h3>
                <p className="text-muted-foreground mt-1">
                  This category enables embedded SoundCloud audio and YouTube
                  video players. It remains disabled unless you explicitly
                  enable Third-party media.
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-6">
              You can accept all optional categories, reject them, or enable
              categories individually. Your choice to enable Analytics is
              independent of your choice to enable Third-party media.
            </p>

            <p className="text-muted-foreground mt-4">
              You can review or change your choices at any time using the Cookie
              Settings control available on the website. You can also clear
              browser storage through your browser settings.
            </p>

            <p className="text-muted-foreground mt-4">
              The duration and availability of third-party cookies may depend on
              the relevant provider, your browser settings, and the technologies
              enabled. Further information is available through the
              providers&apos; privacy and cookie policies.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Data retention</h2>

            <p className="text-muted-foreground">
              I retain personal information only for as long as reasonably
              necessary for the purpose for which it was collected, subject to
              applicable legal obligations.
            </p>

            <ul className="text-muted-foreground mt-4 list-disc space-y-3 pl-6">
              <li>
                <strong className="text-foreground">Contact messages:</strong>{" "}
                retained while necessary to address the inquiry and related
                follow-up, then deleted unless further retention is justified.
              </li>

              <li>
                <strong className="text-foreground">
                  Newsletter subscriptions:
                </strong>{" "}
                retained while you remain subscribed. Limited unsubscribe or
                consent records may be kept when necessary for compliance and
                suppression purposes.
              </li>

              <li>
                <strong className="text-foreground">Analytics data:</strong>{" "}
                retained according to the retention settings configured in
                Google Analytics and applicable Google policies.
              </li>

              <li>
                <strong className="text-foreground">Technical logs:</strong>{" "}
                retained according to operational security needs and the
                applicable hosting provider&apos;s retention arrangements.
              </li>

              <li>
                <strong className="text-foreground">Cookie preferences:</strong>{" "}
                stored in your browser until cleared, replaced, or invalidated
                by an update to the consent system.
              </li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              11. International data transfers
            </h2>

            <p className="text-muted-foreground">
              Some service providers used by this website operate
              internationally or may process personal information outside the
              European Economic Area (EEA).
            </p>

            <p className="text-muted-foreground mt-4">
              Where personal information is transferred outside the EEA,
              applicable transfer mechanisms may include European Commission
              adequacy decisions, the EU-US Data Privacy Framework for
              appropriately certified organizations, or Standard Contractual
              Clauses and supplementary safeguards where required.
            </p>

            <p className="text-muted-foreground mt-4">
              The applicable mechanism depends on the provider, the processing
              activity, and the destination. You can contact me for information
              about the safeguards relevant to your personal information.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              12. Your privacy rights
            </h2>

            <p className="text-muted-foreground">
              Subject to applicable conditions under the GDPR, you may have the
              right to:
            </p>

            <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-6">
              <li>Request access to your personal information.</li>
              <li>
                Request correction of inaccurate or incomplete information.
              </li>
              <li>Request deletion of personal information.</li>
              <li>Request restriction of processing.</li>
              <li>Object to processing based on legitimate interests.</li>
              <li>Request data portability where applicable.</li>
              <li>
                Withdraw consent at any time where processing is based on
                consent.
              </li>
              <li>
                Lodge a complaint with a data protection supervisory authority.
              </li>
            </ul>

            <p className="text-muted-foreground mt-4">
              To exercise your rights, email{" "}
              <a
                href={emailLink}
                className="text-foreground underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              . I may need to verify your identity before fulfilling certain
              requests.
            </p>

            <p className="text-muted-foreground mt-4">
              As I am based in Poland, you may contact the Polish supervisory
              authority, the President of the Personal Data Protection Office
              (Prezes Urzędu Ochrony Danych Osobowych, UODO).
            </p>

            <p className="text-muted-foreground mt-4">
              Website:{" "}
              <a
                href="https://uodo.gov.pl/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground inline-flex items-center gap-1 underline underline-offset-4"
              >
                uodo.gov.pl
                <ArrowUpRight className="size-3.5" />
              </a>
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              13. Automated decision-making
            </h2>

            <p className="text-muted-foreground">
              I do not use personal information collected through this website
              to make decisions based solely on automated processing that
              produce legal or similarly significant effects on individuals.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">14. Data security</h2>

            <p className="text-muted-foreground">
              I take reasonable technical and organizational measures to protect
              personal information against unauthorized access, alteration,
              disclosure, or loss.
            </p>

            <p className="text-muted-foreground mt-4">
              These measures include using established hosting and email service
              providers and limiting access to personal information to what is
              necessary for the purposes described in this policy.
            </p>

            <p className="text-muted-foreground mt-4">
              No method of transmitting or storing information online can
              guarantee absolute security.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              15. External websites
            </h2>

            <p className="text-muted-foreground">
              This website may contain links to third-party platforms, including
              Spotify, SoundCloud, YouTube, Instagram, and other external
              services.
            </p>

            <p className="text-muted-foreground mt-4">
              When you follow an external link, you leave this website and
              become subject to the privacy practices of the destination
              service. I encourage you to review the relevant privacy policies
              before sharing personal information with those services.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              16. Changes to this policy
            </h2>

            <p className="text-muted-foreground">
              I may update this Privacy Policy to reflect changes in website
              functionality, service providers, privacy practices, or applicable
              legal requirements.
            </p>

            <p className="text-muted-foreground mt-4">
              When changes are made, the &quot;Last updated&quot; date at the
              top of this page will be revised. Where required by law,
              additional notice or renewed consent will be requested.
            </p>
          </section>
        </article>

        {/* Contact */}
        <div className="mt-20 rounded-2xl border border-border bg-muted/30 p-8 md:p-10">
          <h2 className="text-xl font-semibold md:text-2xl">
            Questions about your privacy?
          </h2>

          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            If you have any questions about this policy, how your information is
            handled, or your rights under the GDPR, feel free to get in touch.
          </p>

          <a
            href={emailLink}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
          >
            Contact me
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
