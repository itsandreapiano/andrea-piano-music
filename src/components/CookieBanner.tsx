"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  media: boolean;
};

type StoredCookieConsent = CookieConsent & {
  version: number;
};

const STORAGE_KEY = "cookie-consent";
const CONSENT_EVENT = "cookie-consent-updated";
const SETTINGS_EVENT = "open-cookie-settings";

const CONSENT_VERSION = 3;

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  media: false,
};

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (
      !("version" in parsed) ||
      !("analytics" in parsed) ||
      !("media" in parsed) ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.media !== "boolean"
    ) {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      media: parsed.media,
    };
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [hasSavedConsent, setHasSavedConsent] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const [preferences, setPreferences] =
    useState<CookieConsent>(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = getCookieConsent();

    if (stored) {
      setPreferences(stored);
      setHasSavedConsent(true);
      setVisible(false);
    } else {
      setPreferences(DEFAULT_CONSENT);
      setHasSavedConsent(false);
      setVisible(true);
    }

    const openSettings = () => {
      const saved = getCookieConsent();

      setPreferences(saved ?? DEFAULT_CONSENT);
      setHasSavedConsent(Boolean(saved));
      setStorageError(false);
      setCustomizing(true);
      setVisible(true);
    };

    window.addEventListener(SETTINGS_EVENT, openSettings);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, openSettings);
    };
  }, []);

  function saveConsent(consent: CookieConsent) {
    const updatedConsent: CookieConsent = {
      necessary: true,
      analytics: consent.analytics,
      media: consent.media,
    };

    const storedConsent: StoredCookieConsent = {
      ...updatedConsent,
      version: CONSENT_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConsent));

      // Confirm that the choice was actually persisted.
      const saved = getCookieConsent();

      if (
        !saved ||
        saved.analytics !== updatedConsent.analytics ||
        saved.media !== updatedConsent.media
      ) {
        throw new Error("Consent could not be saved.");
      }

      setPreferences(updatedConsent);
      setHasSavedConsent(true);
      setStorageError(false);
      setVisible(false);
      setCustomizing(false);

      window.dispatchEvent(
        new CustomEvent(CONSENT_EVENT, {
          detail: updatedConsent,
        }),
      );
    } catch {
      setStorageError(true);
      setVisible(true);

      // Do not claim that consent was saved.
      // Existing saved preferences remain unchanged.
    }
  }

  function closeSettings() {
    if (!hasSavedConsent) return;

    setPreferences(getCookieConsent() ?? DEFAULT_CONSENT);
    setStorageError(false);
    setVisible(false);
    setCustomizing(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto sm:w-full">
      <div className="border-border bg-background/95 rounded-2xl border p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
              {customizing ? (
                <Settings2 className="size-5" />
              ) : (
                <Cookie className="size-5" />
              )}
            </div>

            <h2 className="text-lg font-semibold tracking-tight">
              {customizing ? "Cookie preferences" : "A note about cookies"}
            </h2>
          </div>

          {hasSavedConsent && (
            <button
              type="button"
              onClick={closeSettings}
              aria-label="Close cookie settings"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {!customizing ? (
          <>
            <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
              This website uses essential technologies and optional services for
              analytics and embedded media. You can choose which technologies to
              allow. Learn more in the{" "}
              <Link
                href="/privacy"
                className="text-foreground cursor-pointer underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => saveConsent(DEFAULT_CONSENT)}
                className="flex-1 cursor-pointer"
              >
                Reject optional
              </Button>

              <Button
                onClick={() =>
                  saveConsent({
                    necessary: true,
                    analytics: true,
                    media: true,
                  })
                }
                className="flex-1 cursor-pointer"
              >
                Accept all
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="text-muted-foreground hover:text-foreground mt-4 flex w-full cursor-pointer items-center justify-center gap-2 text-xs transition-colors"
            >
              <Settings2 className="size-3.5" />
              Customize preferences
            </button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
              Choose which optional technologies you&apos;d like to allow.
              Essential functionality is always enabled. You can change your
              choices anytime.
            </p>

            <div className="divide-border mb-6 divide-y border-y">
              <PreferenceRow
                title="Essential"
                description="Required for basic website functionality and remembering your privacy preferences."
                checked
                disabled
              />

              <PreferenceRow
                title="Analytics"
                description="Allows Google Analytics 4 to measure website visits, interactions, and traffic sources. Google may process online identifiers and technical information."
                checked={preferences.analytics}
                onChange={(analytics) =>
                  setPreferences((prev) => ({
                    ...prev,
                    analytics,
                  }))
                }
              />

              <PreferenceRow
                title="Third-party media"
                description="Allows embedded YouTube videos and SoundCloud audio playback. These providers may process technical information and use cookies or similar technologies."
                checked={preferences.media}
                onChange={(media) =>
                  setPreferences((prev) => ({
                    ...prev,
                    media,
                  }))
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => saveConsent(DEFAULT_CONSENT)}
                className="flex-1 cursor-pointer"
              >
                Reject optional
              </Button>

              <Button
                onClick={() => saveConsent(preferences)}
                className="flex-1 cursor-pointer"
              >
                Save choices
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
              Read the{" "}
              <Link
                href="/privacy"
                className="text-foreground cursor-pointer underline underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              for more information.
            </p>
          </>
        )}

        {storageError && (
          <p role="alert" className="mt-4 text-xs leading-relaxed text-red-500">
            Your preferences could not be saved in this browser. Please check
            your browser&apos;s storage settings and try again.
          </p>
        )}
      </div>
    </div>
  );
}

type PreferenceRowProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: PreferenceRowProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 py-4 ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="accent-primary size-4 shrink-0 cursor-pointer disabled:cursor-default"
      />
    </label>
  );
}
