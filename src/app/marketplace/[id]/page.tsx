"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Modal } from "@/components/Modal";
import {
  formatMoney,
  isActiveListing,
  Property,
  roadAccessLabel,
} from "@/lib/marketplace";
import { readProperties } from "@/lib/property-store";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { addInquiry } from "@/lib/inquiries";

function readSaved(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("yutara-saved");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PropertyRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [session, setSession] = useState<DemoUser | null>(null);
  const [saved, setSaved] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [message, setMessage] = useState(
    "Hello, I am interested in this property and would like to know more about its availability.",
  );
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const found = readProperties().find(
        (item) => item.id === Number(params.id),
      );
      setProperty(found);
      setSession(getStoredSession());
      setSaved(found ? readSaved().includes(found.id) : false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  if (!property) {
    return (
      <div className="app-shell">
        <AppNav session={session} />
        <main className="workspace">
          <div className="container">
            <h1>Property not found</h1>
            <Link className="button button-ghost" href="/marketplace/map">
              Back to marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const active = isActiveListing(property);
  const owned = Boolean(
    session?.email && property.sellerEmail === session.email,
  );

  function toggleSave() {
    if (!property) return;
    const current = readSaved();
    const next = current.includes(property.id)
      ? current.filter((id) => id !== property.id)
      : [...current, property.id];
    try {
      window.localStorage.setItem("yutara-saved", JSON.stringify(next));
    } catch {
      // ignore
    }
    setSaved(next.includes(property.id));
  }

  function sendInquiry() {
    if (!property) return;
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      buyerName: session?.name || "YuTara buyer",
      buyerEmail: session?.email || "buyer@yutara.com",
      message: message.trim() || "I am interested in this property.",
    });
    setInquiryOpen(false);
    setSent(true);
  }

  return (
    <div className="app-shell">
      <AppNav session={session} />
      <main className="detail-view">
        <div className="container">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="detail-grid">
            <div>
              <div
                className="detail-image"
                style={{
                  backgroundImage: `url(${property.image})`,
                  backgroundPosition: property.imagePosition || "center",
                }}
              />
              <div className="map-reference">
                <div className="eyebrow">Location reference</div>
                <strong>
                  {property.barangay}, {property.city}
                </strong>
                <p>
                  Coordinates: {property.latitude.toFixed(4)},{" "}
                  {property.longitude.toFixed(4)}
                </p>
                <small>
                  Coordinates and boundaries are approximate and do not replace
                  an official survey.
                </small>
              </div>
            </div>
            <div className="detail-copy">
              <span className="badge badge-verified">
                <Check size={12} /> YuTara verified
              </span>
              <h1 className="display">{property.title}</h1>
              <div className="property-location">
                <MapPin size={15} /> {property.barangay}, {property.city}
              </div>
              <div className="detail-price">{formatMoney(property.price)}</div>
              <div className="detail-specs">
                <div className="spec">
                  <span>Land area</span>
                  <strong>{property.area.toLocaleString()} sqm</strong>
                </div>
                <div className="spec">
                  <span>Property type</span>
                  <strong>{property.propertyType}</strong>
                </div>
                <div className="spec">
                  <span>Road access</span>
                  <strong>{roadAccessLabel[property.roadAccess]}</strong>
                </div>
              </div>
              <p>{property.description}</p>
              <div className="detail-actions">
                {owned ? (
                  <p className="status-message">
                    This is your listing. Manage it from your seller workspace.
                  </p>
                ) : (
                  active && (
                    <>
                      <Link
                        className="button button-primary"
                        href={`/reservation/${property.id}`}
                      >
                        Reserve property
                      </Link>
                      <button
                        className="button button-ghost"
                        onClick={() => setInquiryOpen(true)}
                      >
                        <MessageCircle size={16} /> Contact seller
                      </button>
                    </>
                  )
                )}
                <button className="button button-ghost" onClick={toggleSave}>
                  <Heart size={16} fill={saved ? "#d79c43" : "none"} />{" "}
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
              {sent && (
                <p className="status-message">
                  Your inquiry was sent to the seller.
                </p>
              )}
              <div className="verification-box">
                <h3>
                  <ShieldCheck size={18} /> YuTara verification
                </h3>
                <ul>
                  <li>
                    <Check size={14} /> Seller identity reviewed
                  </li>
                  <li>
                    <Check size={14} /> Required documents submitted
                  </li>
                  <li>
                    <Check size={14} /> Property information reviewed
                  </li>
                  <li>
                    <Check size={14} /> Listing requirements met
                  </li>
                </ul>
                <p>
                  Verification date: {property.verificationDate || "2026-08-01"}{" "}
                  · ID: {property.verificationId}
                </p>
                <small>
                  YuTara verification reflects an internal review of submitted
                  information and documents. Buyers should conduct legal and
                  government due diligence.
                </small>
              </div>
            </div>
          </div>
        </div>
      </main>
      {inquiryOpen && (
        <Modal title="Contact seller" onClose={() => setInquiryOpen(false)}>
          <p className="muted">
            Send a message about <strong>{property.title}</strong>.
          </p>
          <label className="form-label">
            Your message
            <textarea
              className="form-input form-textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <div className="modal-foot">
            <button
              className="button button-ghost"
              onClick={() => setInquiryOpen(false)}
            >
              Cancel
            </button>
            <button className="button button-primary" onClick={sendInquiry}>
              <MessageCircle size={15} /> Send inquiry
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
