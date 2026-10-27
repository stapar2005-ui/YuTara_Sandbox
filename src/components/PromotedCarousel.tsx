"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
} from "lucide-react";
import { money, Property } from "@/lib/marketplace";

export function PromotedCarousel({
  properties,
  saved,
  onSave,
  onOpen,
}: {
  properties: Property[];
  saved: number[];
  onSave: (id: number) => void;
  onOpen: (property: Property) => void;
}) {
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [imageFailedFor, setImageFailedFor] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Auto-advance the promoted carousel; paused on hover/focus/interaction and
  // disabled when the visitor prefers reduced motion.
  useEffect(() => {
    if (paused || properties.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % properties.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, properties.length]);

  if (!properties.length) {
    return (
      <div className="featured-empty">
        Promoted properties will appear here after YuTara verification.
      </div>
    );
  }

  const property = properties[active % properties.length];

  const move = (direction: number) =>
    setActive(
      (current) =>
        (current + direction + properties.length) % properties.length,
    );

  const endDrag = (clientX: number) => {
    if (dragStart === null) return;
    const delta = clientX - dragStart;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    setDragStart(null);
  };

  const description =
    property.description.length > 105
      ? `${property.description.slice(0, 105).trim()}...`
      : property.description;

  const imageFailed = imageFailedFor === property.id;
  const imageAlt = `${property.title} in ${property.barangay}, Panabo City`;
  const imageStyle = { objectPosition: property.imagePosition || "center" };

  const renderImage = (className: string) =>
    imageFailed ? (
      <div className={`${className} featured-image-fallback`}>
        <strong>YuTara</strong>
        <span>Property image unavailable</span>
      </div>
    ) : (
      <Image
        className={className}
        src={property.image}
        alt={imageAlt}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1199px) 90vw, 1180px"
        style={imageStyle}
        onError={() => setImageFailedFor(property.id)}
        priority
      />
    );

  const badges = (
    <div className="featured-badges">
      <span className="badge badge-promoted">Promoted</span>
      <span className="badge badge-verified">
        <Check size={12} /> YuTara Verified
      </span>
    </div>
  );

  const saveButton = (
    <button
      className="icon-button featured-save"
      aria-label={
        saved.includes(property.id) ? "Remove saved property" : "Save property"
      }
      onClick={() => onSave(property.id)}
    >
      <Heart
        size={17}
        fill={saved.includes(property.id) ? "#d79c43" : "none"}
      />
    </button>
  );

  const viewButton = (
    <button className="button button-primary" onClick={() => onOpen(property)}>
      View property <ArrowRight size={15} />
    </button>
  );

  const dots = (
    <div className="featured-dots">
      {properties.map((item, index) => (
        <button
          key={item.id}
          aria-label={`Show promoted property ${index + 1}`}
          aria-current={index === active ? "true" : undefined}
          className={index === active ? "active" : ""}
          onClick={() => setActive(index)}
        />
      ))}
    </div>
  );

  return (
    <div
      className="featured-carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      onPointerDown={(event) => {
        setPaused(true);
        setDragStart(event.clientX);
      }}
      onPointerUp={(event) => {
        endDrag(event.clientX);
        setPaused(false);
      }}
      onPointerCancel={() => {
        setDragStart(null);
        setPaused(false);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div key={property.id} className="featured-card featured-desktop-card">
        {renderImage("featured-image")}
        <div className="featured-overlay" />
        <div className="featured-content">
          {badges}
          <div className="property-type">{property.type || property.propertyType} lot</div>
          <h3>{property.title}</h3>
          <p className="featured-location">
            <MapPin size={15} /> {property.barangay}, {property.city},{" "}
            {property.province}
          </p>
          <div className="featured-price">{money(property.price)}</div>
          <div className="featured-meta">
            {property.area.toLocaleString()} sqm <span>•</span> {property.type || property.propertyType}
          </div>
          <div className="featured-actions">
            {viewButton}
            {saveButton}
          </div>
        </div>
      </div>
      <article key={`${property.id}-mobile`} className="featured-mobile-card">
        <div className="featured-mobile-image">
          {renderImage("featured-image")}
        </div>
        <div className="featured-mobile-content">
          {badges}
          <h3>{property.title}</h3>
          <p className="featured-mobile-description">{description}</p>
          <p className="featured-location">
            <MapPin size={15} /> {property.barangay}, {property.city}
          </p>
          <div className="featured-mobile-price">{money(property.price)}</div>
          <div className="featured-meta">
            {property.area.toLocaleString()} sqm <span>•</span> {property.type || property.propertyType}
          </div>
          <div className="featured-mobile-actions">
            {viewButton}
            {saveButton}
          </div>
        </div>
        <div className="featured-mobile-controls">
          <button
            className="featured-arrow"
            aria-label="Previous promoted property"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={21} />
          </button>
          {dots}
          <button
            className="featured-arrow"
            aria-label="Next promoted property"
            onClick={() => move(1)}
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </article>
      <button
        className="featured-arrow featured-arrow-left"
        aria-label="Previous promoted property"
        onClick={() => move(-1)}
      >
        <ChevronLeft size={21} />
      </button>
      <button
        className="featured-arrow featured-arrow-right"
        aria-label="Next promoted property"
        onClick={() => move(1)}
      >
        <ChevronRight size={21} />
      </button>
      <div className="featured-dots">
        {properties.map((item, index) => (
          <button
            key={item.id}
            aria-label={`Show promoted property ${index + 1}`}
            className={index === active ? "active" : ""}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}
