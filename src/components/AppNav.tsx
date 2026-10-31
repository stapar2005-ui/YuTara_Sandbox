"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { YuTaraLogo } from "./YuTaraLogo";
import { clearStoredSession, DemoUser } from "@/lib/demo-auth";
import { setStoredTheme } from "@/lib/theme";
import { notificationsFor } from "@/lib/notifications";
import { readProperties } from "@/lib/property-store";
import { useAutoHideHeader } from "@/lib/use-auto-hide-header";

export function AppNav({ session }: { session: DemoUser | null }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const headerHidden = useAutoHideHeader();

  useEffect(() => {
    const sync = () =>
      setCount(notificationsFor(session?.email ?? null, readProperties()).total);
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, [session]);

  function logout() {
    clearStoredSession();
    // Theme is a personal preference: reset to light so it never leaks to the
    // next person who signs in on this device.
    setStoredTheme("light");
    router.replace("/");
  }
  return (
    <header className={`topbar ${headerHidden ? "topbar-hidden" : ""}`}>
      <div className="container nav">
        <Link className="brand" href="/">
          <YuTaraLogo priority />
        </Link>
        <div className="nav-actions">
          {session ? (
            <>
              <Link
                className="icon-button notif-trigger"
                href="/dashboard"
                aria-label={`Notifications (${count})`}
              >
                <Bell size={19} />
                {count > 0 && <span className="notif-badge">{count}</span>}
              </Link>
              <Link className="button button-ghost" href="/dashboard">
                Dashboard
              </Link>
              <button className="button button-primary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="button button-ghost" href="/login">
                Login
              </Link>
              <Link className="button button-primary" href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
