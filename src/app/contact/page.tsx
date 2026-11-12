"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";

export default function ContactPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSession(getStoredSession()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleContactSubmit(event: React.FormEvent) {
    event.preventDefault();
    setContactSubmitted(true);
  }
  return (
    <div className="app-shell">
      <AppNav session={session} />

      <section className="section fade-up">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Contact Us</div>
              <h2>Get in Touch</h2>
              <p>
                Have questions about YuTara or need assistance with a property
                listing? We&apos;re here to help.
              </p>
            </div>
          </div>

          <div className="contact-grid">
            <div>
              <h3>Contact Information</h3>
              <p style={{ margin: "0.5rem 0 1.5rem" }}>
                Reach out to us using the contact details below.
              </p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ color: "var(--action-green)", fontSize: "20px" }}>📍</span>
                <div>
                  <strong>Office Address</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted-color)" }}>
                    Panabo City, Davao del Norte, Philippines
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ color: "var(--action-green)", fontSize: "20px" }}>✉️</span>
                <div>
                  <strong>Email</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted-color)" }}>
                    support@yutara.com
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ color: "var(--action-green)", fontSize: "20px" }}>📞</span>
                <div>
                  <strong>Mobile</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted-color)" }}>
                    +63 917 123 4567 (Panabo Desk)
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/" style={{ color: "var(--action-green)", textDecoration: "none" }}>facebook</Link>
                <Link href="/" style={{ color: "var(--action-green)", textDecoration: "none" }}>twitter</Link>
                <Link href="/" style={{ color: "var(--action-green)", textDecoration: "none" }}>instagram</Link>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3>Send us a message</h3>
                <p style={{ color: "var(--muted-color)", marginBottom: "1.5rem" }}>
                  Fill out the form below and we will get back to you as soon
                  as possible.
                </p>
                <form onSubmit={handleContactSubmit}>
                  {contactSubmitted && (
                    <div style={{ padding: "1.5rem", background: "var(--background-green)", border: "1px solid var(--green-border)", borderRadius: "var(--radius)", color: "var(--deep-green)" }}>
                      <strong>Message sent.</strong>
                      <p style={{ margin: "0.5rem 0 0" }}>Thank you for contacting YuTara. We will get back to you as soon as possible.</p>
                    </div>
                  )}
                  {!contactSubmitted && (
                    <>
                    <div className="form-field">
                    <label>Full name</label>
                    <input className="input" type="text" placeholder="Your full name" required />
                  </div>
                  <div className="form-field">
                    <label>Email address</label>
                    <input className="input" type="email" placeholder="Enter your email" required />
                  </div>
                  <div className="form-field">
                    <label>Subject</label>
                    <input className="input" type="text" placeholder="What is this about?" required />
                  </div>
                  <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Message</label>
                    <textarea className="input textarea" placeholder="How can we help you?" required />
                  </div>
                  <button className="button button-primary" type="submit">
                    Send Message
                  </button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "3rem", background: "var(--background-green)", padding: "2.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--green-border)" }}>
            <h3 style={{ marginTop: 0 }}>Important Notice</h3>
            <p style={{ margin: "0.5rem 0 0" }}>
              YuTara does not guarantee legal ownership or perform official
              government verification. Buyers should conduct appropriate legal
              and government due diligence before completing a purchase.
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
