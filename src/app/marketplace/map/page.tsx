"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import {
  formatMoney,
  isActiveListing,
  MarketplaceProperty,
  roadAccessLabel,
} from "@/lib/marketplace";
import { readProperties, PROPERTIES_EVENT } from "@/lib/property-store";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";

export default function VerifiedMapPage() {
  const [listings, setListings] = useState<MarketplaceProperty[]>(() =>
    readProperties().filter(isActiveListing),
  );
  const [selectedId, setSelectedId] = useState<number | undefined>(
    () => readProperties().filter(isActiveListing)[0]?.id,
  );
  const [session] = useState<DemoUser | null>(() => getStoredSession());

  useEffect(() => {
    const sync = () => setListings(readProperties().filter(isActiveListing));
    window.addEventListener(PROPERTIES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPERTIES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const selected = useMemo(
    () => listings.find((property) => property.id === selectedId) ?? listings[0],
    [listings, selectedId],
  );
  return (
    <div className="app-shell">
      <AppNav session={session} />
      <main className="map-page">
        <div className="container">
          <div className="map-heading">
            <div>
              <div className="eyebrow">Verified Map</div>
              <h1 className="display">Discover verified land with confidence.</h1>
              <p className="muted">
                Explore verified properties, locations, and available road access in Panabo City.
              </p>
            </div>
            <Link className="button button-ghost" href="/?view=marketplace">
              Browse cards
            </Link>
          </div>
          <div className="map-layout">
            <section className="map-canvas" aria-label="Property map">
              <div className="map-watermark">PANABO CITY</div>
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              {listings.map((property, index) => (
                <button
                  key={property.id}
                  className={`map-marker ${selected?.id === property.id ? "selected" : ""}`}
                  style={{
                    left: `${14 + ((index * 19) % 72)}%`,
                    top: `${18 + ((index * 27) % 62)}%`,
                  }}
                  onClick={() => setSelectedId(property.id)}
                  aria-label={`Select ${property.title}`}
                >
                  <MapPin size={17} />
                  <span>{formatMoney(property.price)}</span>
                </button>
              ))}
              <p className="map-disclaimer">
                Map boundaries are for discovery and reference only and do not replace an official land survey.
              </p>
            </section>
            {selected && <MapPropertyPreview property={selected} />}
          </div>
          <div className="map-list">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Verified and open for offers</div>
                <h2 className="display">Active Panabo listings</h2>
              </div>
            </div>
            <div className="property-grid">
              {listings.map((property) => (
                <article className="property-card" key={property.id}>
                  <div className="property-image" style={{ backgroundImage: `url(${property.image})` }}>
                    <span className="badge badge-verified"><Check size={12} /> YuTara verified</span>
                  </div>
                  <div className="property-body">
                    <div className="property-type">{property.propertyType} lot</div>
                    <h3>{property.title}</h3>
                    <div className="property-location"><MapPin size={14} /> {property.barangay}, Panabo City</div>
                    <div className="property-meta"><span className="price">{formatMoney(property.price)}</span><span className="area">{property.area.toLocaleString()} sqm</span></div>
                    <Link className="button button-ghost card-action" href={`/marketplace/${property.id}`}>View property <ArrowRight size={15} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MapPropertyPreview({ property }: { property: MarketplaceProperty }) {
  return (
    <aside className="map-preview">
      <div className="eyebrow">Selected property</div>
      <div className="map-preview-image" style={{ backgroundImage: `url(${property.image})` }} />
      <h3>{property.title}</h3>
      <div className="property-location"><MapPin size={15} /> {property.barangay}, Panabo City</div>
      <div className="detail-price">{formatMoney(property.price)}</div>
      <div className="detail-specs">
        <div className="spec"><span>Area</span><strong>{property.area.toLocaleString()} sqm</strong></div>
        <div className="spec"><span>Type</span><strong>{property.propertyType}</strong></div>
        <div className="spec"><span>Road</span><strong>{roadAccessLabel[property.roadAccess]}</strong></div>
      </div>
      <p>{property.description}</p>
      <div className="map-preview-actions">
        <Link className="button button-primary" href={`/marketplace/${property.id}`}>Open details</Link>
        <Link className="button button-ghost" href={`/reservation/${property.id}`}>Reserve</Link>
      </div>
    </aside>
  );
}
