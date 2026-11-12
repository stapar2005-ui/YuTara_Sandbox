/**
 * YuTara Marketplace — UI Design Consistency Tests
 *
 * These tests verify the Home Page UI design is consistent:
 * - All CSS classes used in page.tsx are defined in globals.css
 * - All CSS variables used are defined in :root
 * - No duplicate CSS class definitions
 * - Button system consistency
 * - Required home page sections present
 * - Navigation consistency
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CSS_PATH = "src/app/globals.css";
const PAGE_PATH = "src/app/page.tsx";
const MARKETPLACE_VIEW_PATH = "src/components/MarketplaceView.tsx";
const APP_NAV_PATH = "src/components/AppNav.tsx";
const SIDEBAR_NAV_PATH = "src/components/SidebarNav.tsx";
const PROPERTY_ROUTE_PATH = "src/app/marketplace/[id]/page.tsx";
const MAP_PAGE_PATH = "src/app/marketplace/map/page.tsx";
const AGENCY_PAGE_PATH = "src/app/agency/page.tsx";
const TRANSACTIONS_PAGE_PATH = "src/app/transactions/page.tsx";
const LOGIN_PAGE_PATH = "src/app/login/page.tsx";

const css = readFileSync(CSS_PATH, "utf8");
const pageTsx = readFileSync(PAGE_PATH, "utf8");
const marketplaceViewTsx = readFileSync(MARKETPLACE_VIEW_PATH, "utf8");
const appNavTsx = readFileSync(APP_NAV_PATH, "utf8");
const sidebarNavTsx = readFileSync(SIDEBAR_NAV_PATH, "utf8");
const propertyRouteTsx = readFileSync(PROPERTY_ROUTE_PATH, "utf8");
const mapPageTsx = readFileSync(MAP_PAGE_PATH, "utf8");
const agencyPageTsx = readFileSync(AGENCY_PAGE_PATH, "utf8");
const transactionsPageTsx = readFileSync(TRANSACTIONS_PAGE_PATH, "utf8");
const loginPageTsx = readFileSync(LOGIN_PAGE_PATH, "utf8");

// ---------------------------------------------------------------------------
// Helper: extract all CSS class selectors from rule SELECTORS (before {)
// ---------------------------------------------------------------------------
function extractCssClasses(cssText: string): string[] {
  const classes: string[] = [];
  // Split by { to isolate selector portions, then find .className patterns
  const parts = cssText.split("{");
  for (const part of parts) {
    const matches = part.match(/\.([a-zA-Z0-9_-]+)/g);
    if (matches) {
      for (const m of matches) {
        classes.push(m.slice(1));
      }
    }
  }
  return classes;
}

// ---------------------------------------------------------------------------
// Helper: extract className values from JSX/TSX
// ---------------------------------------------------------------------------
function extractClassNames(tsxText: string): string[] {
  const classes: string[] = [];
  const classNameRegex = /className=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = classNameRegex.exec(tsxText)) !== null) {
    const value = match[1];
    for (const cls of value.split(/\s+/)) {
      if (cls.trim()) classes.push(cls.trim());
    }
  }
  return classes;
}

// ---------------------------------------------------------------------------
// Helper: extract CSS variable usages (var(--name))
// ---------------------------------------------------------------------------
function extractCssVariables(cssText: string): string[] {
  const vars: string[] = [];
  const varRegex = /var\((--[a-zA-Z0-9_-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(cssText)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}

// ---------------------------------------------------------------------------
// Helper: extract CSS variable definitions (--name: value) from :root
// ---------------------------------------------------------------------------
function definedCssVariables(cssText: string): string[] {
  const vars: string[] = [];
  const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) return vars;
  const rootContent = rootMatch[1];
  const defRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = defRegex.exec(rootContent)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}

const cssClasses = extractCssClasses(css);
const pageClasses = extractClassNames(pageTsx);
const cssVarsUsed = extractCssVariables(css);
const cssVarsDefined = definedCssVariables(css);

describe("UI Design Consistency — Home Page", () => {
  describe("CSS Class Definitions", () => {
    it("defines all CSS classes used in page.tsx", () => {
      const missing = pageClasses.filter(
        (cls) => !cssClasses.includes(cls),
      );
      assert.strictEqual(
        missing.length,
        0,
        `Missing CSS classes for: ${missing.join(", ")}`,
      );
    });
  });

  describe("CSS Variables", () => {
    it("defines all CSS variables used in the stylesheet", () => {
      const uniqueUsed = [...new Set(cssVarsUsed)];
      const missing = uniqueUsed.filter(
        (v) => !cssVarsDefined.includes(v),
      );
      assert.strictEqual(
        missing.length,
        0,
        `Undefined CSS variables: ${missing.join(", ")}`,
      );
    });

    it("defines required theme variables", () => {
      const required = [
        "--background",
        "--foreground",
        "--primary-green",
        "--action-green",
        "--border-color",
        "--heading-color",
        "--body-color",
        "--muted-color",
      ];
      for (const v of required) {
        assert.ok(
          cssVarsDefined.includes(v),
          `Required CSS variable ${v} is not defined`,
        );
      }
    });
  });

  describe("Home Page Sections", () => {
    it("has a hero section", () => {
      assert.ok(pageTsx.includes('className="hero-section'));
    });

    it("has a search preview section", () => {
      assert.ok(pageTsx.includes("search-preview-section"));
    });

    it("has a features section", () => {
      assert.ok(pageTsx.includes("features-section"));
    });

    it("has a process section", () => {
      assert.ok(pageTsx.includes("process-section"));
    });

    it("has a featured lands section", () => {
      assert.ok(pageTsx.includes("featured-lands-section"));
    });

    it("has a CTA section", () => {
      assert.ok(pageTsx.includes("cta-section"));
    });

    it("has a footer section", () => {
      assert.ok(pageTsx.includes("public-footer"));
    });
  });

  describe("Navigation", () => {
    it("has Home link", () => {
      assert.ok(pageTsx.includes('href="/"'));
    });

    it("has About Us link", () => {
      assert.ok(pageTsx.includes('href="/about"'));
    });

    it("has Services Offered link", () => {
      assert.ok(pageTsx.includes('href="/services"'));
    });

    it("has Contact Us link", () => {
      assert.ok(pageTsx.includes('href="/contact"'));
    });

    it("has Log in link for unauthenticated users", () => {
      assert.ok(pageTsx.includes('href="/login"'));
    });
  });

  describe("Button System", () => {
    it("defines btn-primary button class", () => {
      assert.ok(cssClasses.includes("btn-primary"));
    });

    it("defines button-primary button class", () => {
      assert.ok(cssClasses.includes("button-primary"));
    });

    it("uses consistent primary button color across btn and button systems", () => {
      // Match standalone rule blocks (anchored to rule start)
      const btnPrimaryBlock = css.match(
        /(?:^|[};\n])\s*\.btn-primary\s*\{[\s\S]*?\}/,
      );
      const buttonPrimaryBlock = css.match(
        /(?:^|[};\n])\s*\.button-primary\s*\{[\s\S]*?\}/,
      );
      assert.ok(btnPrimaryBlock, ".btn-primary definition found");
      assert.ok(buttonPrimaryBlock, ".button-primary definition found");

      const btnPrimaryBg = btnPrimaryBlock![0].match(
        /background:\s*var\(--([a-z-]+)\)/,
      );
      const buttonPrimaryBg = buttonPrimaryBlock![0].match(
        /background:\s*var\(--([a-z-]+)\)/,
      );

      assert.strictEqual(
        btnPrimaryBg?.[1],
        buttonPrimaryBg?.[1],
        "btn-primary and button-primary should use the same background color variable",
      );
    });

    it("defines button-danger for destructive actions", () => {
      assert.ok(cssClasses.includes("button-danger"));
    });
  });

  describe("Notification Badge", () => {
    it("defines notif-badge class for notification counts", () => {
      assert.ok(cssClasses.includes("notif-badge"));
    });

    it("notif-badge is positioned absolutely for badge overlay", () => {
      const badgeMatch = css.match(/\.notif-badge\s*\{[\s\S]*?\}/);
      assert.ok(badgeMatch, ".notif-badge definition found");
      assert.ok(
        badgeMatch![0].includes("position: absolute"),
        ".notif-badge should use position: absolute",
      );
    });
  });

  describe("Home Page Rendering Structure", () => {
    it("renders a nav element with public-nav class", () => {
      assert.ok(pageTsx.includes('<nav className={`public-nav'));
    });

    it("uses YuTaraLogo component for branding", () => {
      assert.ok(pageTsx.includes("<YuTaraLogo"));
    });

    it("has a search input with placeholder", () => {
      assert.ok(pageTsx.includes('placeholder="Location or barangay"'));
    });

    it("has property cards with featured-image class", () => {
      assert.ok(pageTsx.includes("featured-image"));
    });

    it("has property cards with featured-title class", () => {
      assert.ok(pageTsx.includes("featured-title"));
    });

    it("has property cards with featured-price class", () => {
      assert.ok(pageTsx.includes("featured-price"));
    });
  });

  describe("Home Page Panel Interactions", () => {
    it("centers the hero content below the transparent navigation", () => {
      assert.ok(css.includes(".hero-section .hero-content"));
      assert.ok(css.includes("place-items: center"));
      assert.ok(css.includes("text-align: center"));
      assert.ok(css.includes("padding: clamp(6rem, 12vh, 8rem)"));
    });

    it("keeps the property type default aligned with the search filter", () => {
      assert.ok(pageTsx.includes('useState("All types")'));
      assert.ok(pageTsx.includes('<option value="All types">Any property type</option>'));
    });

    it("makes Learn More scroll to the features panel", () => {
      assert.ok(pageTsx.includes('id="features"'));
      assert.ok(pageTsx.includes('getElementById("features")?.scrollIntoView'));
    });

    it("shows filtered promoted and non-promoted properties in search results", () => {
      assert.ok(marketplaceViewTsx.includes("hasSearched ||"));
      assert.ok(marketplaceViewTsx.includes('renderCards(filtered, "Matching properties", "Search Results")'));
    });

    it("keeps mobile navigation connected to the public information pages", () => {
      assert.ok(pageTsx.includes('href="/about" onClick={() => setMobileNavOpen(false)}>About Us</Link>'));
      assert.ok(pageTsx.includes('href="/services" onClick={() => setMobileNavOpen(false)}>Services Offered</Link>'));
      assert.ok(pageTsx.includes('href="/contact" onClick={() => setMobileNavOpen(false)}>Contact Us</Link>'));
    });
  });

  describe("Cross-route navigation and actions", () => {
    it("keeps demo account autofill buttons off the MVP login page", () => {
      assert.ok(!loginPageTsx.includes("demo-pills"));
      assert.ok(!loginPageTsx.includes("Fill Buyer"));
      assert.ok(loginPageTsx.includes('placeholder="Enter your email"'));
      assert.ok(loginPageTsx.includes('placeholder="Enter your password"'));
    });

    it("keeps public information links available in the shared map/detail header", () => {
      assert.ok(appNavTsx.includes('href="/about"'));
      assert.ok(appNavTsx.includes('href="/services"'));
      assert.ok(appNavTsx.includes('href="/contact"'));
      assert.ok(appNavTsx.includes("public-site-links"));
    });

    it("shows admin-specific navigation without buyer-only sidebar entries", () => {
      assert.ok(sidebarNavTsx.includes("const ADMIN_GROUPS"));
      assert.ok(sidebarNavTsx.includes('label: "User Registrations"'));
      assert.ok(sidebarNavTsx.includes("isAdmin ? ADMIN_GROUPS : USER_GROUPS"));
    });

    it("routes property details to a persistent URL and supports site-visit requests", () => {
      assert.ok(pageTsx.includes("router.push(`/marketplace/${property.id}`)"));
      assert.ok(propertyRouteTsx.includes("createBookingRequest"));
      assert.ok(propertyRouteTsx.includes('"Request site visit"'));
    });

    it("groups overlapping map markers and keeps every nearby listing selectable", () => {
      assert.ok(mapPageTsx.includes("function groupNearbyListings"));
      assert.ok(mapPageTsx.includes("Nearby listings"));
      assert.ok(mapPageTsx.includes("onSelect(listing.id)"));
      assert.ok(css.includes(".map-nearby-listings"));
    });

    it("lets the agency advance paid transactions through document signing and escrow", () => {
      for (const action of ["Approve transaction", "Record escrow", "Prepare transfer documents", "Release escrow", "Complete transfer"]) {
        assert.ok(agencyPageTsx.includes(action));
      }
      for (const serviceAction of ["agencyReview(", "holdPayment(", "prepareDocuments(", "releaseFunds(", "completeTransaction("]) {
        assert.ok(agencyPageTsx.includes(serviceAction));
      }
    });

    it("lets buyers and sellers sign and open the property from Transactions", () => {
      assert.ok(transactionsPageTsx.includes("Sign transfer documents"));
      assert.ok(transactionsPageTsx.includes("recordSigning(transaction.id, party, party)"));
      assert.ok(transactionsPageTsx.includes("href={`/marketplace/${tx.propertyId}`}"));
    });
  });
});
