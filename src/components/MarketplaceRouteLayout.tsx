"use client";

import type { ReactNode } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppNav } from "@/components/AppNav";
import { DemoUser } from "@/lib/demo-auth";

export function MarketplaceRouteLayout({
  session,
  pageTitle,
  children,
}: {
  session: DemoUser | null;
  pageTitle: string;
  children: ReactNode;
}) {
  if (session?.role === "USER") {
    return (
      <AppLayout session={session} pageTitle={pageTitle} showSearch={false}>
        {children}
      </AppLayout>
    );
  }

  return (
    <div className="app-shell">
      <AppNav session={session} />
      {children}
    </div>
  );
}
