"use client";

import { useRealtime } from "@pocketcomputer/adapters/openai-realtime";
import { useState } from "react";

export default function Home() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isConnecting, isConnected, connect, disconnect, audioElementRef } = useRealtime({
    tokenUrl: "/api/token",
    onError: setErrorMessage,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-black/10 bg-white px-6 py-12 shadow-sm dark:border-white/10 dark:bg-gray-800">
        <h1 className="mb-8 text-center font-mono text-xl font-semibold">npx create-voice-app</h1>

        {/* Audio element */}
        <audio ref={audioElementRef} autoPlay className="hidden" />

        {/* Connect button */}
        <div className="flex justify-center">
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={`h-12 w-40 rounded-lg border border-white/5 font-semibold text-white ${
              isConnected
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:enabled:bg-blue-700 disabled:opacity-70"
            } `}
          >
            {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-8 w-full max-w-md overflow-hidden break-words rounded-lg border border-red-600/10 bg-red-200/10 px-6 py-4 text-red-600 shadow-sm dark:border-white/10 dark:bg-red-600/50 dark:text-white">
          {errorMessage}
        </div>
      )}
    </main>
  );
}
