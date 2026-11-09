"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Inbox,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import { SellerTransactions } from "./SellerTransactions";
import { money, Property } from "@/lib/marketplace";
import {
  formatInquiryDate,
  inquiriesForProperty,
  Inquiry,
} from "@/lib/inquiries";
import { PANABO_BARANGAYS, YUTARA_SERVICE_AREA } from "@/lib/yutara-config";

export type SellerTab = "listings" | "new" | "transactions";

type SellForm = {
  title: string;
  type: string;
  barangay: string;
  price: string;
  area: string;
  description: string;
  image: string;
};

/** Read an image file and downscale it to a small data URL for local storage. */
async function resizeImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      const max = 800;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) return resolve(dataUrl);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function SellLandView({
  properties,
  inquiries,
  tab,
  setTab,
  sellerEmail,
  form,
  setForm,
  onSubmit,
  onReply,
  onBack,
}: {
  properties: Property[];
  inquiries: Inquiry[];
  tab: SellerTab;
  setTab: (tab: SellerTab) => void;
  sellerEmail: string;
  form: SellForm;
  setForm: (value: SellForm) => void;
  onSubmit: () => void;
  onReply: (id: string, reply: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [declaration, setDeclaration] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [openListingId, setOpenListingId] = useState<number | null>(null);
  const [replied, setReplied] = useState<string[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const activeCount = properties.filter(
    (item) => item.listingStatus === "OPEN_FOR_OFFERS",
  ).length;

  const inquiryMap = useMemo(() => {
    const map = new Map<number, Inquiry[]>();
    properties.forEach((property) => {
      map.set(property.id, inquiriesForProperty(property, inquiries));
    });
    return map;
  }, [properties, inquiries]);

  const totalInquiries = Array.from(inquiryMap.values()).reduce(
    (sum, list) => sum + list.filter((item) => item.status === "NEW").length,
    0,
  );

  const update = (key: keyof SellForm, value: string) => {
    setValidationError("");
    setForm({ ...form, [key]: value });
  };

  const validateStep1 = () => {
    if (!form.title.trim()) {
      setValidationError("Please enter a property title.");
      return false;
    }
    const numericPrice = Number(form.price);
    if (!form.price || isNaN(numericPrice) || numericPrice <= 0) {
      setValidationError("Please enter a valid price greater than 0.");
      return false;
    }
    const numericArea = Number(form.area);
    if (!form.area || isNaN(numericArea) || numericArea <= 0) {
      setValidationError("Please enter a valid land area greater than 0.");
      return false;
    }
    if (!form.description.trim()) {
      setValidationError("Please enter a description for the property.");
      return false;
    }
    if (!form.image) {
      setValidationError("Please upload a property photo. Listings require a photo to go live.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handleSubmit = () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!declaration) return;
    onSubmit();
    setStep(1);
    setDeclaration(false);
  };

  const handleReply = (id: string, reply: string) => {
    setReplied((current) =>
      current.includes(id) ? current : [...current, id],
    );
    onReply(id, reply);
  };

  const openListing =
    properties.find((item) => item.id === openListingId) || null;
  const openInquiries = openListing
    ? inquiryMap.get(openListing.id) || []
    : [];

  return (
    <main className="workspace">
      <div className="container">
        <button className="back-button sell-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to marketplace
        </button>
        <div className="eyebrow">My YuTara · Seller workspace</div>
        <h1 className="display">
          Bring good land
          <br />
          to the right people.
        </h1>
        <div className="stats">
          <div className="stat">
            <span>Active listings</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="stat">
            <span>New inquiries</span>
            <strong>{totalInquiries}</strong>
          </div>
        </div>

        <div className="seller-tabs">
          <button
            className={tab === "listings" ? "active" : ""}
            onClick={() => setTab("listings")}
          >
            <Inbox size={15} /> My listings
          </button>
          <button
            className={tab === "new" ? "active" : ""}
            onClick={() => setTab("new")}
          >
            <Plus size={15} /> Sell land
          </button>
          <button
            className={tab === "transactions" ? "active" : ""}
            onClick={() => setTab("transactions")}
          >
            <Wallet size={15} /> Transactions
          </button>
        </div>

        {tab === "transactions" && (
          <section>
            <div className="section-heading">
              <div>
                <div className="eyebrow">Sales &amp; escrow</div>
                <h2 className="display">Incoming transactions</h2>
              </div>
              <p>
                Track every buyer payment and release escrow only when the
                ownership transfer is complete.
              </p>
            </div>
            <SellerTransactions email={sellerEmail} />
          </section>
        )}

        {tab === "listings" && (
          <section>
            {properties.length === 0 ? (
              <div className="table-wrap empty-dashboard">
                <FileCheck2 size={26} />
                <h3>You have no land listed yet</h3>
                <p className="muted">
                  Submit your first property and it will appear here with buyer
                  inquiries.
                </p>
                <button
                  className="button button-primary"
                  onClick={() => setTab("new")}
                >
                  Sell land <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">My listings</div>
                    <h2 className="display">Lands you are selling</h2>
                  </div>
                  <p>
                    Track each submission and see who is inquiring about your
                    land in real time.
                  </p>
                </div>
                <div className="seller-listing-grid">
                  {properties.map((property) => {
                    const list = inquiryMap.get(property.id) || [];
                    const newCount = list.filter(
                      (item) =>
                        item.status === "NEW" && !replied.includes(item.id),
                    ).length;
                    return (
                      <article className="seller-listing-card" key={property.id}>
                        <div
                          className="seller-listing-image"
                          style={{
                            backgroundImage: `url(${property.image})`,
                            backgroundPosition:
                              property.imagePosition || "center",
                          }}
                        />
                        <div className="seller-listing-body">
                          <div className="badge-row">
                            <span className="status">
                              {property.listingStatus.replaceAll("_", " ")}
                            </span>
                            {property.promoted && (
                              <span className="badge badge-promoted">
                                Promoted
                              </span>
                            )}
                          </div>
                          <h3>{property.title}</h3>
                          <p className="property-location">
                            <MapPin size={14} /> {property.barangay},{" "}
                            {property.city}
                          </p>
                          <div className="property-meta">
                            <span className="price">
                              {money(property.price)}
                            </span>
                            <span className="area">
                              {property.area.toLocaleString()} sqm
                            </span>
                          </div>
                          <button
                            className="button button-ghost card-action"
                            onClick={() =>
                              setOpenListingId(
                                openListingId === property.id
                                  ? null
                                  : property.id,
                              )
                            }
                          >
                            <MessageCircle size={15} /> Inquiries
                            {newCount > 0 && (
                              <span className="inquiry-count">{newCount}</span>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {openListing && (
                  <div className="inquiry-panel">
                    <div className="inquiry-panel-head">
                      <div>
                        <div className="eyebrow">Buyer inquiries</div>
                        <h3>{openListing.title}</h3>
                      </div>
                      <button
                        className="close-button"
                        aria-label="Close inquiries"
                        onClick={() => setOpenListingId(null)}
                      >
                        ×
                      </button>
                    </div>
                    {openInquiries.length === 0 ? (
                      <p className="muted">
                        No buyer inquiries yet. They will appear here as soon as
                        a buyer reaches out.
                      </p>
                    ) : (
                      <div className="inquiry-list">
                        {openInquiries.map((inquiry) => {
                          const isReplied =
                            inquiry.status === "REPLIED" ||
                            replied.includes(inquiry.id);
                          return (
                            <div className="inquiry-item" key={inquiry.id}>
                              <div className="inquiry-meta">
                                <strong>{inquiry.buyerName}</strong>
                                <span>{inquiry.buyerEmail}</span>
                                <span className="inquiry-date">
                                  {formatInquiryDate(inquiry.createdAt)}
                                </span>
                              </div>
                              <p>{inquiry.message}</p>
                              <div className="inquiry-actions">
                                {isReplied ? (
                                  <div>
                                    <span className="badge badge-verified">
                                      <FileCheck2 size={12} /> Replied
                                    </span>
                                    {inquiry.reply && (
                                      <p
                                        className="muted"
                                        style={{
                                          fontSize: ".8rem",
                                          marginTop: 6,
                                        }}
                                      >
                                        You: {inquiry.reply}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: "grid",
                                      gap: 6,
                                      width: "100%",
                                    }}
                                  >
                                    <textarea
                                      className="form-input form-textarea"
                                      placeholder="Write a reply to this buyer..."
                                      value={replies[inquiry.id] ?? ""}
                                      onChange={(event) =>
                                        setReplies((current) => ({
                                          ...current,
                                          [inquiry.id]: event.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      className="button button-primary inquiry-reply"
                                      onClick={() =>
                                        handleReply(
                                          inquiry.id,
                                          replies[inquiry.id] ?? "",
                                        )
                                      }
                                      disabled={
                                        !(replies[inquiry.id] ?? "").trim()
                                      }
                                    >
                                      <Send size={14} /> Send reply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === "new" && (
          <>
            <div className="section-heading">
              <div>
                <div className="eyebrow">New listing</div>
                <h2 className="display">Tell us about the land.</h2>
              </div>
              <p>
                Your listing is published to the marketplace right away. The
                partner agency will coordinate the transaction when a buyer is
                ready.
              </p>
            </div>
            <div className="table-wrap" style={{ padding: 22 }}>
              <div className="sell-stepper">
                {["Property", "Details", "Review"].map(
                  (label, index) => (
                    <button
                      key={label}
                      className={
                        step === index + 1
                          ? "active"
                          : step > index + 1
                            ? "complete"
                            : ""
                      }
                      onClick={() => {
                        if (step === 1 && !validateStep1() && index + 1 > 1)
                          return;
                        setStep(index + 1);
                      }}
                    >
                      <span>{index + 1}</span>
                      {label}
                    </button>
                  ),
                )}
              </div>

              {validationError && (
                <div
                  className="status-message reservation-error"
                  style={{ marginBottom: 18 }}
                >
                  {validationError}
                </div>
              )}

              <div
                className="form-grid"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                  display: step === 1 ? "grid" : "none",
                }}
              >
                <label>
                  Property title
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="e.g. Quiet ridge lot with city views"
                  />
                </label>
                <label>
                  Property type
                  <select
                    className="form-input"
                    value={form.type}
                    onChange={(event) => update("type", event.target.value)}
                  >
                    <option>Residential</option>
                    <option>Agricultural</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  Barangay
                  <select
                    className="form-input"
                    value={form.barangay}
                    onChange={(event) => update("barangay", event.target.value)}
                  >
                    {PANABO_BARANGAYS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Current service area
                  <input
                    className="form-input"
                    value={`${YUTARA_SERVICE_AREA.city}, ${YUTARA_SERVICE_AREA.province}`}
                    readOnly
                  />
                </label>
                <label>
                  Price (PHP)
                  <input
                    className="form-input"
                    value={form.price}
                    onChange={(event) => update("price", event.target.value)}
                    placeholder="₱ 2500000"
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Land area (sqm)
                  <input
                    className="form-input"
                    value={form.area}
                    onChange={(event) => update("area", event.target.value)}
                    placeholder="e.g. 250"
                    inputMode="numeric"
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea
                    className="form-input form-textarea"
                    value={form.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    placeholder="Share the useful context a buyer should know."
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Property photo
                  <input
                    className="form-input"
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await resizeImage(file);
                      update("image", dataUrl);
                    }}
                  />
                  <span className="muted" style={{ fontSize: ".76rem" }}>
                    Add a clear photo of the land. This is what buyers see in
                    the marketplace.
                  </span>
                </label>
                {form.image && (
                  <span
                    aria-hidden="true"
                    style={{
                      gridColumn: "1 / -1",
                      display: "block",
                      height: 180,
                      borderRadius: 8,
                      backgroundImage: `url(${form.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
              </div>
              {step === 2 && (
                <div
                  className="form-grid"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                  }}
                >
                  <label>
                    Registered owner name
                    <input
                      className="form-input"
                      placeholder="Name as it appears on ownership documents"
                    />
                  </label>
                  <label>
                    Ownership status
                    <select className="form-input">
                      <option>Registered owner</option>
                      <option>Authorized representative</option>
                      <option>Joint owner</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Ownership notes
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Share relevant authority, succession, or co-ownership context."
                    />
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className="review-panel">
                  <div className="review-row">
                    <span>Property</span>
                    <strong>{form.title || "Untitled property"}</strong>
                  </div>
                  <div className="review-row">
                    <span>Location</span>
                    <strong>
                      {form.barangay}, {YUTARA_SERVICE_AREA.city}
                    </strong>
                  </div>
                  <div className="review-row">
                    <span>Price / area</span>
                    <strong>
                      {form.price ? money(Number(form.price)) : "Not set"} ·{" "}
                      {form.area || "0"} sqm
                    </strong>
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(event) =>
                        setDeclaration(event.target.checked)
                      }
                    />{" "}
                    I confirm the information is accurate to the best of my
                    knowledge.
                  </label>
                </div>
              )}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 15,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div className="verification-box" style={{ margin: "0 0 20px", gridColumn: "1 / -1" }}>
                  <strong>
                    YuTara currently accepts property listings located within
                    Panabo City only.
                  </strong>
                  <p style={{ margin: "6px 0 0", fontSize: ".8rem" }}>
                    By submitting, you confirm this property is located within
                    Panabo City, Davao del Norte.
                  </p>
                </div>
                {step > 1 && (
                  <button
                    className="button button-ghost"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    className="button button-primary"
                    onClick={handleNextStep}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    className="button button-primary"
                    onClick={handleSubmit}
                    disabled={!declaration}
                  >
                    Publish listing <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
