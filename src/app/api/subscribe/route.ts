import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);

    if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
      console.error("Brevo environment variables are missing.");
      return NextResponse.json(
        { error: "Subscription service is unavailable." },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        listIds: [listId],
        updateEnabled: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Brevo subscription failed:",
        response.status,
        await response.text(),
      );

      return NextResponse.json(
        { error: "Unable to subscribe right now." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription request failed:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
