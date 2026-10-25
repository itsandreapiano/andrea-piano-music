"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

import { getCookieConsent } from "@/components/CookieBanner";

const MEASUREMENT_ID = "G-0PHJHCQE8N";
const CONSENT_EVENT = "cookie-consent-updated";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    "ga-disable-G-0PHJHCQE8N"?: boolean;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [enabled, setEnabled] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const updateConsent = () => {
      const allowed = getCookieConsent()?.analytics === true;

      window["ga-disable-G-0PHJHCQE8N"] = !allowed;

      setEnabled(allowed);
    };

    updateConsent();

    window.addEventListener(CONSENT_EVENT, updateConsent);

    return () => {
      window.removeEventListener(CONSENT_EVENT, updateConsent);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !scriptLoaded || !window.gtag) return;

    const query = searchParams.toString();
    const pagePath = pathname + (query ? `?${query}` : "");

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [enabled, scriptLoaded, pathname, searchParams]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />

      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
