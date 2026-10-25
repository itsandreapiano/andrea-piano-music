import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const email = typeof body.email === "string" ? body.email.trim() : "";

    const message = typeof body.message === "string" ? body.message.trim() : "";

    const privacy = body.privacy === true;

    // Honeypot field: legitimate visitors leave this empty.
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    if (
      !name ||
      name.length > 120 ||
      !EMAIL_REGEX.test(email) ||
      email.length > 254 ||
      !message ||
      message.length > 5000 ||
      !privacy
    ) {
      return NextResponse.json(
        { error: "Please check your form details." },
        { status: 400 },
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      console.error("Brevo configuration is missing.");

      return NextResponse.json(
        { error: "Email service is unavailable." },
        { status: 500 },
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "Andrea Piano Music",
          email: senderEmail,
        },
        to: [
          {
            email: "itsandreapiano@gmail.com",
          },
        ],
        replyTo: {
          name,
          email,
        },
        subject: `New website message from ${name}`,
        htmlContent: `
            <h2>New contact form submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
          `,
        textContent: [
          "New contact form submission",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Brevo contact email failed:",
        response.status,
        await response.text(),
      );

      return NextResponse.json(
        { error: "Unable to send your message. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
