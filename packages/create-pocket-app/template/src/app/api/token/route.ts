import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
    }

    const { model, voice } = await request.json();

    if (!model || !voice) {
      return NextResponse.json({ error: "Request body is invalid" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instructions: "",
        model,
        voice,
        input_audio_noise_reduction: {
          type: "far_field",
        },
        input_audio_transcription: {
          model: "gpt-4o-transcribe",
        },
        turn_detection: {
          type: "semantic_vad",
        },
      }),
    });

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({}));
      throw new Error(error?.message || "An unknown error occurred");
    }

    const { client_secret: token } = await response.json();

    if (!token) {
      throw new Error("Token not found in response");
    }

    return NextResponse.json(token);
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching token:", error);

    return NextResponse.json({ error: `Failed to retrieve token: ${errorText}` }, { status: 500 });
  }
}
