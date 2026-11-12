"use client";

import { useState } from "react";
import { ArrowRight, Filter, MapPin, Search } from "lucide-react";
import { getListingStatus, Property } from "@/lib/marketplace";
import { PANABO_BARANGAYS } from "@/lib/yutara-config";
import { PropertyCard } from "@/components/PropertyCard";
import { PromotedCarousel } from "@/components/PromotedCarousel";
import { DemoUser } from "@/lib/demo-auth";

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
  sort,
  setSort,
  filtered,
  saved,
  toggleSave,
  onOpen,
  onSell,
  session,
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
  sort: string;
  setSort: (value: string) => void;
  filtered: Property[];
  saved: number[];
  toggleSave: (id: number) => void;
  onOpen: (property: Property) => void;
  onSell: () => void;
  session: DemoUser | null;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const showSearchResults = hasSearched;

  const promoted = filtered.filter((property) => property.promoted);
  const nonPromoted = filtered.filter((property) => !property.promoted);

  const renderCards = (items: Property[], heading: string, eyebrow: string, showWhenEmpty: boolean = true) => {
    if (items.length === 0 && !showWhenEmpty) return null;
    return (
      <section className="market-section">
        <div className="market-section-heading">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{heading}</h2>
          </div>
        </div>
        {items.length ? (
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
          <div className="empty-state">
            <MapPin size={32} />
            <h3>No properties match your filters.</h3>
            <p>Try adjusting your search criteria.</p>
            <button className="btn btn-ghost" onClick={() => {
              setQuery("");
              setType("All types");
              setBarangay("All barangays");
              setMinPrice("");
              setMaxPrice("");
              setHasSearched(false);
            }}>
              Clear all filters
            </button>
          </div>
        )}
      </section>
    );
  };

  const handleSearch = () => {
    setHasSearched(true);
    setFiltersOpen(false);
  };

  return (
    <div className="marketplace-page page">
      <div className="container">
        <div className="market-search-trigger-row">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="marketplace-search-panel"
          >
            <Filter size={16} /> Search Land
          </button>
          {session && (
            <span className="market-saved-count">
              {saved.length} {saved.length === 1 ? "saved land" : "saved lands"}
            </span>
          )}
        </div>

        <form
          id="marketplace-search-panel"
          className={`market-search-panel market-search-toolbar ${filtersOpen ? "open" : ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <label className="market-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search land by name, location, or type"
              placeholder="Search land by name, location, or type"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
          <div className="filter-group">
            <label htmlFor="marketplace-property-type">Property type</label>
            <select
              id="marketplace-property-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="input"
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
            <label htmlFor="marketplace-barangay">Barangay</label>
            <select
              id="marketplace-barangay"
              value={barangay}
              onChange={(event) => setBarangay(event.target.value)}
              className="input"
            >
              <option>All barangays</option>
              {PANABO_BARANGAYS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Price range</label>
            <div className="range-row">
              <input
                placeholder="Min ₱"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                inputMode="numeric"
                className="input"
                aria-label="Minimum price"
              />
              <input
                placeholder="Max ₱"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                inputMode="numeric"
                className="input"
                aria-label="Maximum price"
              />
            </div>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setQuery("");
              setType("All types");
              setBarangay("All barangays");
              setMinPrice("");
              setMaxPrice("");
              setHasSearched(false);
              setFiltersOpen(false);
            }}
          >
            Clear
          </button>
        </form>

        <div className="market-layout">

          <section className="market-results">
            {!showSearchResults && (
              <>
                <section className="market-promoted-section">
                  <div className="market-section-heading">
                    <div>
                      <div className="eyebrow">YuTara Promoted</div>
                      <h2>Featured Promoted Lands</h2>
                    </div>
                    <p>
                      Seller-promoted properties that remain open for offers.
                    </p>
                  </div>
                  <PromotedCarousel
                    properties={promoted.filter(
                      (property) =>
                        getListingStatus(property) === "OPEN_FOR_OFFERS",
                    )}
                    saved={saved}
                    onSave={toggleSave}
                    onOpen={onOpen}
                  />
                </section>

                <div className="market-sections">
                  {renderCards(nonPromoted, "All land for sale", "All Listings")}
                </div>
              </>
            )}

            {showSearchResults && (
              <div className="market-sections">
                {renderCards(filtered, "Matching properties", "Search Results")}
              </div>
            )}

            {!showSearchResults && filtered.length === 0 && (
              <div className="empty-state">
                <MapPin size={32} />
                <h3>No properties available.</h3>
                <p>
                  There are no active listings at the moment.
                </p>
              </div>
            )}

            <div className="market-sell-callout">
              <button className="btn btn-outline" onClick={onSell}>
                Have land to list? Sell with YuTara <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
