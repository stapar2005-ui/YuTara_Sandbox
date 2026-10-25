import { updateProperty } from "./property-store";

export type PromoOption = { days: number; label: string; price: number };

/** Simulated promotion packages. Longer windows cost more. */
export const PROMO_OPTIONS: PromoOption[] = [
  { days: 7, label: "1 week", price: 700 },
  { days: 14, label: "2 weeks", price: 1200 },
  { days: 30, label: "1 month", price: 1800 },
  { days: 90, label: "3 months", price: 4500 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Promote a listing for a number of days starting now. */
export function promoteLand(id: number, days: number): boolean {
  const until = new Date(Date.now() + days * DAY_MS).toISOString();
  return updateProperty(id, {
    promoted: true,
    promotionUntil: until,
    promotionDays: days,
  });
}

export function endPromotion(id: number): boolean {
  return updateProperty(id, {
    promoted: false,
    promotionUntil: undefined,
    promotionDays: undefined,
  });
}

/** Format a promotion end date for display (pure — input only). */
export function promotionEndLabel(iso?: string): string {
  if (!iso) return "active";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "active";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
