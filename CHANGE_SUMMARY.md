# YuTara Marketplace Change Summary

## UI updates

- Updated the home-page authentication buttons:
  - Login uses the green button treatment.
  - Register uses a white button with black text.
- Updated the home-page featured-land price text to black without changing the user marketplace price styling.
- Removed the redundant marketplace title and description block from the signed-in marketplace view.
- Moved the marketplace `Search Land` control to the top-right content area.
- Added a collapsible search panel containing:
  - Land name search.
  - Barangay filter.
  - Property type filter.
  - Minimum and maximum price filters.
  - Search and Clear actions.
- Positioned the promoted lands carousel higher so it is visible immediately in the marketplace view.
- Removed the barely visible sidebar logo while preserving the navigation.
- Added mobile header styling that hides desktop-only notification and account controls so the mobile menu remains visible and usable.

## Fixes

- Restored missing `MarketplaceView` props, state, and icon/link imports so logged-in users can open the marketplace without the `onSell is not defined` runtime error.
- Standardized logout behavior for users, administrators, and agencies:
  - Stored sessions are cleared.
  - The browser navigates directly to the home page.
  - Logout from the root marketplace view no longer leaves the in-memory marketplace screen visible at `/`.

## Verification completed

- TypeScript checks passed with `npx tsc --noEmit --pretty false`.
- ESLint checks passed for the changed application and component files.
- Mobile browser verification passed at a 390px viewport:
  - Mobile menu toggle remains within the viewport.
  - Mobile logout returns to `/`.
  - The home page is displayed after logout.
- Diff whitespace checks passed.
