"use client";

import Link from "next/link";
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  Home,
  Layout,
  List,
  LogOut,
  MapPin,
  Settings,
  User,
} from "lucide-react";
import { clearStoredSession, DemoUser } from "@/lib/demo-auth";
import { setStoredTheme } from "@/lib/theme";

interface SidebarNavProps {
  session: DemoUser | null;
  isAgency?: boolean;
  activeSection?: string;
  setActiveSection?: (key: string) => void;
}

const USER_GROUPS: {
  label: string;
  items: { key: string; label: string; icon: React.ElementType; href: string }[];
}[] = [
  {
    label: "WORKSPACE",
    items: [
      { key: "marketplace", label: "Marketplace", icon: Layout, href: "/marketplace" },
      { key: "properties", label: "My Properties", icon: Home, href: "/dashboard" },
      { key: "map", label: "Map View", icon: MapPin, href: "/marketplace/map" },
      { key: "saved", label: "Saved Lands", icon: Bookmark, href: "/saved-lands" },
      { key: "sell", label: "Sell Land", icon: Layout, href: "/?view=seller" },
    ],
  },
  {
    label: "MY ACTIVITIES",
    items: [
      { key: "inquiries", label: "Inquiries", icon: List, href: "/inquiries" },
      { key: "bookings", label: "Bookings", icon: FileText, href: "/bookings" },
      { key: "transactions", label: "Transactions", icon: FileText, href: "/transactions" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
      { key: "profile", label: "Profile & Settings", icon: Settings, href: "/profile" },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    label: "ADMINISTRATION",
    items: [
      { key: "admin", label: "Land Listings", icon: Home, href: "/?view=admin#land-listings" },
      {
        key: "registrations",
        label: "User Registrations",
        icon: User,
        href: "/?view=admin#user-registrations",
      },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
      { key: "profile", label: "Profile & Settings", icon: Settings, href: "/profile" },
    ],
  },
];

const AGENCY_SECTIONS: { key: string; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "transactions", label: "All Transactions" },
  { key: "intake", label: "New Transaction Intake" },
  { key: "documents", label: "Document Management" },
  { key: "review", label: "Document Review" },
  { key: "queue", label: "Processing Queue" },
  { key: "completed", label: "Completed Transfers" },
  { key: "settings", label: "Agency Settings" },
];

export function SidebarNav({
  session,
  isAgency = false,
  activeSection,
  setActiveSection,
}: SidebarNavProps) {
  const isAdmin = session?.role === "ADMIN";

  const handleLogout = () => {
    clearStoredSession();
    setStoredTheme("light");
    window.location.replace("/");
  };

  return (
    <aside className="sidebar-holder" aria-label="Main navigation">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {isAgency ? (
            <>
              <div className="sidebar-group-label">Agency Workspace</div>
              <ul className="sidebar-group-list">
                {AGENCY_SECTIONS.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`sidebar-item ${activeSection === item.key ? "sidebar-item-active" : ""}`}
                      onClick={() => setActiveSection?.(item.key)}
                    >
                      <span className="sidebar-item-label">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            (isAdmin ? ADMIN_GROUPS : USER_GROUPS).map((group) => (
              <div key={group.label} className="sidebar-group">
                <div className="sidebar-group-label">{group.label}</div>
                <ul className="sidebar-group-list">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className={`sidebar-item ${activeSection === item.key ? "sidebar-item-active" : ""}`}
                        onClick={() => setActiveSection?.(item.key)}
                      >
                        <item.icon size={16} />
                        <span className="sidebar-item-label">{item.label}</span>
                        {activeSection === item.key && (
                          <ChevronRight size={14} className="sidebar-item-arrow" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">
              {session?.name ? (
                <span className="sidebar-profile-initials">
                  {session.name
                    .split(" ")
                    .map((namePart) => namePart[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{session?.name || "User"}</div>
              <div className="sidebar-profile-role">
                {session?.role?.replaceAll("_", " ") || "YuTara User"}
              </div>
            </div>
            <Link
              className="sidebar-profile-menu"
              href="/profile"
              aria-label="Profile and settings"
            >
              <ChevronRight size={14} />
            </Link>
          </div>
          {session && (
            <button className="sidebar-logout" type="button" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
