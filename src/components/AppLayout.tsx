"use client";

import { AppHeader } from "@/components/AppHeader";
import { SidebarNav } from "@/components/SidebarNav";
import { DemoUser } from "@/lib/demo-auth";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
  session: DemoUser | null;
  isAgency?: boolean;
  pageTitle: string;
  children: React.ReactNode;
  showSearch?: boolean;
  activeSectionOverride?: string;
}

export function AppLayout({
  session,
  isAgency = false,
  pageTitle,
  children,
  showSearch = true,
  activeSectionOverride,
}: AppLayoutProps) {
  const pathname = usePathname();
  const activeSection = activeSectionOverride ?? (
    session?.role === "ADMIN" && pathname === "/"
      ? "admin"
      : pathname === "/dashboard"
      ? "properties"
      : pathname.startsWith("/marketplace")
        ? pathname === "/marketplace/map"
          ? "map"
          : "marketplace"
        : pathname === "/saved-lands"
          ? "saved"
          : pathname === "/inquiries"
            ? "inquiries"
            : pathname === "/bookings"
              ? "bookings"
              : pathname === "/transactions"
                ? "transactions"
                : pathname === "/notifications"
                  ? "notifications"
                  : pathname === "/profile"
                    ? "profile"
                    : undefined
  );

  return (
    <div className="app-shell">
      <AppHeader
        session={session}
        pageTitle={pageTitle}
        showSearch={showSearch}
        isAgency={isAgency}
      />
      <SidebarNav
        session={session}
        isAgency={isAgency}
        activeSection={activeSection}
      />
      <div className="sidebar-shell">
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
