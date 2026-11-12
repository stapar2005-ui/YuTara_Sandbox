"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { MarketplaceRouteLayout } from "@/components/MarketplaceRouteLayout";
import {
  formatMoney,
  isActiveListing,
  MarketplaceProperty,
  roadAccessLabel,
} from "@/lib/marketplace";
import { readProperties, PROPERTIES_EVENT } from "@/lib/property-store";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";

type MapMarkerGroup = {
  properties: MarketplaceProperty[];
  leftPct: number;
  topPct: number;
};

function getMapPosition(property: MarketplaceProperty) {
  const minLat = 7.25;
  const maxLat = 7.36;
  const minLng = 125.62;
  const maxLng = 125.75;
  return {
    leftPct: Math.max(10, Math.min(85, ((property.longitude - minLng) / (maxLng - minLng)) * 100)),
    topPct: Math.max(10, Math.min(80, (1 - (property.latitude - minLat) / (maxLat - minLat)) * 100)),
  };
}

function groupNearbyListings(
  properties: MarketplaceProperty[],
  canvasWidth: number,
  canvasHeight: number,
): MapMarkerGroup[] {
  const positioned = properties.map((property) => ({ property, ...getMapPosition(property) }));
  // Group pins whose labels would touch at the current viewport size.
  const markerWidth = canvasWidth <= 560 ? 48 : 116;
  const markerHeight = canvasWidth <= 560 ? 44 : 46;
  const groups: MapMarkerGroup[] = [];
  positioned.forEach((item) => {
    const nearbyGroup = groups.find((group) => {
      const deltaX = Math.abs(group.leftPct - item.leftPct) * canvasWidth / 100;
      const deltaY = Math.abs(group.topPct - item.topPct) * canvasHeight / 100;
      return deltaX < markerWidth && deltaY < markerHeight;
    });
    if (nearbyGroup) {
      nearbyGroup.properties.push(item.property);
    } else {
      groups.push({
        properties: [item.property],
        leftPct: item.leftPct,
        topPct: item.topPct,
      });
    }
  });
  return groups;
}

export default function VerifiedMapPage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceProperty[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [session, setSession] = useState<DemoUser | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 520 });
  const mapCanvasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      setCanvasSize((current) => current.width === width && current.height === height ? current : { width, height });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    updateSize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = async () => {
      const currentSession = getStoredSession();
      setSession(currentSession);
      if (currentSession?.role === "ADMIN") {
        router.replace("/?view=admin#land-listings");
        return;
      }
      const next = (await readProperties()).filter(isActiveListing);
      setListings(next);
      setSelectedId((current) => current ?? next[0]?.id);
      setSession(currentSession);
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener(PROPERTIES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PROPERTIES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [router]);

  const selected = useMemo(
    () => listings.find((property) => property.id === selectedId) ?? listings[0],
    [listings, selectedId],
  );
  const markerGroups = useMemo(
    () => groupNearbyListings(listings, canvasSize.width, canvasSize.height),
    [listings, canvasSize],
  );
  const selectedGroup = markerGroups.find((group) => group.properties.some((property) => property.id === selected?.id));
  return (
    <MarketplaceRouteLayout session={session} pageTitle="Map view">
      <div className="map-page">
        <div className="container">
          <div className="map-heading">
            <div>
              <div className="eyebrow">View map</div>
              <h1 className="display">Discover verified land with confidence.</h1>
              <p className="muted">
                Explore the same active listings available in card view, with
                location and road-access context in Panabo City.
              </p>
            </div>
            <Link className="button button-ghost" href="/?view=marketplace">
              Browse listings
            </Link>
          </div>
          <div className="map-layout">
            <section className="map-canvas" aria-label="Property map" ref={mapCanvasRef}>
              <div className="map-watermark">PANABO CITY</div>
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              {markerGroups.map((group) => {
                const selectedIndex = group.properties.findIndex((property) => property.id === selected?.id);
                const markerProperty = selectedIndex >= 0 ? group.properties[selectedIndex] : group.properties[0];
                const isCluster = group.properties.length > 1;
                return (
                  <button
                    key={group.properties[0].id}
                    className={`map-marker ${isCluster ? "map-cluster" : ""} ${selected?.id === markerProperty.id ? "selected" : ""}`}
                    style={{
                      left: `${group.leftPct}%`,
                      top: `${group.topPct}%`,
                    }}
                    onClick={() => {
                      const nextIndex = selectedIndex < 0 ? 0 : (selectedIndex + 1) % group.properties.length;
                      setSelectedId(group.properties[nextIndex].id);
                    }}
                    aria-label={isCluster
                      ? `${group.properties.length} nearby listings. Showing ${Math.max(selectedIndex, 0) + 1} of ${group.properties.length}: ${markerProperty.title}. Click to cycle.`
                      : `Select ${markerProperty.title}`}
                    title={isCluster ? `${group.properties.length} nearby listings — click to cycle` : markerProperty.title}
                  >
                    <MapPin size={17} />
                    <span>{isCluster ? `${group.properties.length} nearby` : formatMoney(markerProperty.price)}</span>
                  </button>
                );
              })}
              <p className="map-disclaimer">
                Nearby listings are grouped for clarity. Locations are approximate and do not replace an official land survey.
              </p>
            </section>
            {selected && <MapPropertyPreview
              property={selected}
              nearbyListings={selectedGroup?.properties ?? [selected]}
              onSelect={setSelectedId}
            />}
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
      </div>
    </MarketplaceRouteLayout>
  );
}

function MapPropertyPreview({
  property,
  nearbyListings,
  onSelect,
}: {
  property: MarketplaceProperty;
  nearbyListings: MarketplaceProperty[];
  onSelect: (id: number) => void;
}) {
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
      {nearbyListings.length > 1 && <div className="map-nearby-listings" aria-label="Nearby listings">
        <strong>{nearbyListings.length} nearby listings</strong>
        {nearbyListings.map((listing) => (
          <button
            key={listing.id}
            type="button"
            aria-pressed={listing.id === property.id}
            onClick={() => onSelect(listing.id)}
          >
            {listing.title}
          </button>
        ))}
      </div>}
      <p>{property.description}</p>
      <div className="map-preview-actions">
        <Link className="button button-primary" href={`/marketplace/${property.id}`}>Open details</Link>
        <Link className="button button-ghost" href={`/reservation/${property.id}`}>Reserve</Link>
      </div>
    </aside>
  );
}
