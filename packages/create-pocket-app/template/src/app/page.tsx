"use client";

import { useRealtime } from "@pocketcomputer/adapters/openai-realtime";
import { useState } from "react";

export default function Home() {
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isConnecting, isConnected, connect, disconnect, audioElementRef } = useRealtime({
    tokenUrl: "/api/token",
    isDebug: process.env.NODE_ENV === "development",
    onDisplay: setDisplayMessage,
    onError: setErrorMessage,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex grow flex-col items-center justify-center">
        <section className="my-8 w-full">
          <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            {/* Display message */}
            {displayMessage && (
              <div className="mx-auto max-w-md overflow-hidden break-words rounded-lg border border-blue-600/10 bg-blue-200/10 p-6 text-center shadow-sm dark:border-white/10 dark:bg-blue-600/20">
                <h2 className="whitespace-pre-wrap text-lg font-medium text-blue-600 dark:text-white">
                  {displayMessage}
                </h2>
              </div>
            )}

            {/* Main panel */}
            <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-black/10 bg-white px-6 py-12 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <h1 className="mb-8 text-center font-mono text-xl font-medium">npx create-pocket-app</h1>

              {/* Audio element */}
              <audio ref={audioElementRef} autoPlay className="hidden" />

              {/* Connect button */}
              <div className="flex justify-center">
                <button
                  onClick={isConnected ? disconnect : connect}
                  disabled={isConnecting}
                  className={`h-12 w-40 rounded-lg border border-white/5 font-medium text-white ${
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
              <div className="mx-auto flex max-w-md overflow-hidden break-words rounded-lg border border-red-600/10 bg-red-200/10 shadow-sm dark:border-white/10 dark:bg-red-600/50">
                <div className="grow py-4 pl-6 text-red-600 dark:text-white">{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="flex items-center px-6 text-red-600 dark:text-white"
                  aria-label="Close"
                >
                  <span className="font-medium">✕</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mb-6 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Powered by{" "}
            <a
              href="https://pocketcomputer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Pocket Computer
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
