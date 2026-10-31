"use client";

import { useState, type FormEvent } from "react";
import {
  Mail,
  MapPin,
  PhoneCall,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ScrollView } from "./scroll-view";

type FormStatus = "idle" | "loading" | "success" | "error";

type FormValues = {
  name: string;
  email: string;
  message: string;
  privacy: boolean;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  message: "",
  privacy: false,
};

function isValidFullName(value: string): boolean {
  const name = value.trim().replace(/\s+/g, " ");

  const regex =
    /^[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*(?: +[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*)+$/u;

  return name.length >= 3 && name.length <= 120 && regex.test(name);
}

function isValidEmail(value: string): boolean {
  const email = value.trim();

  const regex =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

  return email.length <= 254 && regex.test(email);
}

function isValidMessage(value: string): boolean {
  const message = value.trim().replace(/\s+/g, " ");

  return (
    message.length >= 50 &&
    message.length <= 5000 &&
    /[\p{L}\p{N}]/u.test(message)
  );
}

function validateField(
  field: keyof FormValues,
  value: string | boolean,
): string {
  switch (field) {
    case "name":
      if (!String(value).trim()) {
        return "Full name is required.";
      }

      if (!isValidFullName(String(value))) {
        return "Please enter a valid first name and surname.";
      }

      return "";

    case "email":
      if (!String(value).trim()) {
        return "Email address is required.";
      }

      if (!isValidEmail(String(value))) {
        return "Please enter a valid email address (e.g. name@example.com).";
      }

      return "";

    case "message":
      if (!String(value).trim()) {
        return "Message is required.";
      }

      if (!isValidMessage(String(value))) {
        return "Please write a meaningful message of at least 50 characters.";
      }

      return "";

    case "privacy":
      return value === true ? "" : "Please acknowledge the Privacy Policy.";
  }
}

export default function Contact() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormValues, boolean>>
  >({});

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitted = status === "success";
  const isLoading = status === "loading";
  const isFormDisabled = isSubmitted || isLoading;

  function updateField(field: keyof FormValues, value: string | boolean) {
    if (isFormDisabled) return;

    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }

    if (touched[field] || errors[field]) {
      const error = validateField(field, value);

      setErrors((previous) => ({
        ...previous,
        [field]: error,
      }));
    }
  }

  function handleBlur(field: keyof FormValues) {
    if (isFormDisabled) return;

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: validateField(field, values[field]),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isFormDisabled) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const newErrors: FieldErrors = {
      name: validateField("name", values.name),
      email: validateField("email", values.email),
      message: validateField("message", values.message),
      privacy: validateField("privacy", values.privacy),
    };

    setErrors(newErrors);

    setTouched({
      name: true,
      email: true,
      message: true,
      privacy: true,
    });

    if (Object.values(newErrors).some(Boolean)) {
      setStatus("error");
      setErrorMessage("");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.trim().replace(/\s+/g, " "),
          email: values.email.trim(),
          message: values.message.trim(),
          privacy: values.privacy,
          website: formData.get("website"),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send your message.");
      }

      // Preserve submitted values in disabled fields.
      setValues((previous) => ({
        ...previous,
        name: previous.name.trim().replace(/\s+/g, " "),
        email: previous.email.trim(),
        message: previous.message.trim(),
      }));

      setErrors({});
      setTouched({});
      setErrorMessage("");
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );

      setStatus("error");
    }
  }

  return (
    <section className="py-16 md:py-32 bg-gray-50 dark:bg-transparent">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
          <div className="lg:col-span-2">
            <div className="md:pr-6 lg:pr-0 mt-8">
              <ScrollView>
                <h2 className="text-4xl font-semibold lg:text-5xl">
                  Get in touch
                </h2>
              </ScrollView>

              <ScrollView delay={0.1}>
                <p className="text-muted-foreground mt-6">
                  Music is all about connections, sharing ideas, and creating
                  something together. I&apos;m always open to meeting fellow
                  musicians, exploring new collaborations, and seeing where the
                  flow can take us. Got something in mind?{" "}
                  <span className="text-foreground">
                    I&apos;d love to hear from you!
                  </span>
                </p>
              </ScrollView>
            </div>

            <ScrollView delay={0.2}>
              <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
                <li>
                  <Link
                    href="mailto:itsandreapiano@gmail.com"
                    className="hover:text-accent-foreground"
                  >
                    <Mail className="size-5 mr-2 inline" />
                    <span>itsandreapiano@gmail.com</span>
                  </Link>
                </li>

                {/* <li>
                  <Link
                    href="tel:+48600967307"
                    className="hover:text-accent-foreground"
                  >
                    <PhoneCall className="size-5 mr-2 inline" />
                    <span>+48 600 967 307</span>
                  </Link>
                </li> */}

                <li>
                  <div>
                    <MapPin className="size-5 mr-2 inline" />
                    <span>Poznań, Poland</span>
                  </div>
                </li>
              </ul>
            </ScrollView>
          </div>

          <div className="lg:col-span-3">
            <ScrollView>
              <Card className="mx-auto mt-12 max-w-lg p-8 shadow-md sm:p-16 w-full">
                <div>
                  <h3 className="text-lg font-semibold">Let&apos;s connect</h3>

                  <p className="text-muted-foreground mt-4 text-sm">
                    Have an idea, a project, or simply something you&apos;d like
                    to share? Drop me a message and let&apos;s see where it
                    goes.
                  </p>
                </div>

                <form
                  noValidate
                  onSubmit={handleSubmit}
                  className="**:[&>label]:block mt-12 space-y-6 *:space-y-3"
                >
                  {/* Full name */}
                  <div>
                    <Label htmlFor="name">Full name</Label>

                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={values.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      onBlur={() => handleBlur("name")}
                      maxLength={120}
                      autoComplete="name"
                      disabled={isFormDisabled}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={
                        errors.name
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />

                    {errors.name && (
                      <span
                        id="name-error"
                        className="block text-xs text-red-500"
                        role="alert"
                      >
                        {errors.name}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email</Label>

                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={values.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      onBlur={() => handleBlur("email")}
                      maxLength={254}
                      autoComplete="email"
                      disabled={isFormDisabled}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      className={
                        errors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />

                    {errors.email && (
                      <span
                        id="email-error"
                        className="block text-xs text-red-500"
                        role="alert"
                      >
                        {errors.email}
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="msg">Message</Label>

                    <Textarea
                      id="msg"
                      name="message"
                      rows={4}
                      value={values.message}
                      onChange={(event) =>
                        updateField("message", event.target.value)
                      }
                      onBlur={() => handleBlur("message")}
                      maxLength={5000}
                      disabled={isFormDisabled}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "message-error" : undefined
                      }
                      className={`min-h-25 resize-y disabled:cursor-default ${
                        errors.message
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />

                    {errors.message && (
                      <span
                        id="message-error"
                        className="block text-xs text-red-500"
                        role="alert"
                      >
                        {errors.message}
                      </span>
                    )}
                  </div>

                  {/* Honeypot */}
                  <div aria-hidden="true" className="absolute -left-[9999px]">
                    <label htmlFor="contact-website">Website</label>

                    <input
                      id="contact-website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      disabled={isFormDisabled}
                    />
                  </div>

                  {/* Privacy */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacy"
                        name="privacy"
                        checked={values.privacy}
                        onChange={(event) =>
                          updateField("privacy", event.target.checked)
                        }
                        onBlur={() => handleBlur("privacy")}
                        disabled={isFormDisabled}
                        aria-invalid={Boolean(errors.privacy)}
                        aria-describedby={
                          errors.privacy ? "privacy-error" : undefined
                        }
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-foreground ${
                          isFormDisabled ? "cursor-default" : "cursor-pointer"
                        }`}
                      />

                      <Label
                        htmlFor="privacy"
                        className={`text-muted-foreground text-xs leading-relaxed font-normal ${
                          isFormDisabled ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <span>
                          I acknowledge that my personal information will be
                          processed to respond to my message, as described in
                          the{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground cursor-pointer underline underline-offset-4 transition-colors hover:text-primary"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </Label>
                    </div>

                    {errors.privacy && (
                      <span
                        id="privacy-error"
                        className="block text-xs text-red-500"
                        role="alert"
                      >
                        {errors.privacy}
                      </span>
                    )}
                  </div>

                  {/* Submission state */}
                  {isSubmitted ? (
                    <div className="space-y-5">
                      <div role="status" className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="size-5 shrink-0" />

                          <span className="font-medium">
                            Message sent successfully!
                          </span>
                        </div>

                        <p className="text-muted-foreground text-sm">
                          Thank you for reaching out! Your message has been
                          received. I&apos;ll be in touch!
                        </p>
                      </div>

                      <Button asChild>
                        <Link href="/music">
                          <ArrowLeft className="mr-2 size-4" />
                          Back to Music
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={
                          isLoading
                            ? "cursor-not-allowed opacity-60 transition-opacity"
                            : "cursor-pointer transition-opacity"
                        }
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          "Submit"
                        )}
                      </Button>

                      {status === "error" && errorMessage && (
                        <p
                          role="alert"
                          className="text-sm text-red-600 dark:text-red-400"
                        >
                          {errorMessage}
                        </p>
                      )}
                    </>
                  )}
                </form>
              </Card>
            </ScrollView>
          </div>
        </div>
      </div>
    </section>
  );
}
