"use client";

import { ArrowRight, Heart, MapPin } from "lucide-react";
import { getListingStatus, money, Property, roadAccessLabel } from "@/lib/marketplace";

const STATUS_CONFIG: Record<string, { label: string; variant: "green" | "amber" | "red" | "gray" }> = {
  OPEN_FOR_OFFERS: { label: "Open for Offers", variant: "green" },
  BOOKING_REQUESTED: { label: "Booking Requested", variant: "amber" },
  RESERVED: { label: "Reserved", variant: "amber" },
  CLOSED: { label: "Closed", variant: "gray" },
  SOLD: { label: "Sold", variant: "red" },
  TERMINATED: { label: "Terminated", variant: "red" },
};

export function PropertyCard({
  property,
  saved,
  onSave,
  onOpen,
  onRequestBooking,
}: {
  property: Property;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  onRequestBooking?: () => void;
}) {
  const status = getListingStatus(property);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN_FOR_OFFERS;
  const isBookable = status === "OPEN_FOR_OFFERS";
  const pricePerSqm = property.area > 0 ? Math.round(property.price / property.area) : 0;

  return (
    <article className="property-card group fade-up">
      <div
        className="property-image"
        style={{
          backgroundImage: `url(${property.image})`,
          backgroundPosition: property.imagePosition || "center",
        }}
      >
        <span className={`badge badge-${config.variant}`}>
          {config.label}
        </span>
        {property.promoted && (
          <span className="badge badge-gray">Promoted</span>
        )}
        <button
          className="save-float"
          aria-label={saved ? "Remove saved property" : "Save property"}
          onClick={onSave}
        >
          <Heart
            size={16}
            fill={saved ? "#d79c43" : "none"}
            color={saved ? "#d79c43" : "currentColor"}
          />
        </button>
        {isBookable && onRequestBooking && (
          <button
            className="book-request-float"
            aria-label="Request booking"
            onClick={onRequestBooking}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div className="property-body">
        <div className="property-type">
          {property.type || property.propertyType} lot
        </div>
        <h3 className="property-title">{property.title}</h3>
        <div className="property-location">
          <MapPin size={14} /> {property.barangay}, {property.city}
        </div>
        <div className="property-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="price">{money(property.price)}</span>
            <span className="price-per-sqm" style={{ fontSize: "0.74rem", color: "#666" }}>
              ₱{pricePerSqm.toLocaleString()}/sqm
            </span>
          </div>
          <span className="area" style={{ whiteSpace: "nowrap", marginLeft: "auto" }}>{property.area.toLocaleString()} sqm</span>
        </div>
        <div className="property-road-access">
          <MapPin size={12} />
          <span>{roadAccessLabel[property.roadAccess]}</span>
        </div>
        {!isBookable && (
          <p className="status-note muted" style={{ marginTop: 8, fontSize: ".75rem" }}>
            {status === "BOOKING_REQUESTED"
              ? "A booking request is pending seller review."
              : status === "RESERVED"
                ? "This property is currently reserved."
                : status === "CLOSED"
                  ? "This listing is closed."
                  : status === "SOLD"
                    ? "This property has been sold."
                    : "This listing is no longer available."}
          </p>
        )}
        <button className="btn btn-ghost card-action" onClick={onOpen}>
          View property <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}
