"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileCheck2, ScanFace } from "lucide-react";
import Link from "next/link";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { createPendingUser, isEmailRegisteredOrPending } from "@/lib/demo-auth";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [form, setForm] = useState<{
    fullName: string;
    mobile: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const idUploadCount = (uploads["id1"] ? 1 : 0) + (uploads["id2"] ? 1 : 0);

  const update = (key: keyof typeof form, value: string) => {
    setError("");
    setForm({ ...form, [key]: value });
  };

  function startScan() {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setFaceVerified(true);
    }, 1100);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (isEmailRegisteredOrPending(form.email)) {
      setError("This email is already registered or has a pending application.");
      return;
    }
    if (idUploadCount === 0) {
      setError("Please upload at least one valid ID.");
      return;
    }
    if (!consent) {
      setError("Please accept the terms and privacy notice.");
      return;
    }
    if (!faceVerified) {
      setError("Please complete the face scan.");
      return;
    }

    createPendingUser({
      email: form.email,
      name: form.fullName,
      password: form.password,
      id1: uploads["id1"],
      id2: uploads["id2"] || undefined,
    });
    setSubmitted(true);
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="login-visual-copy">
          <div className="brand">
            <YuTaraLogo priority />
          </div>
          <div>
            <div className="eyebrow">Join YuTara Marketplace</div>
            <h1 className="display">
              Register as a
              <br />
              <em>land buyer or seller.</em>
            </h1>
            <p>
              Submit your details and valid ID(s) for administrator approval.
              You will be notified once your account is reviewed.
            </p>
          </div>
        </div>
      </div>
      <section className="login-panel">
        <Link className="login-back" href="/login">
          ← Back to sign in
        </Link>
        <div className="login-form-wrap">
          {submitted ? (
            <div className="verification-box">
              <h3>Application submitted</h3>
              <p style={{ margin: 0 }}>
                Your registration has been sent for administrator review. You
                will be notified once your account is approved or denied.
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
              {error && (
                <div
                  className="verification-box"
                  style={{
                    background: "var(--danger-bg, #fdecea)",
                    color: "var(--danger-fg, #b3261e)",
                    border: "1px solid var(--danger-border, #e57373)",
                  }}
                >
                  {error}
                </div>
              )}
              <div className="sell-stepper">
                {["Account", "Valid ID(s)", "Face scan", "Review"].map(
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
                      value={form.fullName}
                      onChange={(event) => update("fullName", event.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </label>
                  <label>
                    Mobile number
                    <input
                      className="form-input"
                      value={form.mobile}
                      onChange={(event) => update("mobile", event.target.value)}
                      placeholder="09XX XXX XXXX"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      className="form-input"
                      type="email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      className="form-input"
                      type="password"
                      value={form.password}
                      onChange={(event) => update("password", event.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      className="form-input"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(event) =>
                        update("confirmPassword", event.target.value)
                      }
                      placeholder="Confirm your password"
                      required
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className="document-list">
                  <div className="verification-box">
                    <strong>
                      Valid ID upload ({idUploadCount} of 2 uploaded)
                    </strong>
                    <p style={{ margin: "6px 0 0", fontSize: ".8rem" }}>
                      Upload a clear photo or scan of your valid government ID
                      (driver&apos;s license, passport, national ID, etc.). At
                      least one ID is required for registration. A second ID is
                      optional but helps speed up approval.
                    </p>
                  </div>
                  {["Valid ID #1", "Valid ID #2"].map((label) => (
                    <label className="document-card" key={label}>
                      <div>
                        <strong>{label}</strong>
                        <p>
                          {label === "Valid ID #1"
                            ? "Required for registration"
                            : "Optional — speeds up approval"}
                        </p>
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
                        {uploads[label] ? (
                          <>
                            <FileCheck2 size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                            {uploads[label]}
                          </>
                        ) : (
                          label === "Valid ID #1"
                            ? "Upload required ID"
                            : "Upload optional ID"
                        )}
                      </span>
                    </label>
                  ))}
                  {idUploadCount === 0 && (
                    <p className="muted" style={{ marginTop: 10 }}>
                      Please upload at least one valid ID to continue.
                    </p>
                  )}
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
                    <span>ID(s) uploaded</span>
                    <strong>{idUploadCount} valid ID(s)</strong>
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
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={
                      idUploadCount === 0 ||
                      !consent ||
                      !faceVerified ||
                      !form.fullName.trim() ||
                      !form.mobile.trim() ||
                      !form.email.trim() ||
                      !form.password ||
                      form.password.length < 6 ||
                      form.password !== form.confirmPassword
                    }
                  >
                    Submit application <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
