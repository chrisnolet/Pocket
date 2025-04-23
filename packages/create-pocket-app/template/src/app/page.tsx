"use client";

import { App } from "@/lib/app";
import { useRealtime } from "@pocketcomputer/adapters/openai-realtime";
import { Context } from "@pocketcomputer/core";
import { useState } from "react";

export default function Home() {
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReady = async (c: Context) => {
    const app = new App();
    await app.main(c);
  };

  const handleTranscript = (itemId: string, role: "user" | "assistant", text: string) => {
    console.log(text);
  };

  const { isConnecting, isConnected, connect, disconnect, audioElementRef } = useRealtime({
    tokenUrl: "/api/token",
    voice: "marin",
    isDebug: process.env.NODE_ENV === "development",
    onReady: handleReady,
    onTranscript: handleTranscript,
    onDisplay: setDisplayMessage,
    onError: setErrorMessage,
  });

  return (
    <main className="flex min-h-screen flex-col">
      <section className="bg-gradient-to-b from-blue-50 to-white pt-24 sm:pt-32 lg:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Create voice AI apps
            </h1>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-600 sm:text-4xl">
              Low&nbsp;latency. Fast&nbsp;iteration.
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-xl text-gray-500">
              Voice AI apps are complex to build. We made it simple. Create interactions that feel natural
              with just a few lines of code.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          {displayMessage && (
            <div className="mx-auto max-w-lg overflow-hidden break-words rounded-2xl border border-blue-600 bg-blue-50 p-6 text-center shadow-lg">
              <h3 className="whitespace-pre-wrap text-lg font-medium text-blue-600">{displayMessage}</h3>
            </div>
          )}

          {errorMessage && (
            <div className="mx-auto flex max-w-lg overflow-hidden break-words rounded-2xl border border-red-600 bg-red-50 shadow-lg">
              <p className="grow py-4 pl-6 text-red-600">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="flex cursor-pointer items-center px-6 text-red-600"
                aria-label="Close"
              >
                <span className="font-medium">✕</span>
              </button>
            </div>
          )}

          <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg sm:p-8">
            <audio ref={audioElementRef} autoPlay className="hidden" />

            <h3 className="mb-4 text-center text-xl font-semibold text-gray-900">Example Voice App</h3>
            <p className="mb-8 text-center text-gray-600">
              Customize <code>app.ts</code> to create your own AI experience.
            </p>

            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`w-full cursor-pointer rounded-lg px-6 py-3 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:shadow-none ${
                isConnected
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
              }`}
            >
              {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
