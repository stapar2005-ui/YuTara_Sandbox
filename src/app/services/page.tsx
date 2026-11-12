"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";

export default function ServicesPage() {
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
              <div className="eyebrow">Services Offered</div>
              <h2>How We Help You</h2>
              <p>
                A complete suite of property technology services designed to
                make land discovery and transactions simple and secure.
              </p>
            </div>
          </div>

          <div className="services-grid">
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>🔍</span>
                </div>
                <h3>Digital Land Marketplace</h3>
                <p>
                  Browse available land listings across Panabo City with
                  detailed property information, photos, and pricing.
                </p>
              </div>
            </div>
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>🏷️</span>
                </div>
                <h3>Property Discovery</h3>
                <p>
                  Search and filter properties by location, type, budget, and
                  land area to find the right opportunity.
                </p>
              </div>
            </div>
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>🤝</span>
                </div>
                <h3>Buyer-Seller Connection</h3>
                <p>
                  Connect directly with property owners through secure
                  inquiries and booking requests.
                </p>
              </div>
            </div>
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>📋</span>
                </div>
                <h3>Digital Reservation</h3>
                <p>
                  Request bookings and track your reservation status through
                  an organized digital process.
                </p>
              </div>
            </div>
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>📊</span>
                </div>
                <h3>Transaction Tracking</h3>
                <p>
                  Monitor your transaction progress from agreement to transfer
                  completion with our progress tracker.
                </p>
              </div>
            </div>
            <div className="card fade-up">
              <div className="card-body">
                <div className="feature-icon">
                  <span style={{ fontSize: "24px" }}>🏛️</span>
                </div>
                <h3>Agency-Assisted Transfer</h3>
                <p>
                  The affiliated agency coordinates document collection and
                  land transfer processing for a smooth closing.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "3rem", background: "var(--background-green)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--green-border)" }}>
            <h3 style={{ marginTop: 0 }}>Listing Properties</h3>
            <p style={{ margin: "0.5rem 0 0" }}>
              Listing a property on YuTara is free. There are no premium
              memberships, subscription plans, or artificial paywalls. The
              platform&apos;s revenue model is based on transactions, not listing
              upgrades.
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
