"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { clearStoredSession, DemoUser } from "@/lib/demo-auth";
import { isAgencyRole } from "@/lib/agency-service";
import { setStoredTheme } from "@/lib/theme";
import { useAutoHideHeader } from "@/lib/use-auto-hide-header";

const AGENCY_SECTIONS = [
  { key: "overview", label: "Overview", icon: "layout" },
  { key: "transactions", label: "All Transactions", icon: "list" },
  { key: "intake", label: "New Transaction Intake", icon: "plus-circle" },
  { key: "documents", label: "Document Management", icon: "file-text" },
  { key: "review", label: "Document Review", icon: "check-circle" },
  { key: "queue", label: "Processing Queue", icon: "clock" },
  { key: "clients", label: "Client Management", icon: "users" },
  { key: "completed", label: "Completed Transfers", icon: "award" },
  { key: "reports", label: "Reports", icon: "bar-chart-3" },
  { key: "settings", label: "Agency Settings", icon: "settings" },
];

export function AgencyLayout({
  session,
  children,
}: {
  session: DemoUser | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [section, setSection] = useState("overview");
  const headerHidden = useAutoHideHeader();

  const isAgency = session && isAgencyRole(session.role);

  if (!isAgency) {
    return null;
  }

  return (
    <div className="agency-shell">
      <header className={`topbar ${headerHidden ? "topbar-hidden" : ""}`}>
        <div className="container nav">
          <Link className="brand" href="/agency">
            <YuTaraLogo priority />
          </Link>
          <span className="checkout-badge">Agency Portal</span>
          <div className="nav-actions">
            <span className="nav-auth">
              <span className="muted">Signed in as {session.name}</span>
              <button className="button button-primary" onClick={logout}>
                Logout
              </button>
            </span>
            <button
              className="icon-button nav-toggle"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <div className="agency-body">
        <aside className="agency-sidebar">
          <div className="sidebar-section">
            <h3>Agency Workspace</h3>
            <nav>
              {AGENCY_SECTIONS.map((item) => (
                <button
                  key={item.key}
                  className={section === item.key ? "active" : ""}
                  onClick={() => setSection(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="agency-main">
          {children}
        </main>
      </div>
    </div>
  );

  function X() {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  function Menu() {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    );
  }

  function logout() {
    clearStoredSession();
    setStoredTheme("light");
    router.push("/");
  }
}
