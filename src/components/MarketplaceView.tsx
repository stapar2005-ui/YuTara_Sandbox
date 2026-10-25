"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Filter, Search } from "lucide-react";
import { getListingStatus, isPromotionActive, Property } from "@/lib/marketplace";
import { PANABO_BARANGAYS } from "@/lib/yutara-config";
import { PropertyCard } from "./PropertyCard";
import { PromotedCarousel } from "./PromotedCarousel";

export function MarketplaceView({
  query,
  setQuery,
  type,
  setType,
  barangay,
  setBarangay,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  verifiedOnly,
  setVerifiedOnly,
  sort,
  setSort,
  filtered,
  saved,
  toggleSave,
  onOpen,
  onSell,
}: {
  query: string;
  setQuery: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  barangay: string;
  setBarangay: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
  sort: string;
  setSort: (value: string) => void;
  filtered: Property[];
  saved: number[];
  toggleSave: (id: number) => void;
  onOpen: (property: Property) => void;
  onSell: () => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const promoted = filtered.filter((property) => property.promoted);
  const affordable = filtered
    .filter((property) => !property.promoted)
    .slice(0, 6);
  const nearYou = filtered
    .filter(
      (property) =>
        !property.promoted &&
        (barangay === "All barangays" || property.barangay === barangay),
    )
    .slice(0, 6);

  const renderCards = (items: Property[]) =>
    items.length ? (
      <div className="property-grid">
        {items.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            saved={saved.includes(property.id)}
            onSave={() => toggleSave(property.id)}
            onOpen={() => onOpen(property)}
          />
        ))}
      </div>
    ) : (
      <div className="trust-card">
        <h3>No properties match this section.</h3>
        <p>Try clearing a filter or searching another Panabo barangay.</p>
      </div>
    );

  return (
    <main className="marketplace">
      <div className="container">
        <div className="market-header">
          <div>
            <div className="eyebrow">Starting in Panabo City</div>
            <h1 className="display">
              Panabo City
              <br />
              land marketplace.
            </h1>
              <p className="muted">
                Discover verified properties available across Panabo City.
              </p>
            </div>
          </div>
        <div className="market-layout">
          <aside
            id="marketplace-filters"
            className={`filter-panel ${filtersOpen ? "open" : ""}`}
          >
            <h3>Refine search</h3>
            <div className="filter-group">
              <label>Search</label>
              <div className="search-box side-search">
                <Search size={18} color="#6e7a72" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search property, barangay, type..."
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Quick actions</label>
              <div style={{ display: "grid", gap: 8 }}>
                <button
                  className="button button-gold full-button"
                  onClick={onSell}
                >
                  Sell land
                </button>
                <Link
                  className="button button-ghost full-button"
                  href="/dashboard"
                >
                  My dashboard
                </Link>
              </div>
            </div>
            <div className="filter-group">
              <label>Property type</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option>All types</option>
                <option>Residential</option>
                <option>Agricultural</option>
                <option>Commercial</option>
                <option>Industrial</option>
                <option>Other</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Barangay</label>
              <select
                value={barangay}
                onChange={(event) => setBarangay(event.target.value)}
              >
                <option>All barangays</option>
                {PANABO_BARANGAYS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Budget</label>
              <div className="range-row">
                <input
                  placeholder="Min ₱"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  inputMode="numeric"
                />
                <input
                  placeholder="Max ₱"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="filter-group">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(event) => setVerifiedOnly(event.target.checked)}
                />{" "}
                Verified only
              </label>
            </div>
            <button
              className="button button-ghost"
              onClick={() => {
                setQuery("");
                setType("All types");
                setBarangay("All barangays");
                setMinPrice("");
                setMaxPrice("");
                setVerifiedOnly(false);
              }}
            >
              Clear all
            </button>
          </aside>
          <section>
            <button
              className="button button-ghost mobile-filter"
              aria-expanded={filtersOpen}
              aria-controls="marketplace-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter size={15} />{" "}
              {filtersOpen ? "Hide refine search" : "Refine search"}
            </button>
            <section className="market-promoted-section">
              <div className="market-section-heading">
                <div>
                  <div className="eyebrow">YuTara Promoted</div>
                  <h2 className="display">YuTara Promoted</h2>
                </div>
                <p>
                  Seller-promoted properties that remain verified and open for
                  offers.
                </p>
              </div>
              <PromotedCarousel
                properties={filtered.filter(
                  (property) =>
                    isPromotionActive(property) &&
                    (property.status === "PUBLISHED" ||
                      property.verificationStatus === "VERIFIED") &&
                    getListingStatus(property) === "OPEN_FOR_OFFERS",
                )}
                saved={saved}
                onSave={toggleSave}
                onOpen={onOpen}
              />
            </section>
            <div className="results-top">
              <span className="muted">
                {filtered.length} verified Panabo City properties
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option>Recommended</option>
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            {filtered.length ? (
              <div className="market-sections">
                <section className="market-section">
                  <div className="market-section-heading">
                    <div>
                      <div className="eyebrow">YuTara Promoted</div>
                      <h2 className="display">Promoted lands</h2>
                    </div>
                    <p>
                      Seller-promoted listings placed above recommendations.
                      Promotion does not bypass verification.
                    </p>
                  </div>
                  {renderCards(promoted)}
                </section>
                <section className="market-section">
                  <div className="market-section-heading">
                    <div>
                      <div className="eyebrow">Affordable For You</div>
                      <h2 className="display">Within your preferred budget</h2>
                    </div>
                    <p>
                      {minPrice || maxPrice
                        ? "Properties within your preferred budget in Panabo City."
                        : "Set your budget to personalize this section."}
                    </p>
                  </div>
                  {renderCards(affordable)}
                </section>
                <section className="market-section">
                  <div className="market-section-heading">
                    <div>
                      <div className="eyebrow">Near You</div>
                      <h2 className="display">Properties near your barangay</h2>
                    </div>
                    <p>
                      Showing properties near{" "}
                      {barangay === "All barangays"
                        ? "your selected Panabo barangay"
                        : barangay}
                      .
                    </p>
                  </div>
                  {renderCards(nearYou)}
                </section>
                <section className="market-section">
                  <div className="market-section-heading">
                    <div>
                      <div className="eyebrow">Full marketplace</div>
                      <h2 className="display">All land for sale</h2>
                    </div>
                    <p>
                      Every active, verified Panabo City listing matching your
                      filters.
                    </p>
                  </div>
                  {renderCards(filtered)}
                </section>
              </div>
            ) : (
              <div className="trust-card">
                <h3>No properties match your filters.</h3>
                <p>
                  Try clearing a filter or searching another Panabo barangay.
                </p>
              </div>
            )}
            <div style={{ marginTop: 26 }}>
              <button className="button button-gold" onClick={onSell}>
                Have land to list? Sell with YuTara <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
