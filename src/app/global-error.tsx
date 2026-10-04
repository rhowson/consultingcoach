"use client";

// Last-resort boundary (the root layout itself failed), so it can't rely on app styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-GB">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", maxWidth: 480, margin: "0 auto", color: "#111827" }}>
        <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
        <p>Please try again. Your work is saved.</p>
        <button onClick={reset} style={{ padding: "10px 18px", background: "#0B3D5C", color: "#fff", border: 0, borderRadius: 6, fontWeight: 600 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
