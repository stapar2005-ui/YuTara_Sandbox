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
import { isAgencyRole } from "@/lib/agency-service";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { Modal } from "@/components/Modal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotMessageType, setForgotMessageType] = useState<"info" | "error" | "success">("info");

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
        (session.role === "ADMIN"
          ? "/?view=admin"
          : isAgencyRole(session.role)
            ? "/agency"
            : "/?view=marketplace"),
    );
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotSubmitting(true);
    setForgotMessage("");
    if (!forgotEmail.trim()) {
      setForgotSubmitting(false);
      setForgotMessage("Please enter your email address.");
      setForgotMessageType("error");
      return;
    }
    if (!forgotEmail.includes("@")) {
      setForgotSubmitting(false);
      setForgotMessage("Enter a valid email address.");
      setForgotMessageType("error");
      return;
    }

    // Check if email exists in demo accounts or pending users
    const pending = readPendingUsers().find(
      (u) => u.email === forgotEmail.trim().toLowerCase(),
    );
    const accountExists =
      Object.prototype.hasOwnProperty.call(
        (await import("@/lib/demo-auth")).DEMO_ACCOUNTS,
        forgotEmail.trim().toLowerCase(),
      ) || (pending && pending.status === "APPROVED");

    setForgotSubmitting(false);
    if (accountExists) {
      setForgotMessage(
        "If an account exists for this email, a password reset link has been sent.",
      );
      setForgotMessageType("success");
    } else {
      // Do not reveal whether the email exists or not (security best practice)
      setForgotMessage(
        "If an account exists for this email, a password reset link has been sent.",
      );
      setForgotMessageType("success");
    }
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
          <h2 className="display">Log in</h2>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: "0.875rem" }}>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing you in…" : "Log in"} <ArrowRight size={15} />
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

      {forgotOpen && (
        <Modal title="Forgot Password" onClose={() => setForgotOpen(false)}>
          <form onSubmit={handleForgotPassword} className="form-grid">
            <p className="muted">
              Enter your email address and we will send instructions to reset
              your password.
            </p>
            <label>
              Email address
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </label>
            {forgotMessage && (
              <p
                className={`form-message ${forgotMessageType}`}
                role="alert"
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: "6px",
                  background:
                    forgotMessageType === "success"
                      ? "var(--background-green)"
                      : "#fef2f2",
                  color:
                    forgotMessageType === "success"
                      ? "var(--deep-green)"
                      : "var(--danger)",
                  fontSize: "0.875rem",
                }}
              >
                {forgotMessage}
              </p>
            )}
            {forgotMessageType !== "success" && (
              <div className="modal-foot" style={{ justifyContent: "space-between" }}>
                <button
                  className="button button-ghost"
                  onClick={() => setForgotOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={forgotSubmitting}
                >
                  {forgotSubmitting ? "Sending…" : "Send reset link"}
                </button>
              </div>
            )}
            {forgotMessageType === "success" && (
              <div className="modal-foot" style={{ justifyContent: "center" }}>
                <button
                  className="button button-primary"
                  onClick={() => setForgotOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </form>
        </Modal>
      )}
    </main>
  );
}
