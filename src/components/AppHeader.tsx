"use client";

import { useState } from "react";
import {
  Bell,
  CircleUserRound,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { YuTaraLogo } from "./YuTaraLogo";
import { clearStoredSession, DemoUser } from "@/lib/demo-auth";
import { setStoredTheme } from "@/lib/theme";
import { useAutoHideHeader } from "@/lib/use-auto-hide-header";

interface AppHeaderProps {
  session: DemoUser | null;
  pageTitle: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  isAgency?: boolean;
}

export function AppHeader({
  session,
  pageTitle,
  showSearch = true,
  onSearch,
  isAgency = false,
}: AppHeaderProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const headerHidden = useAutoHideHeader();
  const isAdmin = session?.role === "ADMIN";
  const dashboardHref = isAdmin
    ? "/?view=admin"
    : isAgency
      ? "/agency"
      : "/marketplace";
  const dashboardLabel = isAdmin
    ? "Land Listings"
    : isAgency
      ? "Agency Portal"
      : "Marketplace";

  const handleLogout = () => {
    clearStoredSession();
    setStoredTheme("light");
    setMobileNavOpen(false);
    setAccountMenuOpen(false);
    setNotifOpen(false);
    window.location.replace("/");
  };

  return (
    <>
      <header
        className={`app-header ${headerHidden ? "header-hidden" : ""}`}
      >
        <div className="app-header-inner">
          <div className="app-header-left">
            {!session && (
              <button
                className="header-brand"
                onClick={() => router.push("/")}
              >
                <YuTaraLogo priority />
              </button>
            )}
            {session && (
              <button
                className="header-brand"
                onClick={() => router.push(dashboardHref)}
              >
                <YuTaraLogo priority />
              </button>
            )}
            <div className="header-page-title">{pageTitle}</div>
          </div>
          <div className="app-header-center">
            {showSearch && (
              <div className="header-search">
                <Search size={16} />
                <input
                  className="header-search-input"
                  type="text"
                  placeholder="Search properties…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && onSearch) {
                      onSearch(query);
                    }
                  }}
                />
                {query && (
                  <button
                    className="header-search-clear"
                    onClick={() => {
                      setQuery("");
                      if (onSearch) onSearch("");
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="app-header-right">
            {session && (
              <>
                <button
                  className="header-icon-btn"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell size={18} />
                  {notifOpen && (
                    <div className="header-notif-popover">
                      <div className="header-notif-header">
                        <span className="header-notif-title">Notifications</span>
                        <button
                          className="header-notif-mark-all"
                          onClick={() => setNotifOpen(false)}
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="header-notif-empty">
                        <p className="header-notif-empty-text">
                          No new notifications
                        </p>
                      </div>
                      <button
                        className="header-notif-view-all"
                        onClick={() => {
                          setNotifOpen(false);
                          router.push("/notifications");
                        }}
                      >
                        View all notifications <span>→</span>
                      </button>
                    </div>
                  )}
                </button>
                <div className="header-account-trigger">
                  <button
                    className="header-avatar-trigger"
                    aria-label="Account menu"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  >
                    <CircleUserRound size={20} />
                  </button>
                  {accountMenuOpen && (
                    <div className="header-account-menu">
                      {isAdmin && (
                        <Link
                          href="/?view=admin"
                          className="header-account-menu-item"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Land Listings
                        </Link>
                      )}
                      {!isAdmin && (
                        <Link
                          href={dashboardHref}
                          className="header-account-menu-item"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          {dashboardLabel}
                        </Link>
                      )}
                      {session.role === "USER" && (
                        <Link
                          href="/dashboard"
                          className="header-account-menu-item"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          My Properties
                        </Link>
                      )}
                      <button
                        className="header-account-menu-item"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          router.push("/profile");
                        }}
                      >
                        Profile & Settings
                      </button>
                      <hr className="header-account-menu-divider" />
                      <button
                        className="header-account-menu-item header-account-menu-logout"
                        onClick={handleLogout}
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!session && (
              <span className="header-auth-links">
                <Link href="/login" className="header-link ghost">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="header-link primary"
                >
                  Get started
                </Link>
              </span>
            )}
            <button
              className="header-mobile-toggle"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="header-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}
      {mobileNavOpen && (
        <div className="header-mobile-drawer">
          <div className="header-mobile-drawer-header">
            <button
              className="header-mobile-drawer-close"
              onClick={() => setMobileNavOpen(false)}
            >
              <X size={20} />
            </button>
            <div className="header-mobile-brand">
              {isAdmin ? "Admin Workspace" : isAgency ? "Agency Portal" : session ? "My YuTara" : "YuTara"}
            </div>
          </div>
          <nav className="header-mobile-drawer-nav">
            {!session ? (
              <>
                <Link href="/" onClick={() => setMobileNavOpen(false)}>
                  Home
                </Link>
                <Link href="/marketplace" onClick={() => setMobileNavOpen(false)}>
                  Marketplace
                </Link>
                <Link href="/about" onClick={() => setMobileNavOpen(false)}>
                  About Us
                </Link>
                <Link href="/services" onClick={() => setMobileNavOpen(false)}>
                  Services Offered
                </Link>
                <Link href="/contact" onClick={() => setMobileNavOpen(false)}>
                  Contact Us
                </Link>
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Get started
                </Link>
              </>
            ) : (
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
                  <Link href={dashboardHref} onClick={() => setMobileNavOpen(false)}>
                    {dashboardLabel}
                  </Link>
                )}
                {session.role === "USER" && (
                  <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>
                    My Properties
                  </Link>
                )}
                {session.role === "USER" && (
                  <Link href="/marketplace/map" onClick={() => setMobileNavOpen(false)}>
                    Map View
                  </Link>
                )}
                {!isAdmin && !isAgency && (
                  <>
                    <Link href="/saved-lands" onClick={() => setMobileNavOpen(false)}>
                      Saved Lands
                    </Link>
                    <Link href="/inquiries" onClick={() => setMobileNavOpen(false)}>
                      Inquiries
                    </Link>
                    <Link href="/bookings" onClick={() => setMobileNavOpen(false)}>
                      Bookings
                    </Link>
                    <Link href="/transactions" onClick={() => setMobileNavOpen(false)}>
                      Transactions
                    </Link>
                  </>
                )}
                {!isAdmin && isAgency && (
                  <Link href="/marketplace" onClick={() => setMobileNavOpen(false)}>
                    Marketplace
                  </Link>
                )}
                {!isAdmin && (
                  <>
                    {!isAgency && <Link href="/?view=seller" onClick={() => setMobileNavOpen(false)}>
                      Sell Land
                    </Link>}
                  </>
                )}
                <Link href="/profile" onClick={() => setMobileNavOpen(false)}>
                  Profile & Settings
                </Link>
              </>
            )}
          </nav>
          {session && (
            <div className="header-mobile-drawer-footer">
              <button
                className="header-mobile-drawer-logout"
                onClick={handleLogout}
              >
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
