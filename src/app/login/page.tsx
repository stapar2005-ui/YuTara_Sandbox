"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticate, setStoredSession } from "@/lib/demo-auth";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { isDemoMode } from "@/lib/runtime-config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return setError("Email is required.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!password) return setError("Password is required.");
    const session = authenticate(email, password);
    if (!session) return setError("Invalid email or password.");
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
            <button className="button button-primary" type="submit">
              Login <ArrowRight size={15} />
            </button>
          </form>
          <p className="login-register">
            Don&apos;t have an account? <Link href="/register">Register</Link>
          </p>
          {isDemoMode && (
            <div className="demo-accounts">
              <strong>Sample accounts</strong>
              <span>
                admin@yutara.com · user@yutara.com · buyer@yutara.com ·
                seller@yutara.com
              </span>
              <span>Password: 12345</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
