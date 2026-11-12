"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";

export default function AboutPage() {
  const [session, setSession] = useState<DemoUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSession(getStoredSession()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="app-shell">
      <AppNav session={session} />

      <section className="section fade-up">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">About YuTara</div>
              <h2>Our Story</h2>
              <p>
                YuTara is a property technology platform built to make land
                discovery and transactions simple, transparent, and accessible.
                Starting in Panabo City, Davao del Norte, we connect buyers
                directly with property owners through a modern digital
                marketplace.
              </p>
            </div>
          </div>

          <div className="about-content-grid">
            <div>
              <h3>Our Mission</h3>
              <p>
                To create a trusted digital land marketplace where property
                buyers and sellers can connect with confidence, supported by
                professional agency-assisted transfer processing.
              </p>
              <h3 style={{ marginTop: "1.5rem" }}>Our Vision</h3>
              <p>
                To become the leading property technology platform in the
                Philippines, making land transactions accessible to everyone.
              </p>
            </div>
            <div>
              <h3>Our Values</h3>
              <ul style={{ listStyle: "none", padding: 0, gap: "1rem" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color: "var(--action-green)" }}>●</span>
                  <strong>Trust</strong> — Transparent processes and clear communication
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color: "var(--action-green)" }}>●</span>
                  <strong>Accessibility</strong> — Land ownership made simpler for everyone
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color: "var(--action-green)" }}>●</span>
                  <strong>Professionalism</strong> — Agency-assisted, organized transactions
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{ color: "var(--action-green)" }}>●</span>
                  <strong>Convenience</strong> — Digital discovery and booking from anywhere
                </li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: "3rem", background: "var(--background-green)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--green-border)" }}>
            <h3 style={{ marginTop: 0 }}>Important Notice</h3>
            <p style={{ margin: "0.5rem 0 0" }}>
              YuTara does not guarantee legal ownership or perform official
              government verification. Buyers should conduct appropriate legal
              and government due diligence before completing a purchase. The
              affiliated agency coordinates the land-transfer process, but does
              not replace independent legal advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-text">YuTara</div>
            <div className="footer-slogan">Yuta ba? YuTara!</div>
            <p className="footer-description">
              A trusted Philippine land marketplace helping people discover
              land, connect with sellers, and transact with confidence.
            </p>
          </div>
          <div>
            <div className="footer-heading">Quick Links</div>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/services">Services Offered</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Services</div>
            <ul className="footer-links">
              <li><Link href="/">Digital Land Marketplace</Link></li>
              <li><Link href="/">Property Discovery</Link></li>
              <li><Link href="/">Buyer-Seller Connection</Link></li>
              <li><Link href="/">Digital Reservation</Link></li>
              <li><Link href="/">Transaction Tracking</Link></li>
              <li><Link href="/">Agency-Assisted Transfer</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Contact</div>
            <ul className="footer-links">
              <li><Link href="/">Panabo City, Davao del Norte</Link></li>
              <li><Link href="/">support@yutara.com</Link></li>
              <li><Link href="/">+63 917 123 4567</Link></li>
            </ul>
            <div className="footer-social">
              <Link href="/">facebook</Link>
              <Link href="/">twitter</Link>
              <Link href="/">instagram</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-bottom-text">© 2024 YuTara Marketplace. All rights reserved.</span>
          <span className="footer-bottom-text">Internal verification does not replace legal or government due diligence.</span>
        </div>
      </footer>
    </div>
  );
}
