"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ScanFace } from "lucide-react";
import Link from "next/link";
import { YuTaraLogo } from "@/components/YuTaraLogo";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [consent, setConsent] = useState(false);
  const [uploads, setUploads] = useState<Record<string, string>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  function startScan() {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setFaceVerified(true);
    }, 1100);
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="login-visual-copy">
          <div className="brand">
            <YuTaraLogo priority />
          </div>
          <div>
            <div className="eyebrow">Starting in Panabo City</div>
            <h1 className="display">
              Make room
              <br />
              <em>for possibility.</em>
            </h1>
            <p>
              One YuTara account lets you browse, save, inquire, and sell land.
            </p>
          </div>
        </div>
      </div>
      <section className="login-panel">
        <Link className="login-back" href="/">
          ← Back to YuTara
        </Link>
        <div className="login-form-wrap">
          <div className="eyebrow">Create one marketplace account</div>
          <h2 className="display">Register</h2>
          <p className="muted">
            Identity verification helps protect YuTara users and reduce
            fraudulent listings.
          </p>
          {submitted ? (
            <div className="verification-box">
              <h3>Account verification pending</h3>
              <p style={{ margin: 0 }}>
                Your account was created. We are finishing your identity
                verification and will notify you when it is complete.
              </p>
              <Link
                className="button button-primary"
                style={{ marginTop: 16 }}
                href="/login"
              >
                Go to login <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="registration-form">
              <div className="sell-stepper">
                {["Account", "2 Valid IDs", "Face scan", "Review"].map(
                  (label, index) => (
                    <button
                      type="button"
                      key={label}
                      className={
                        step === index + 1
                          ? "active"
                          : step > index + 1
                            ? "complete"
                            : ""
                      }
                      onClick={() => setStep(index + 1)}
                    >
                      <span>{index + 1}</span>
                      {label}
                    </button>
                  ),
                )}
              </div>
              {step === 1 && (
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      className="form-input"
                      placeholder="Your full name"
                      required
                    />
                  </label>
                  <label>
                    Mobile number
                    <input
                      className="form-input"
                      placeholder="09XX XXX XXXX"
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Enter your email"
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Create a password"
                      required
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Confirm your password"
                      required
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className="document-list">
                  <div className="verification-box">
                    <strong>Identity verification</strong>
                    <p style={{ margin: "6px 0 0", fontSize: ".8rem" }}>
                      Your uploaded IDs are encrypted and are never shown on
                      public property pages.
                    </p>
                  </div>
                  {["Valid ID #1", "Valid ID #2"].map((label) => (
                    <label className="document-card" key={label}>
                      <div>
                        <strong>{label}</strong>
                        <p>Choose an ID type and upload a front image.</p>
                      </div>
                      <span className="upload-button">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(event) =>
                            setUploads((current) => ({
                              ...current,
                              [label]: event.target.files?.[0]?.name ?? "",
                            }))
                          }
                        />
                        {uploads[label] ? `✓ ${uploads[label]}` : "Upload ID"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="face-scan-box">
                  <div className="face-frame">
                    <ScanFace size={62} />
                  </div>
                  <h3>
                    {faceVerified
                      ? "Verification complete"
                      : scanning
                        ? "Scanning..."
                        : "Face Verification"}
                  </h3>
                  <p>Position your face inside the frame.</p>
                  <p className="muted" style={{ fontSize: ".75rem" }}>
                    Face verification confirms a live person and helps reduce
                    fraudulent accounts.
                  </p>
                  {!faceVerified && (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={startScan}
                    >
                      {scanning ? "Scanning..." : "Start Face Scan"}
                    </button>
                  )}
                  {faceVerified && (
                    <span className="badge badge-verified">
                      <Check size={12} /> Verified
                    </span>
                  )}
                </div>
              )}
              {step === 4 && (
                <div className="review-panel">
                  <div className="review-row">
                    <span>Account type</span>
                    <strong>YuTara USER</strong>
                  </div>
                  <div className="review-row">
                    <span>Marketplace access</span>
                    <strong>Buy and sell land</strong>
                  </div>
                  <div className="review-row">
                    <span>Identity checks</span>
                    <strong>
                      2 IDs ·{" "}
                      {faceVerified
                        ? "Face scan complete"
                        : "Pending face scan"}
                    </strong>
                  </div>
                  <label
                    className="check-label"
                    style={{ padding: 15, background: "var(--background)" }}
                  >
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />{" "}
                    I agree to the YuTara terms and privacy notice.
                  </label>
                </div>
              )}
              <div className="registration-actions">
                {step > 1 && (
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setStep(step + 1)}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <button
                      className="button button-primary"
                      disabled={
                        !consent ||
                        !faceVerified ||
                        ["Valid ID #1", "Valid ID #2"].some(
                          (label) => !uploads[label],
                        )
                      }
                      type="submit"
                    >
                      Create account <ArrowRight size={15} />
                    </button>
                    {(!consent || !faceVerified) && (
                      <p
                        className="muted"
                        style={{ fontSize: ".78rem", margin: 0 }}
                      >
                        Upload both valid IDs, complete the face scan, and accept
                        the terms to create your account.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
