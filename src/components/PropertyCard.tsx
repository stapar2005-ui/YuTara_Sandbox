"use client";

import { ArrowRight, Check, Heart, MapPin } from "lucide-react";
import { getListingStatus, money, Property } from "@/lib/marketplace";

export function PropertyCard({
  property,
  saved,
  onSave,
  onOpen,
}: {
  property: Property;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const isVerified =
    property.status === "PUBLISHED" || property.verificationStatus === "VERIFIED";

  return (
    <article className="property-card">
      <div
        className="property-image"
        style={{
          backgroundImage: `url(${property.image})`,
          backgroundPosition: property.imagePosition || "center",
        }}
      >
        <div className="badge-row">
          {isVerified && (
            <span className="badge badge-verified">
              <Check size={12} /> Verified
            </span>
          )}
          {property.promoted && (
            <span className="badge badge-promoted">Promoted</span>
          )}
          <span
            className={`badge badge-status ${getListingStatus(property).toLowerCase()}`}
          >
            {getListingStatus(property).replaceAll("_", " ")}
          </span>
        </div>
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
      </div>
      <div className="property-body">
        <div className="property-type">{property.type || property.propertyType} lot</div>
        <h3>{property.title}</h3>
        <div className="property-location">
          <MapPin size={14} /> {property.barangay}, {property.city}
        </div>
        <div className="property-meta">
          <span className="price">{money(property.price)}</span>
          <span className="area">{property.area.toLocaleString()} sqm</span>
        </div>
        <button className="button button-ghost card-action" onClick={onOpen}>
          View property <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}
