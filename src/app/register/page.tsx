"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileCheck2, ScanFace } from "lucide-react";
import Link from "next/link";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { createPendingUser, isEmailRegisteredOrPending } from "@/lib/demo-auth";

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
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
    setForm((current) => ({ ...current, [key]: value }));
  };

  const accountStepComplete =
    Boolean(form.fullName.trim()) &&
    Boolean(form.mobile.trim()) &&
    Boolean(form.email.trim()) &&
    Boolean(form.password) &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const accountStepError = (): string => {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (!form.mobile.trim()) return "Please enter your mobile number.";
    if (!form.email.trim()) return "Please enter your email.";
    if (!form.password) return "Please create a password.";
    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (!form.confirmPassword) return "Please confirm your password.";
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  function handleFileChange(
    label: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (file) {
      const uploadKey = label === "Valid ID #1" ? "id1" : "id2";
      setUploads((current) => ({ ...current, [uploadKey]: file.name }));
    }
  }

  function startScan() {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setFaceVerified(true);
    }, 1100);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!form.fullName.trim()) {
        setError("Please enter your full name.");
        setSubmitting(false);
        return;
      }
      if (!form.mobile.trim()) {
        setError("Please enter your mobile number.");
        setSubmitting(false);
        return;
      }
      if (!form.email.trim()) {
        setError("Please enter your email.");
        setSubmitting(false);
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setSubmitting(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }
      if (isEmailRegisteredOrPending(form.email)) {
        setError("This email is already registered or has a pending application.");
        setSubmitting(false);
        return;
      }
      if (idUploadCount === 0) {
        setError("Please upload at least one valid ID.");
        setSubmitting(false);
        return;
      }
      if (!consent) {
        setError("Please accept the terms and privacy notice.");
        setSubmitting(false);
        return;
      }
      if (!faceVerified) {
        setError("Please complete the face scan.");
        setSubmitting(false);
        return;
      }

      createPendingUser({
        email: form.email,
        name: form.fullName,
        password: form.password,
        id1: uploads["id1"],
        id2: uploads["id2"] || undefined,
        mobile: form.mobile.trim(),
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch {
      setSubmitting(false);
      setError("Failed to submit application. Please try again.");
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
                Your registration has been sent for administrator review. Your
                account is pending and cannot sign in until an administrator
                approves it. We will notify you using the contact details you
                submitted once a decision is made.
              </p>
              <p className="muted" style={{ margin: "12px 0 0", fontSize: ".8rem" }}>
                Keep your email and mobile number available. After approval,
                return here and sign in with the password you created.
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
                  background: "#fdecea",
                  color: "#b3261e",
                  border: "1px solid #e57373",
                }}
              >
                  {error}
                </div>
              )}
              <div className="sell-stepper">
                  {["Account", "Valid ID(s)", "Face scan", "Review"].map(
                    (label, index) => {
                      const targetStep = index + 1;
                      const isCurrent = step === targetStep;
                      const isCompleted = step > targetStep;
                      const canAccess = isCurrent || isCompleted;

                      const canGoToNext = () => {
                        if (step === 1) {
                          return accountStepComplete;
                        }
                        if (step === 2) {
                          return idUploadCount > 0;
                        }
                        if (step === 3) {
                          return faceVerified;
                        }
                        return false;
                      };

                      return (
                        <button
                          type="button"
                          key={label}
                          disabled={!canAccess}
                          className={
                            step === targetStep
                              ? "active"
                              : step > targetStep
                                ? "complete"
                                : "disabled"
                          }
                          onClick={() => {
                            if (!canAccess) return;
                            if (targetStep > step) {
                              // Going forward - validate current step first
                              if (canGoToNext()) {
                                setStep(targetStep);
                              } else {
                                setError(accountStepError() || "Please complete all required fields before continuing.");
                              }
                            } else {
                              // Going backward - always allow
                              setStep(targetStep);
                            }
                          }}
                        >
                          <span>{targetStep}</span>
                          {label}
                        </button>
                      );
                    },
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
                    <p className="muted" style={{ margin: "8px 0 0", fontSize: ".75rem" }}>
                      YuTara reviews the submitted documents for this MVP
                      marketplace. This does not replace an official
                      government or legal ownership check.
                    </p>
                    <p style={{ fontSize: ".72rem", color: "#666", marginTop: 4 }}>
                      Max file size: 5MB. Accepted formats: PDF, JPG, JPEG, PNG.
                    </p>
                  </div>
                  {[
                    { label: "Valid ID #1", uploadKey: "id1" as const, ref: fileInputRef1 },
                    { label: "Valid ID #2", uploadKey: "id2" as const, ref: fileInputRef2 },
                  ].map(({ label, uploadKey, ref }) => {
                    const handleUploadClick = () => {
                      ref.current?.click();
                    };
                    return (
                      <div className="document-card" key={label}>
                        <div>
                          <strong>{label}</strong>
                          <p>
                            {label === "Valid ID #1"
                              ? "Required for registration"
                              : "Optional — speeds up approval"}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            ref={ref}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="form-input"
                            onChange={(event) => handleFileChange(label, event)}
                            style={{ display: "none" }}
                          />
                          {uploads[uploadKey] ? (
                            <>
                              <FileCheck2 size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                              <strong style={{ color: "#d79c43" }}>{uploads[uploadKey]}</strong>
                            </>
                          ) : (
                            <button
                              className="button button-primary"
                              type="button"
                              onClick={handleUploadClick}
                            >
                              Upload {label === "Valid ID #1" ? "ID #1" : "ID #2"}
                            </button>
                          )}
                          {uploads[uploadKey] && (
                            <button
                              className="upload-button upload-button-ghost"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setUploads((current) => {
                                  const next = { ...current };
                                  delete next[uploadKey];
                                  return next;
                                });
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                    fraudulent accounts. <strong>This is simulated in the MVP
                    and does not perform biometric identity verification.</strong>
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
                    <span>Full name</span>
                    <strong>{form.fullName}</strong>
                  </div>
                  <div className="review-row">
                    <span>Mobile number</span>
                    <strong>{form.mobile}</strong>
                  </div>
                  <div className="review-row">
                    <span>Email address</span>
                    <strong>{form.email}</strong>
                  </div>
                  <div className="review-row">
                    <span>ID(s) uploaded</span>
                    <strong>{idUploadCount} valid ID(s)</strong>
                  </div>
                  {uploads["id1"] && (
                    <div className="review-row">
                      <span>ID document #1</span>
                      <strong>{uploads["id1"]}</strong>
                    </div>
                  )}
                  {uploads["id2"] && (
                    <div className="review-row">
                      <span>ID document #2</span>
                      <strong>{uploads["id2"]}</strong>
                    </div>
                  )}
                  <div className="review-row">
                    <span>Face verification</span>
                    <strong>Completed</strong>
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
                  {!consent && (
                    <p className="muted" style={{ margin: "8px 0 0", fontSize: ".75rem" }}>
                      Please check this box to submit your application.
                    </p>
                  )}
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
                    onClick={() => {
                      if (step === 1) {
                        if (
                          accountStepComplete
                        ) {
                          setStep(step + 1);
                        } else {
                          setError(accountStepError() || "Please complete all required fields before continuing.");
                        }
                      } else if (step === 2) {
                        if (idUploadCount > 0) {
                          setStep(step + 1);
                        } else {
                          setError("Please upload at least one valid ID before continuing.");
                        }
                      } else if (step === 3) {
                        if (faceVerified) {
                          setStep(step + 1);
                        } else {
                          setError("Please complete the face scan before continuing.");
                        }
                      }
                    }}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={
                      submitting ||
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
                    {submitting ? "Submitting..." : "Submit application "}
                    <ArrowRight size={15} />
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
