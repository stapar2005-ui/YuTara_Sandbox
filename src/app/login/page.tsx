"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  authenticate,
  readPendingUsers,
  setStoredSession,
} from "@/lib/demo-auth";
import { YuTaraLogo } from "@/components/YuTaraLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    if (!email.trim()) {
      setSubmitting(false);
      setError("Email is required.");
      return;
    }
    if (!email.includes("@")) {
      setSubmitting(false);
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setSubmitting(false);
      setError("Password is required.");
      return;
    }
    const session = authenticate(email, password);
    if (!session) {
      setSubmitting(false);
      const pending = readPendingUsers().find(
        (user) => user.email === email.trim().toLowerCase(),
      );
      setError(
        pending?.status === "PENDING"
          ? "Your application is still pending administrator approval. You can sign in after it is approved."
          : pending?.status === "DENIED"
            ? "Your application was not approved. Please contact YuTara support for next steps."
            : "Invalid email or password.",
      );
      return;
    }
    setStoredSession(session);
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    router.push(
      safeNext ??
        (session.role === "ADMIN" ? "/?view=admin" : "/?view=marketplace"),
    );
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="login-visual-copy">
          <div className="brand">
            <YuTaraLogo priority />
          </div>
          <div>
            <div className="eyebrow">Start local. Build trust.</div>
            <h1 className="display">
              Yuta ba?
              <br />
              <em>YuTara.</em>
            </h1>
            <p>
              Verified land and trusted connections, starting in Panabo City.
            </p>
          </div>
        </div>
      </div>
      <section className="login-panel">
        <Link className="login-back" href="/">
          ← Back to YuTara
        </Link>
        <div className="login-form-wrap">
          <div className="seal">
            <ShieldCheck size={18} />
          </div>
          <div className="eyebrow">Your property search, with context</div>
          <h2 className="display">Login</h2>
          <p className="muted">Welcome back to YuTara.</p>
          <form onSubmit={submit} className="form-grid">
            <label>
              Email
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </label>
            <label>
              Password
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing you in…" : "Login"} <ArrowRight size={15} />
            </button>
          </form>
          <p className="login-register">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="button-link">
              Register here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
