"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, X, ChevronRight } from "lucide-react";
import { YuTaraLogo } from "./YuTaraLogo";
import { clearStoredSession, DemoUser } from "@/lib/demo-auth";
import { setStoredTheme } from "@/lib/theme";
import {
  readNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
  type Notification,
} from "@/lib/notification-service";
import { useAutoHideHeader } from "@/lib/use-auto-hide-header";

export function AppNav({ session }: { session: DemoUser | null }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const headerHidden = useAutoHideHeader();

  useEffect(() => {
    const sync = async () => {
      if (session?.email) {
        const c = await unreadCount(session.email);
        setCount(c);
        const notifs = await readNotifications(session.email);
        setNotifications(notifs);
      }
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, [session]);

  const isAgency = session?.role.startsWith("AGENCY") ?? false;
  const isAdmin = session?.role === "ADMIN";
  const workspaceHref = isAdmin ? "/?view=admin#land-listings" : isAgency ? "/agency" : "/marketplace";
  const workspaceLabel = isAdmin ? "Land Listings" : isAgency ? "Agency Portal" : "My YuTara";

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  }

  function logout() {
    clearStoredSession();
    setStoredTheme("light");
    window.location.replace("/");
  }

  return (
    <header className={`topbar ${headerHidden ? "topbar-hidden" : ""}`}>
      <div className="container nav">
        <Link className="brand" href="/">
          <YuTaraLogo priority />
        </Link>
        <nav className="public-site-links" aria-label="Public pages">
          <Link href="/">Home</Link>
          {!isAdmin && <Link href="/marketplace">Marketplace</Link>}
          <Link href="/about">About Us</Link>
          <Link href="/services">Services Offered</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>
        <div className="nav-actions">
          {session ? (
            <>
              <button
                className="icon-button notif-trigger relative"
                aria-label={`${isAgency ? "Agency Notifications" : "Notifications"} (${count})`}
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (notifications.length === 0 && session?.email) {
                    setNotifLoading(true);
                    readNotifications(session.email).then((notifs) => {
                      setNotifications(notifs);
                      setNotifLoading(false);
                    });
                  }
                }}
              >
                <Bell size={19} />
                {count > 0 && <span className="notif-badge">{count}</span>}
                {notifOpen && (
                  <div className="notif-popover">
                    <div className="notif-popover-header">
                      <h3 style={{ margin: 0, fontSize: "0.875rem", color: "var(--foreground)" }}>
                        {isAgency ? "Agency Notifications" : "Notifications"}
                      </h3>
                      <button
                        className="notif-mark-all"
                        onClick={() => {
                          if (session?.email) {
                            markAllNotificationsRead(session.email).then(() => {
                              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                              setCount(0);
                              setNotifOpen(false);
                            });
                          }
                        }}
                      >
                        Mark all as read
                      </button>
                    </div>
                    {notifLoading ? (
                      <div className="notif-loading">Loading…</div>
                    ) : notifications.length === 0 ? (
                      <div className="notif-empty">
                        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                          No new notifications
                        </p>
                      </div>
                    ) : (
                      <div className="notif-list">
                        {notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.isRead ? "notif-item-unread" : ""}`}
                            onClick={() => {
                              if (!n.isRead && session?.email) {
                                handleMarkRead(n.id);
                              }
                              setNotifOpen(false);
                              if (n.actionUrl) router.push(n.actionUrl);
                            }}
                          >
                            <div className="notif-item-content">
                              <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--foreground)" }}>
                                {n.title}
                              </strong>
                              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
                                {n.description}
                              </p>
                            </div>
                            <span
                              className="notif-item-time"
                              style={{ fontSize: "0.7rem", color: "var(--muted)" }}
                            >
                              {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        ))}
                        {notifications.length > 8 && (
                          <div className="notif-view-all" onClick={() => {
                            setNotifOpen(false);
                            router.push(isAgency ? "/agency" : "/dashboard");
                          }}>
                            View all notifications <ChevronRight size={14} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
              <span className="nav-auth">
                <Link
                  className="button button-ghost"
                  href={workspaceHref}
                >
                  {workspaceLabel}
                </Link>
                {session.role === "USER" && (
                  <Link className="button button-ghost" href="/dashboard">
                    My Properties
                  </Link>
                )}
                <button className="button button-primary" onClick={logout}>
                  Log out
                </button>
              </span>
            </>
          ) : (
            <span className="nav-auth">
              <Link className="button button-ghost" href="/login">
                Log in
              </Link>
              <Link className="button button-primary" href="/register">
                Register
              </Link>
            </span>
          )}
          <button
            className="icon-button nav-toggle"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <div className="mobile-nav" role="menu">
          <Link href="/" onClick={() => setMobileNavOpen(false)}>
            Home
          </Link>
          {!isAdmin && (
            <Link href="/marketplace" onClick={() => setMobileNavOpen(false)}>
              Marketplace
            </Link>
          )}
          <Link href="/about" onClick={() => setMobileNavOpen(false)}>
            About Us
          </Link>
          <Link href="/services" onClick={() => setMobileNavOpen(false)}>
            Services Offered
          </Link>
          <Link href="/contact" onClick={() => setMobileNavOpen(false)}>
            Contact Us
          </Link>
          {session ? (
            <>
              {isAdmin && (
                <>
                  <Link href="/?view=admin#land-listings" onClick={() => setMobileNavOpen(false)}>
                    Land Listings
                  </Link>
                  <Link href="/?view=admin#user-registrations" onClick={() => setMobileNavOpen(false)}>
                    User Registrations
                  </Link>
                </>
              )}
              {!isAdmin && (
                <>
                  <Link
                    href={workspaceHref}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {workspaceLabel}
                  </Link>
                  {session.role === "USER" && (
                    <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>
                      My Properties
                    </Link>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileNavOpen(false)}
              >
                Register
              </Link>
            </>
          )}
          {session && (
            <div className="account-section" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--foreground)", marginBottom: 10 }}>
                Signed in as {session.name}
              </div>
              <button
                className="button button-danger"
                onClick={() => {
                  logout();
                  setMobileNavOpen(false);
                }}
                style={{ width: "100%" }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
