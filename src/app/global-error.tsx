"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans text-gray-900 antialiased">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-orange-100 text-orange-600">
            <AlertTriangle className="size-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Critical Application Error
          </h1>
          <p className="mt-2 text-xs text-gray-600">
            A critical error interrupted page rendering. Please reload the application.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-600 px-5 text-xs font-bold text-white transition hover:bg-orange-700"
            >
              <RefreshCw className="size-3.5" /> Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

