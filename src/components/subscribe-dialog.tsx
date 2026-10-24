"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SubscribeDialogProps = {
  children: React.ReactNode;
};

export function SubscribeDialog({ children }: SubscribeDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(true);
      setEmail("");
      setMessage("You're on the list! Thanks for subscribing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setMessage("");
          setSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sign up for updates</DialogTitle>

          <DialogDescription>
            New music, upcoming releases, and a little behind the scenes.
            Straight to your inbox.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <p className="py-6 text-center text-sm">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <p className="text-muted-foreground text-xs leading-relaxed">
              By subscribing, you agree to receive occasional music updates. You
              can unsubscribe anytime. Read the{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground transition-opacity"
              >
                Privacy Policy
              </Link>{" "}
              to learn how your data is handled.
            </p>

            {message && (
              <p role="alert" className="text-destructive text-sm">
                {message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
