"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { YuTaraLogo } from "./YuTaraLogo";

export function CheckoutNav() {
  return (
    <header className="topbar checkout-topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          <YuTaraLogo priority />
        </Link>
        <span className="checkout-badge">
          <Lock size={14} /> Secure checkout
        </span>
        <div className="nav-actions">
          <Link className="button button-ghost" href="/marketplace">
            <ArrowLeft size={15} /> Cancel
          </Link>
        </div>
      </div>
    </header>
  );
}
