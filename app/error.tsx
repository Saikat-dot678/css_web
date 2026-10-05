"use client";

export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main id="main" className="wrap" style={{ paddingBlock: "6rem" }}>
    <h1>This page is temporarily unavailable.</h1>
    <p>Please try again in a moment.</p>
    {error.digest && <p>Reference: {error.digest}</p>}
    <button onClick={() => retry()}>Try again</button>
  </main>;
}
