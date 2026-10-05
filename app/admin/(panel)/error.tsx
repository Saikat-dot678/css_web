"use client";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="admin-content" id="main"><section className="admin-panel">
    <h1>This section could not load.</h1>
    <p>Please try again. If the issue continues, share the reference below with the site administrator.</p>
    {error.digest && <p>Reference: {error.digest}</p>}
    <button className="admin-primary" onClick={() => retry()}>Try again</button>
  </section></main>;
}
