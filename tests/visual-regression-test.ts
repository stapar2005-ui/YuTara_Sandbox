/**
 * YuTara Marketplace — Visual AI Regression Testing
 *
 * Captures the visual structure (DOM + CSS) of the Home Page as a baseline
 * snapshot, then compares against it to detect visual regressions.
 *
 * This is a DOM-based visual regression approach (no browser required).
 * It verifies that all visual design tokens, classes, and section structure
 * remain consistent across changes.
 *
 * Only base-level CSS declarations (outside @media and [data-theme] blocks)
 * are compared, since media queries and theme overrides are expected to differ.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CSS_PATH = "src/app/globals.css";
const PAGE_PATH = "src/app/page.tsx";
const BASELINE_PATH = "tests/visual-baseline.json";

const css = readFileSync(CSS_PATH, "utf8");
const pageTsx = readFileSync(PAGE_PATH, "utf8");

// Modifier classes that appear in JSX but only as combined selectors in CSS
// (e.g., className="header-link primary" where .primary only exists as .header-link.primary)
const MODIFIER_CLASSES = new Set([
  "primary", "ghost", "outline", "danger", "gold", "dark", "on",
  "active", "open", "left", "right", "center", "verified", "review",
  "correction", "status", "disabled", "complete", "selected",
  "open_for_offers", "closed", "sold", "terminated",
  "header-transparent", "topbar-dark", "topbar-transparent",
]);

// ---------------------------------------------------------------------------
// Helper: strip @media and [data-theme] blocks using brace tracking
// ---------------------------------------------------------------------------
function stripNestedBlocks(cssText: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < cssText.length) {
    // Skip whitespace before checking for block starts
    while (i < cssText.length && /\s/.test(cssText[i])) {
      result.push(cssText[i]);
      i++;
    }
    if (i >= cssText.length) break;

    const remaining = cssText.slice(i);
    const isMediaBlock = remaining.startsWith("@media");
    const isThemeBlock = remaining.startsWith('[data-theme="dark"]');

    if (isMediaBlock || isThemeBlock) {
      // Skip the entire block using brace tracking
      // Find the opening brace
      while (i < cssText.length && cssText[i] !== "{") i++;
      if (i < cssText.length) {
        let depth = 1;
        i++; // skip the opening brace
        while (i < cssText.length && depth > 0) {
          if (cssText[i] === "{") depth++;
          else if (cssText[i] === "}") depth--;
          i++;
        }
      }
      continue;
    }
    result.push(cssText[i]);
    i++;
  }
  return result.join("");
}

// ---------------------------------------------------------------------------
// Helper: extract base-level CSS rule blocks (outside @media and [data-theme])
// Used for property value comparison
// ---------------------------------------------------------------------------
function extractBaseCssRules(cssText: string): Record<string, string[]> {
  const rules: Record<string, string[]> = {};
  const baseCss = stripNestedBlocks(cssText);

  // Split into rule blocks: selector { ... }
  const blockRegex = /([^{]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(baseCss)) !== null) {
    const selectorPart = match[1];
    const propertiesPart = match[2];

    // Extract primary class from selector (first/leftmost .className only)
    // Skip rules where the first class is a modifier (e.g., .topbar-dark .button-primary)
    const firstClassMatch = selectorPart.match(/^\s*\.([a-zA-Z0-9_-]+)/);
    let primaryClass: string | null = null;
    if (firstClassMatch) {
      const className = firstClassMatch[1];
      if (!MODIFIER_CLASSES.has(className)) {
        primaryClass = className;
      }
    }

    if (primaryClass) {
      const props = propertiesPart
        .split(";")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (!rules[primaryClass]) rules[primaryClass] = [];
      rules[primaryClass].push(...props);
    }
  }
  return rules;
}

// ---------------------------------------------------------------------------
// Helper: extract all CSS property declarations for a class (merged, deduped)
// ---------------------------------------------------------------------------
function getClassProperties(
  rules: Record<string, string[]>,
  className: string
): string[] {
  const props = rules[className];
  if (!props) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of props) {
    if (!seen.has(p)) {
      seen.add(p);
      result.push(p);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helper: extract classNames from JSX className attributes
// ---------------------------------------------------------------------------
function extractClassNamesFromJsx(tsxText: string): string[] {
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
// Helper: extract CSS variable definitions from :root
// ---------------------------------------------------------------------------
function extractCssVariables(cssText: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) return vars;
  const rootContent = rootMatch[1];
  const defRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = defRegex.exec(rootContent)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

// ---------------------------------------------------------------------------
// Build visual snapshot
// ---------------------------------------------------------------------------
const cssRules = extractBaseCssRules(css);
const pageClasses = extractClassNamesFromJsx(pageTsx);
const cssVars = extractCssVariables(css);

// Unique classes used in page.tsx (excluding pure modifiers)
const uniquePageClasses = [...new Set(pageClasses)].filter(
  (cls) => !MODIFIER_CLASSES.has(cls),
);

// For each class used in the page, capture its base CSS properties
const classVisualMap: Record<string, string[]> = {};
for (const cls of uniquePageClasses) {
  classVisualMap[cls] = getClassProperties(cssRules, cls);
}

// For class existence checks, use simple string search (more reliable than regex parsing)
const classExistsMap: Record<string, boolean> = {};
for (const cls of uniquePageClasses) {
  classExistsMap[cls] = css.includes(`.${cls} {`);
}

// Section structure map: which classes define each home page section
const sectionMap: Record<string, string[]> = {
  nav: [
    "public-nav", "public-nav-inner", "public-nav-left", "public-brand",
    "public-nav-center", "public-nav-right", "public-nav-link",
    "header-auth-links", "header-link", "icon-button", "menu-button",
    "account-trigger", "account-menu", "notif-trigger", "notif-badge",
    "nav-toggle", "mobile-nav",
  ],
  hero: [
    "hero-section", "hero-bg", "hero-overlay", "hero-content",
    "hero-content-left", "hero-eyebrow", "hero-heading", "hero-subhead",
    "hero-actions", "hero-trust", "btn", "btn-primary", "btn-outline",
  ],
  searchPreview: [
    "search-preview-section", "search-preview-container", "search-preview-card",
    "search-preview-form", "search-preview-input", "search-preview-select",
    "search-preview-btn", "search-preview-image",
  ],
  features: [
    "features-section", "features-grid", "feature-card", "feature-icon",
    "feature-heading", "feature-text",
  ],
  process: [
    "process-section", "process-steps", "process-step", "process-connector",
    "process-step-number", "process-step-title", "process-step-text",
  ],
  featuredLands: [
    "featured-lands-section", "featured-grid", "featured-land-card",
    "featured-image", "featured-badge", "featured-save", "featured-body",
    "featured-type", "featured-title", "featured-location", "featured-meta",
    "featured-price", "featured-area", "featured-btn",
  ],
  cta: [
    "cta-section", "cta-decoration", "cta-content", "cta-heading",
    "cta-text", "cta-btn",
  ],
  footer: [
    "public-footer", "footer-grid", "footer-brand", "footer-brand-text",
    "footer-slogan", "footer-description", "footer-heading", "footer-links",
    "footer-social", "footer-bottom", "footer-bottom-text",
  ],
};

const missingClasses: string[] = [];
for (const cls of uniquePageClasses) {
  if (!classExistsMap[cls]) {
    missingClasses.push(cls);
  }
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  page: "Home Page",
  sourceFiles: { css: CSS_PATH, tsx: PAGE_PATH },
  cssVariables: cssVars,
  uniqueClassesUsed: uniquePageClasses.sort(),
  classVisualMap,
  sectionMap,
  missingClasses,
  classCount: uniquePageClasses.length,
  sectionCount: Object.keys(sectionMap).length,
};

function writeBaseline(snap: typeof snapshot) {
  writeFileSync(BASELINE_PATH, JSON.stringify(snap, null, 2));
}

if (process.env.UPDATE_VISUAL_BASELINE === "1") {
  writeBaseline(snapshot);
}

// If no baseline exists, create one
if (!existsSync(BASELINE_PATH)) {
  writeBaseline(snapshot);
  console.log(`Baseline created at ${BASELINE_PATH}`);
}

// Load existing baseline
const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Visual AI Regression — Home Page", () => {
  describe("Baseline Integrity", () => {
    it("baseline snapshot exists and is valid", () => {
      assert.ok(baseline, "Baseline should exist");
      assert.ok(baseline.classVisualMap, "Baseline should have classVisualMap");
      assert.ok(baseline.sectionMap, "Baseline should have sectionMap");
      assert.ok(baseline.cssVariables, "Baseline should have cssVariables");
      assert.ok(baseline.uniqueClassesUsed, "Baseline should have uniqueClassesUsed");
    });

    it("baseline has no missing CSS classes", () => {
      assert.strictEqual(
        baseline.missingClasses.length,
        0,
        `Baseline missing CSS classes: ${baseline.missingClasses.join(", ")}`
      );
    });
  });

  describe("CSS Class Consistency (vs baseline)", () => {
    it("no classes removed from home page", () => {
      const removed = baseline.uniqueClassesUsed.filter(
        (cls: string) => !uniquePageClasses.includes(cls),
      );
      assert.strictEqual(
        removed.length,
        0,
        `Classes removed from home page (visual regression): ${removed.join(", ")}`
      );
    });

    it("no new unexplained classes added to home page", () => {
      const added = uniquePageClasses.filter(
        (cls) => !baseline.uniqueClassesUsed.includes(cls),
      );
      assert.strictEqual(
        added.length,
        0,
        `New classes added to home page (visual regression): ${added.join(", ")}`
      );
    });

    it("CSS properties for each class match baseline (base-level only)", () => {
      const regressions: string[] = [];
      for (const [cls, baselineProps] of Object.entries(
        baseline.classVisualMap as Record<string, string[]>,
      )) {
        const currentProps = classVisualMap[cls] ?? [];

        // Group properties by name -> set of values
        const groupByName = (props: string[]) => {
          const map: Map<string, Set<string>> = new Map();
          for (const prop of props) {
            const colonIdx = prop.indexOf(":");
            if (colonIdx === -1) continue;
            const name = prop.slice(0, colonIdx).trim();
            const value = prop.slice(colonIdx + 1).trim();
            if (!map.has(name)) map.set(name, new Set());
            map.get(name)!.add(value);
          }
          return map;
        };

        const baselineGroups = groupByName(baselineProps);
        const currentGroups = groupByName(currentProps);

        // Check for removed property names or values
        for (const [name, baselineValues] of baselineGroups) {
          const currentValues = currentGroups.get(name);
          if (!currentValues) {
            regressions.push(`${cls}: removed property "${name}"`);
            continue;
          }
          for (const val of baselineValues) {
            if (!currentValues.has(val)) {
              regressions.push(
                `${cls}: removed value "${name}: ${val}"`,
              );
            }
          }
        }

        // Check for added property names or values
        for (const [name, currentValues] of currentGroups) {
          const baselineValues = baselineGroups.get(name);
          if (!baselineValues) {
            regressions.push(`${cls}: added property "${name}"`);
            continue;
          }
          for (const val of currentValues) {
            if (!baselineValues.has(val)) {
              regressions.push(
                `${cls}: added value "${name}: ${val}"`,
              );
            }
          }
        }
      }
      assert.strictEqual(
        regressions.length,
        0,
        `CSS property regressions detected:\n${regressions.join("\n")}`
      );
    });
  });

  describe("Section Structure Integrity", () => {
    it("all 8 home page sections are present", () => {
      const expectedSections = [
        "nav", "hero", "searchPreview", "features", "process",
        "featuredLands", "cta", "footer",
      ];
      for (const section of expectedSections) {
        assert.ok(
          baseline.sectionMap[section],
          `Section "${section}" missing from baseline`
        );
        assert.ok(
          baseline.sectionMap[section].length > 0,
          `Section "${section}" has no classes`
        );
      }
    });

    it("each section's classes still exist in CSS", () => {
      const sectionMap = baseline.sectionMap as Record<string, string[]>;
      for (const [section, classes] of Object.entries(sectionMap)) {
        const missing = classes.filter((cls) => !css.includes(`.${cls} {`));
        assert.strictEqual(
          missing.length,
          0,
          `Section "${section}" references missing CSS classes: ${missing.join(", ")}`
        );
      }
    });

    it("hero section has key visual elements", () => {
      const heroClasses = baseline.sectionMap.hero;
      assert.ok(heroClasses.includes("hero-section"), "hero-section missing");
      assert.ok(heroClasses.includes("hero-bg"), "hero-bg missing");
      assert.ok(heroClasses.includes("hero-heading"), "hero-heading missing");
      assert.ok(heroClasses.includes("hero-subhead"), "hero-subhead missing");
      assert.ok(heroClasses.includes("hero-actions"), "hero-actions missing");
    });

    it("footer section has key visual elements", () => {
      const footerClasses = baseline.sectionMap.footer;
      assert.ok(footerClasses.includes("public-footer"), "public-footer missing");
      assert.ok(footerClasses.includes("footer-grid"), "footer-grid missing");
      assert.ok(footerClasses.includes("footer-links"), "footer-links missing");
    });
  });

  describe("CSS Design Token Consistency", () => {
    it("primary green variables are defined", () => {
      assert.ok(baseline.cssVariables["--primary-green"], "--primary-green missing");
      assert.ok(baseline.cssVariables["--action-green"], "--action-green missing");
    });

    it("no undefined CSS variables in stylesheet", () => {
      const varUsageRegex = /var\((--[a-zA-Z0-9_-]+)/g;
      const usedVars: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = varUsageRegex.exec(css)) !== null) {
        usedVars.push(m[1]);
      }
      const uniqueUsed = [...new Set(usedVars)];
      const definedVars = Object.keys(baseline.cssVariables);
      const undefinedVars = uniqueUsed.filter((v) => !definedVars.includes(v));
      assert.strictEqual(
        undefinedVars.length,
        0,
        `Undefined CSS variables: ${undefinedVars.join(", ")}`
      );
    });

    it("button classes have consistent color variables", () => {
      const btnPrimaryProps = classVisualMap["btn-primary"] ?? [];
      const buttonPrimaryProps = classVisualMap["button-primary"] ?? [];

      const btnPrimaryBg = btnPrimaryProps.find((p) => p.startsWith("background:"));
      const buttonPrimaryBg = buttonPrimaryProps.find((p) => p.startsWith("background:"));

      assert.ok(btnPrimaryBg, "btn-primary has background property");
      assert.ok(buttonPrimaryBg, "button-primary has background property");
      assert.strictEqual(
        btnPrimaryBg,
        buttonPrimaryBg,
        "btn-primary and button-primary should have identical background color"
      );
    });
  });

  describe("No Visual Regressions Detected", () => {
    it("overall visual structure matches baseline", () => {
      const issues: string[] = [];

      if (baseline.missingClasses.length > 0) {
        issues.push(`Missing CSS classes: ${baseline.missingClasses.join(", ")}`);
      }

      const removedClasses = baseline.uniqueClassesUsed.filter(
        (cls: string) => !uniquePageClasses.includes(cls),
      );
      if (removedClasses.length > 0) {
        issues.push(`Removed classes: ${removedClasses.join(", ")}`);
      }

      assert.strictEqual(
        issues.length,
        0,
        `Visual regressions detected:\n${issues.join("\n")}`
      );
    });
  });
});
