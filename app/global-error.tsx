"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Application error</h1>
        <p>An unexpected error occurred.</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
