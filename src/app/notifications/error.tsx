"use client";

import Link from "next/link";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="app-shell">
      <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <h2>Notifications temporarily unavailable</h2>
        <p>We encountered an issue loading your notifications.</p>
        <button
          onClick={() => {
            reset();
            window.location.reload();
          }}
          className="button button-primary"
        >
          Try again
        </button>
        <Link href="/" className="button button-ghost" style={{ marginLeft: "8px" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
