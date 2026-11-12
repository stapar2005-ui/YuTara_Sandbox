/**
 * YuTara Marketplace — Comprehensive End-to-End (E2E) System Test Suite
 *
 * Covers:
 * 1. Authentication & Session Lifecycle (Buyer, Seller, Admin, Agency roles)
 * 2. Property Inventory, Filtering & Promotions
 * 3. Booking Request Lifecycle & Error Handling (Self-booking, duplicate prevention)
 * 4. Reservation Flow & Payment Simulation (Fee validation, concurrency lock)
 * 5. Full Transaction & Escrow Pipeline (7-stage state machine, financial calculations)
 * 6. Document Vault, Versioning & Agency Verification Checks
 * 7. Inquiries, Notifications & Bookmarks
 * 8. Verification of Known System Bugs & Failure Modes
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Setup mock browser environment (window, localStorage, events)
class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockStorage = new MockLocalStorage();
const eventListeners: Record<string, ((e: Event) => void)[]> = {};

(globalThis as unknown as { window?: unknown }).window = {
  localStorage: mockStorage,
  dispatchEvent: (event: Event) => {
    const list = eventListeners[event.type] || [];
    list.forEach((cb) => cb(event));
    return true;
  },
  addEventListener: (type: string, listener: (e: Event) => void) => {
    if (!eventListeners[type]) eventListeners[type] = [];
    eventListeners[type].push(listener);
  },
  removeEventListener: (type: string, listener: (e: Event) => void) => {
    if (!eventListeners[type]) return;
    eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
  },
};

(globalThis as unknown as { Event?: unknown }).Event = class {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
};


// Import modules to test
import {
  authenticate,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  createPendingUser,
  approvePendingUser,
  denyPendingUser,
  isEmailRegisteredOrPending,
} from "../src/lib/demo-auth.ts";

import {
  MARKETPLACE_PROPERTIES,
  activeProperties,
  getProperty,
  isActiveListing,
  isBookableListing,
  isPromotionActive,
  formatMoney,
} from "../src/lib/marketplace.ts";

import {
  createBookingRequest,
  respondToBookingRequest,
  cancelBookingRequest,
} from "../src/lib/booking-service.ts";

import {
  createReservation,
  confirmSimulatedPayment,
  cancelReservation,
  readReservations,
  RESERVATION_FEE,
} from "../src/lib/reservation-service.ts";

import {
  createTransactionFromReservation,
  agencyReview,
  holdPayment,
  prepareDocuments,
  recordSigning,
  releaseFunds,
  completeTransaction,
  cancelTransaction,
  stageIndex,
} from "../src/lib/transactions.ts";

import {
  createDocumentRequirement,
  createTransactionDocument,
  createDocumentReview,
} from "../src/lib/document-service.ts";

import {
  defaultVerificationRecord,
  isReadyForApproval,
  verificationProgress,
  recordOfficeResponse,
  setDocumentStatus,
} from "../src/lib/verification.ts";

import {
  PROMO_OPTIONS,
} from "../src/lib/promotions.ts";

import {
  saveProperty,
  unsaveProperty,
  isPropertySaved,
} from "../src/lib/saved-properties.ts";

import {
  addInquiry,
  replyToInquiry,
} from "../src/lib/inquiries.ts";

import { notificationsFor } from "../src/lib/notifications.ts";

import {
  createNotification,
  readNotifications,
  markAllNotificationsRead,
} from "../src/lib/notification-service.ts";

import { STORAGE_KEYS } from "../src/lib/reset.ts";

// =========================================================================
// TEST SUITE IMPLEMENTATION
// =========================================================================

describe("YuTara Marketplace E2E System Test Suite", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  // -----------------------------------------------------------------------
  // 1. Authentication, Sessions & Registration
  // -----------------------------------------------------------------------
  describe("1. Authentication, Roles & Session Management", () => {
    it("authenticates all built-in demo roles correctly", () => {
      const roles = [
        { email: "admin@yutara.com", expectedRole: "ADMIN" },
        { email: "buyer@yutara.com", expectedRole: "USER" },
        { email: "seller@yutara.com", expectedRole: "USER" },
        { email: "agency.admin@yutara.com", expectedRole: "AGENCY_ADMIN" },
        { email: "agency.officer@yutara.com", expectedRole: "AGENCY_OFFICER" },
        { email: "agency.processor@yutara.com", expectedRole: "AGENCY_PROCESSOR" },
      ];

      for (const account of roles) {
        const user = authenticate(account.email, "12345");
        assert.ok(user, `User ${account.email} should authenticate`);
        assert.strictEqual(user.role, account.expectedRole);
      }
    });

    it("verifies case insensitivity and trims whitespace on login email", () => {
      const user = authenticate("  BUYER@YUTARA.COM  ", "12345");
      assert.ok(user);
      assert.strictEqual(user.email, "buyer@yutara.com");
    });

    it("rejects invalid passwords and nonexistent accounts", () => {
      assert.strictEqual(authenticate("buyer@yutara.com", "wrongpass"), null);
      assert.strictEqual(authenticate("unknown@yutara.com", "12345"), null);
      assert.strictEqual(authenticate("", ""), null);
    });

    it("manages user registration and approval lifecycle", () => {
      // 1. Check email registered or pending
      assert.strictEqual(isEmailRegisteredOrPending("buyer@yutara.com"), true);
      assert.strictEqual(isEmailRegisteredOrPending("newperson@test.ph"), false);

      // 2. Submit new user registration
      const pending = createPendingUser({
        email: "newperson@test.ph",
        name: "Pedro Penduko",
        password: "securepass123",
        id1: "passport.jpg",
        mobile: "09171234567",
      });

      assert.ok(pending.id.startsWith("PEND-"));
      assert.strictEqual(pending.status, "PENDING");
      assert.strictEqual(pending.mobile, "09171234567");
      assert.strictEqual(isEmailRegisteredOrPending("newperson@test.ph"), true);

      // Cannot authenticate while PENDING
      assert.strictEqual(authenticate("newperson@test.ph", "securepass123"), null);

      // 3. Admin approves user
      const approved = approvePendingUser(pending.id, "admin@yutara.com");
      assert.ok(approved);
      assert.strictEqual(approved.status, "APPROVED");
      assert.strictEqual(isEmailRegisteredOrPending("newperson@test.ph"), true);

      // Now user can authenticate
      const authenticated = authenticate("newperson@test.ph", "securepass123");
      assert.ok(authenticated);
      assert.strictEqual(authenticated.role, "USER");
      assert.strictEqual(authenticated.name, "Pedro Penduko");
    });

    it("handles user denial properly", () => {
      const pending = createPendingUser({
        email: "fraud@test.ph",
        name: "Fraud Account",
        password: "bad",
        id1: "fake.jpg",
      });
      const denied = denyPendingUser(pending.id, "admin@yutara.com");
      assert.ok(denied);
      assert.strictEqual(denied.status, "DENIED");
      assert.strictEqual(authenticate("fraud@test.ph", "bad"), null);
    });

    it("stores and clears user session in localStorage", () => {
      const sessionUser = { email: "buyer@yutara.com", role: "USER" as const, name: "Juan Buyer" };
      setStoredSession(sessionUser);

      const retrieved = getStoredSession();
      assert.ok(retrieved);
      assert.strictEqual(retrieved.email, "buyer@yutara.com");
      assert.strictEqual(retrieved.role, "USER");

      clearStoredSession();
      assert.strictEqual(getStoredSession(), null);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Property Inventory & Promotions
  // -----------------------------------------------------------------------
  describe("2. Property Inventory & Promotions Lifecycle", () => {
    it("loads initial properties with valid Panabo City data", () => {
      assert.ok(MARKETPLACE_PROPERTIES.length >= 30, "Should have at least 30 properties");
      const sample = MARKETPLACE_PROPERTIES[0];
      assert.strictEqual(sample.city, "Panabo City");
      assert.strictEqual(sample.province, "Davao del Norte");
      assert.ok(sample.price > 0);
      assert.ok(sample.area > 0);
    });

    it("filters active bookable properties correctly", () => {
      const active = activeProperties;
      assert.ok(active.length > 0);
      for (const prop of active) {
        assert.strictEqual(isActiveListing(prop), true);
        assert.strictEqual(isBookableListing(prop), true);
        assert.strictEqual(prop.listingStatus, "OPEN_FOR_OFFERS");
      }
    });

    it("formats Philippine Peso amounts accurately", () => {
      assert.strictEqual(formatMoney(2500000), "₱2,500,000");
      assert.strictEqual(formatMoney(25000), "₱25,000");
    });

    it("handles promotion lifecycle and expiration detection", async () => {
      const promoProperty = { ...MARKETPLACE_PROPERTIES[0] };
      assert.strictEqual(PROMO_OPTIONS.length, 4);

      // Initially promoted status check
      const isInitialActive = isPromotionActive(promoProperty);
      assert.strictEqual(typeof isInitialActive, "boolean");

      // Expired promotion test
      promoProperty.promoted = true;
      promoProperty.promotionUntil = new Date(Date.now() - 100000).toISOString();
      assert.strictEqual(isPromotionActive(promoProperty), false, "Expired promotion should be inactive");

      // Active future promotion test
      promoProperty.promotionUntil = new Date(Date.now() + 7 * 86400000).toISOString();
      assert.strictEqual(isPromotionActive(promoProperty), true, "Future promotion should be active");
    });
  });

  // -----------------------------------------------------------------------
  // 3. Booking Requests & Validation Errors
  // -----------------------------------------------------------------------
  describe("3. Booking Requests & Error Validations", () => {
    it("creates a valid booking request", async () => {
      const booking = await createBookingRequest({
        propertyId: 1,
        propertyTitle: "Quiet family lot near the city center",
        buyerId: "buyer@yutara.com",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        sellerId: "seller@yutara.com",
        sellerName: "Maria Seller",
        message: "I am interested in scheduling a site inspection.",
        proposedPrice: 2400000,
      });

      assert.ok(booking.id.startsWith("YT-BOK-"));
      assert.strictEqual(booking.status, "PENDING");
      assert.strictEqual(booking.proposedPrice, 2400000);
    });

    it("ERROR VERIFICATION: Rejects self-booking (Buyer === Seller)", async () => {
      await assert.rejects(
        async () => {
          await createBookingRequest({
            propertyId: 1,
            propertyTitle: "Quiet family lot",
            buyerId: "seller@yutara.com",
            buyerName: "Maria Seller",
            buyerEmail: "seller@yutara.com",
            sellerId: "seller@yutara.com",
            sellerName: "Maria Seller",
            message: "Self booking attempt",
          });
        },
        /You cannot book your own property/
      );
    });

    it("ERROR VERIFICATION: Prevents duplicate pending booking requests", async () => {
      const first = await createBookingRequest({
        propertyId: 2,
        propertyTitle: "Productive coconut land",
        buyerId: "buyer@yutara.com",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        sellerId: "seller@yutara.com",
        sellerName: "Lio Navarro",
        message: "First inquiry",
      });

      const second = await createBookingRequest({
        propertyId: 2,
        propertyTitle: "Productive coconut land",
        buyerId: "buyer@yutara.com",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        sellerId: "seller@yutara.com",
        sellerName: "Lio Navarro",
        message: "Duplicate attempt",
      });

      assert.strictEqual(first.id, second.id, "Should return existing pending booking rather than creating duplicate");
    });

    it("handles seller approval and rejection of booking requests", async () => {
      const booking = await createBookingRequest({
        propertyId: 3,
        propertyTitle: "Corner parcel",
        buyerId: "buyer@yutara.com",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        sellerId: "seller@yutara.com",
        sellerName: "Celia Ramos",
        message: "Can I inspect the parcel?",
      });

      // Approve
      const approved = await respondToBookingRequest(booking.id, "APPROVED", "seller@yutara.com", "Site visit scheduled for Saturday.");
      assert.ok(approved);
      assert.strictEqual(approved.status, "APPROVED");
      assert.strictEqual(approved.responseNote, "Site visit scheduled for Saturday.");

      // Attempting to re-respond to non-pending booking is ignored/retained
      const reRespond = await respondToBookingRequest(booking.id, "REJECTED", "seller@yutara.com");
      assert.strictEqual(reRespond?.status, "APPROVED");
    });

    it("allows buyer to cancel pending booking and denies unauthorized cancellation", async () => {
      const booking = await createBookingRequest({
        propertyId: 4,
        propertyTitle: "Family lot in a quiet neighborhood",
        buyerId: "buyer@yutara.com",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        sellerId: "seller@yutara.com",
        sellerName: "Noah Villanueva",
        message: "Inquiring about this lot",
      });

      // Unauthorized buyer tries to cancel
      const unauthorized = await cancelBookingRequest(booking.id, "other_buyer@yutara.com");
      assert.strictEqual(unauthorized, null, "Other users cannot cancel someone else's booking");

      // Legitimate buyer cancels
      const cancelled = await cancelBookingRequest(booking.id, "buyer@yutara.com");
      assert.ok(cancelled);
      assert.strictEqual(cancelled.status, "CANCELLED");
    });
  });

  // -----------------------------------------------------------------------
  // 4. Reservations & Escrow Payment Simulation
  // -----------------------------------------------------------------------
  describe("4. Reservation & Payment Simulation Lifecycle", () => {
    it("creates reservation with standard ₱25,000 fee and 48-hour expiration", async () => {
      const property = getProperty(1)!;
      assert.ok(property);

      const result = await createReservation(property, "buyer@yutara.com");
      assert.ok(result.reservation);
      assert.strictEqual(result.error, undefined);
      assert.strictEqual(result.reservation.status, "PENDING_PAYMENT");
      assert.strictEqual(result.reservation.reservationFee, 25000);
      assert.strictEqual(result.reservation.reservationFee, RESERVATION_FEE);

      // Verify expiration window is ~48 hours
      const created = new Date(result.reservation.createdAt).getTime();
      const expires = new Date(result.reservation.expiresAt).getTime();
      const diffHours = (expires - created) / (1000 * 60 * 60);
      assert.ok(Math.abs(diffHours - 48) < 0.1, "Expiration must be set to 48 hours");
    });

    it("ERROR VERIFICATION: Fails reservation without authenticated buyer", async () => {
      const property = getProperty(1)!;
      const result = await createReservation(property, "");
      assert.ok(result.error);
      assert.match(result.error, /must be signed in/);
    });

    it("ERROR VERIFICATION: Rejects reservation on unavailable/closed property", async () => {
      const closedProp = { ...getProperty(1)!, listingStatus: "CLOSED" as const };
      const result = await createReservation(closedProp, "buyer@yutara.com");
      assert.ok(result.error);
      assert.match(result.error, /no longer available/);
    });

    it("ERROR VERIFICATION: Double-booking prevention lock", async () => {
      const property = getProperty(1)!;

      // Buyer 1 reserves
      const res1 = await createReservation(property, "buyer1@yutara.com");
      assert.ok(res1.reservation);

      // Buyer 2 attempts to reserve same property while pending
      const res2 = await createReservation(property, "buyer2@yutara.com");
      assert.ok(res2.error);
      assert.match(res2.error, /currently reserved/);

      // Buyer 1 requesting their own reservation returns the existing one idempotently
      const res1Own = await createReservation(property, "buyer1@yutara.com");
      assert.strictEqual(res1Own.reservation?.id, res1.reservation.id);
    });

    it("confirms simulated escrow payment and transitions to RESERVED", async () => {
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer@yutara.com");
      assert.ok(reservation);

      const paid = await confirmSimulatedPayment(reservation.id, "GCash");
      assert.ok(paid);
      assert.strictEqual(paid.status, "RESERVED");
      assert.strictEqual(paid.paymentMethod, "GCash");
      assert.ok(paid.paymentId?.startsWith("SIM-"));
    });

    it("cancels reservation successfully", async () => {
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer@yutara.com");
      assert.ok(reservation);

      const cancelled = await cancelReservation(reservation.id);
      assert.ok(cancelled);
      assert.strictEqual(cancelled.status, "CANCELLED");
    });
  });

  // -----------------------------------------------------------------------
  // 5. Full Transaction & Escrow Pipeline (7-Stage Machine)
  // -----------------------------------------------------------------------
  describe("5. End-to-End Transaction & Escrow Pipeline", () => {
    it("runs complete 16-stage transaction pipeline from booking to completion", async () => {
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer@yutara.com");
      assert.ok(reservation);

      // Create transaction from reservation
      const tx = await createTransactionFromReservation({
        reservation,
        property,
        buyerName: "Juan Buyer",
        sellerName: "Maya Santos",
      });

      assert.ok(tx.id.startsWith("YTR-TX-"));
      assert.strictEqual(tx.stage, "AGREEMENT_CONFIRMED");
      assert.strictEqual(tx.salePrice, property.price);
      assert.strictEqual(tx.reservationFee, 25000);
      assert.strictEqual(tx.balance, property.price - 25000);
      assert.strictEqual(tx.agencyFee, Math.round(property.price * 0.025), "Agency fee must be 2.5%");
      assert.strictEqual(tx.escrowHeld, 25000);

      // Stage 1: Agency Intake
      const reviewResult = await agencyReview(tx.id, "AGENCY", "APPROVED", "Approved by Panabo Land Desk");
      assert.ok(reviewResult);
      assert.strictEqual(reviewResult.stage, "AGENCY_INTAKE");

      // Stage 2: Payment Held in Escrow
      const heldResult = await holdPayment(tx.id, "AGENCY", "Bank Transfer");
      assert.ok(heldResult);
      assert.strictEqual(heldResult.stage, "PAYMENT_HELD");

      // Stage 3: Prepare Documents
      const docs = ["Deed of Absolute Sale", "BIR eCAR Form", "Transfer Tax Receipt"];
      const docsResult = await prepareDocuments(tx.id, "AGENCY", docs, "All transfer documents generated");
      assert.ok(docsResult);
      assert.strictEqual(docsResult.stage, "DOCUMENT_COLLECTION");
      assert.strictEqual(docsResult.documentsPrepared.length, 3);

      // Stage 4: Parties Signing
      // Buyer signs first
      const buyerSign = await recordSigning(tx.id, "BUYER", "BUYER");
      assert.ok(buyerSign);
      assert.strictEqual(buyerSign.stage, "DOCUMENT_COLLECTION", "Should remain in DOCUMENT_COLLECTION until both sign");
      assert.deepStrictEqual(buyerSign.signedBy, ["BUYER"]);

      // Seller signs second
      const sellerSign = await recordSigning(tx.id, "SELLER", "SELLER");
      assert.ok(sellerSign);
      assert.strictEqual(sellerSign.stage, "PARTIES_SIGNED", "Transitions to PARTIES_SIGNED when both parties sign");
      assert.strictEqual(sellerSign.signedBy.length, 2);

      // Stage 5: Release Funds
      const fundsResult = await releaseFunds(tx.id, "AGENCY");
      assert.ok(fundsResult);
      assert.strictEqual(fundsResult.stage, "FUNDS_RELEASED");
      assert.ok(fundsResult.fundsReleasedAt);

      // Stage 6: Complete Transaction
      const completedResult = await completeTransaction(tx.id, "AGENCY");
      assert.ok(completedResult);
      assert.strictEqual(completedResult.stage, "COMPLETED");

      // Verify stage indices
      assert.strictEqual(stageIndex("AGREEMENT_CONFIRMED"), 0);
      assert.strictEqual(stageIndex("COMPLETED"), 12);
      assert.strictEqual(stageIndex("BOOKING_REQUESTED"), 0);
      assert.strictEqual(stageIndex("AGENCY_REVIEW"), 1);
      assert.strictEqual(stageIndex("PAYMENT_HELD"), 2);
      assert.strictEqual(stageIndex("DOCUMENTS_PREPARED"), 5);
    });

    it("ERROR VERIFICATION: Enforces strict stage sequence gates", async () => {
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer@yutara.com");
      const tx = await createTransactionFromReservation({
        reservation: reservation!,
        property,
        buyerName: "Juan Buyer",
      });

      // Cannot hold payment while in AGREEMENT_CONFIRMED (must be AGENCY_INTAKE)
      const prematureHold = await holdPayment(tx.id, "AGENCY", "Cash");
      assert.strictEqual(prematureHold?.stage, "AGREEMENT_CONFIRMED", "Cannot skip to PAYMENT_HELD");

      // Cannot prepare documents while in AGREEMENT_CONFIRMED
      const prematureDocs = await prepareDocuments(tx.id, "AGENCY", ["Deed"]);
      assert.strictEqual(prematureDocs?.stage, "AGREEMENT_CONFIRMED", "Cannot skip to DOCUMENT_COLLECTION");

      // Cannot release funds before PARTIES_SIGNED
      const prematureRelease = await releaseFunds(tx.id, "AGENCY");
      assert.strictEqual(prematureRelease?.stage, "AGREEMENT_CONFIRMED", "Cannot release funds before signing");

      // Cannot complete transaction before FUNDS_RELEASED
      const prematureComplete = await completeTransaction(tx.id, "AGENCY");
      assert.strictEqual(prematureComplete?.stage, "AGREEMENT_CONFIRMED", "Cannot complete prematurely");
    });

    it("ERROR VERIFICATION: Prevents cancellation of already COMPLETED transactions", async () => {
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer@yutara.com");
      const tx = await createTransactionFromReservation({
        reservation: reservation!,
        property,
        buyerName: "Juan Buyer",
      });

      // Progress all the way to completed
      await agencyReview(tx.id, "AGENCY", "APPROVED");
      await holdPayment(tx.id, "AGENCY", "Cash");
      await prepareDocuments(tx.id, "AGENCY", ["Deed"]);
      await recordSigning(tx.id, "BUYER", "BUYER");
      await recordSigning(tx.id, "SELLER", "SELLER");
      await releaseFunds(tx.id, "AGENCY");
      await completeTransaction(tx.id, "AGENCY");

      // Attempt cancellation
      const cancelAttempt = await cancelTransaction(tx.id, "BUYER", "Buyer changed mind");
      assert.strictEqual(cancelAttempt?.stage, "COMPLETED", "Completed transaction cannot be cancelled");
    });
  });

  // -----------------------------------------------------------------------
  // 6. Document Vault & Government Office Clearance Checks
  // -----------------------------------------------------------------------
  describe("6. Document Vault & Agency Verification Checks", () => {
    it("manages document requirements, upload versioning, and agency reviews", async () => {
      // 1. Create requirement
      const req = await createDocumentRequirement({
        transactionId: "TX-101",
        requirementName: "Certified True Copy of Title",
        description: "Official title from Registry of Deeds",
        responsibleParty: "SELLER",
        required: true,
      });
      assert.ok(req.id.startsWith("YT-REQ-"));
      assert.strictEqual(req.status, "NOT_REQUESTED");

      // 2. Upload document version 1
      const docV1 = await createTransactionDocument({
        requirementId: req.id,
        transactionId: "TX-101",
        fileName: "title_v1.pdf",
        fileUrl: "https://example.com/title_v1.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        uploadedBy: "seller@yutara.com",
        uploadedByRole: "SELLER",
        isPrivate: false,
      });
      assert.strictEqual(docV1.version, 1);

      // 3. Upload document version 2 (re-submission)
      const docV2 = await createTransactionDocument({
        requirementId: req.id,
        transactionId: "TX-101",
        fileName: "title_v2_clarified.pdf",
        fileUrl: "https://example.com/title_v2.pdf",
        fileSize: 1050000,
        mimeType: "application/pdf",
        uploadedBy: "seller@yutara.com",
        uploadedByRole: "SELLER",
        isPrivate: false,
      });
      assert.strictEqual(docV2.version, 2, "Re-uploading for same requirement must auto-increment version");

      // 4. Agency review of document
      const review = await createDocumentReview({
        documentId: docV2.id,
        transactionId: "TX-101",
        reviewerId: "agency.officer@yutara.com",
        reviewerRole: "AGENCY_OFFICER",
        status: "ACCEPTED",
        remarks: "Title seal and annotations verified with RD Panabo",
        previousStatus: "UNDER_REVIEW",
      });
      assert.ok(review.id.startsWith("YT-REV-"));
      assert.strictEqual(review.status, "ACCEPTED");
    });

    it("evaluates property verification readiness and government office checks", () => {
      let record = defaultVerificationRecord(1);
      assert.strictEqual(record.propertyId, 1);
      assert.strictEqual(record.documents.length, 5);
      assert.strictEqual(record.checks.length, 6);

      // Initially not ready for approval (all pending)
      assert.strictEqual(isReadyForApproval(record), false);
      assert.strictEqual(verificationProgress(record), 0);

      // Verify non-required doc first -> still not ready
      record = setDocumentStatus(record, "authority", "VERIFIED");
      assert.strictEqual(isReadyForApproval(record), false);

      // Verify all required documents (title, tax, id)
      record = setDocumentStatus(record, "title", "VERIFIED");
      record = setDocumentStatus(record, "tax", "VERIFIED");
      record = setDocumentStatus(record, "id", "VERIFIED");

      // Now all required docs are verified
      assert.strictEqual(isReadyForApproval(record), true);

      // Record government office response (e.g. Registry of Deeds)
      record = recordOfficeResponse(record, "rd", "CLEARED", "Original title intact, zero liens or lis pendens");
      const rdCheck = record.checks.find((c) => c.id === "rd");
      assert.strictEqual(rdCheck?.status, "CLEARED");
      assert.ok(rdCheck?.checkedAt);

      // Progress percentage should now be positive
      const progress = verificationProgress(record);
      assert.ok(progress > 0, "Progress should increase as checks clear");
    });
  });

  // -----------------------------------------------------------------------
  // 7. Inquiries, Notifications & Saved Properties
  // -----------------------------------------------------------------------
  describe("7. Inquiries, Notifications & Saved Properties", () => {
    it("handles saved properties / bookmarking idempotency", async () => {
      const saved1 = await saveProperty({ userId: "buyer@yutara.com", propertyId: 1, notes: "Nice lot" });
      assert.ok(saved1);
      assert.strictEqual(await isPropertySaved("buyer@yutara.com", 1), true);

      // Duplicate save returns existing
      const saved2 = await saveProperty({ userId: "buyer@yutara.com", propertyId: 1 });
      assert.strictEqual(saved1.id, saved2?.id);

      // Unsave
      const removed = await unsaveProperty("buyer@yutara.com", 1);
      assert.strictEqual(removed, true);
      assert.strictEqual(await isPropertySaved("buyer@yutara.com", 1), false);
    });

    it("manages inquiries and seller response", async () => {
      const inquiry = await addInquiry({
        propertyId: 1,
        propertyTitle: "Quiet family lot",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        message: "Is the price negotiable?",
      });
      assert.strictEqual(inquiry.status, "NEW");

      const replied = await replyToInquiry(inquiry.id, "Yes, we can discuss terms.");
      const updated = replied.find((i) => i.id === inquiry.id);
      assert.strictEqual(updated?.status, "REPLIED");
      assert.strictEqual(updated?.reply, "Yes, we can discuss terms.");
    });

    it("calculates notifications for seller properties", async () => {
      const sellerEmail = "seller@yutara.com";
      const props = MARKETPLACE_PROPERTIES.map((p) =>
        p.id === 1 ? { ...p, sellerEmail } : p
      );

      await addInquiry({
        propertyId: 1,
        propertyTitle: "Quiet family lot",
        buyerName: "Juan Buyer",
        buyerEmail: "buyer@yutara.com",
        message: "New notification test",
      });

      const counts = await notificationsFor(sellerEmail, props);
      assert.ok(counts.inquiries >= 1, "Should count new inquiry");
      assert.strictEqual(counts.total, counts.inquiries + counts.bookings);
    });
  });

  // -----------------------------------------------------------------------
  // 8. Error Possibilities, Architectural Flaws & Edge Cases
  // -----------------------------------------------------------------------
  describe("8. Verification of Known System Bugs & Failure Modes", () => {
    it("restores agency roles from storage on page refresh", () => {
      // When an agency user logs in:
      const agencyUser = {
        email: "agency.admin@yutara.com",
        role: "AGENCY_ADMIN" as const,
        name: "Agency Admin",
      };
      setStoredSession(agencyUser);

      // When the page reloads or app re-reads session:
      const restored = getStoredSession();
      assert.deepStrictEqual(restored, agencyUser);
    });

    it("marks only the current user's notifications as read", async () => {
      // User A receives a notification
      await createNotification({
        userId: "user_a@yutara.com",
        type: "BOOKING_APPROVED",
        title: "Booking approved",
        description: "Lot A",
      });

      // User B receives a notification
      await createNotification({
        userId: "user_b@yutara.com",
        type: "NEW_TRANSACTION",
        title: "New transaction",
        description: "Lot B",
      });

      // Both users currently have 1 notification
      assert.strictEqual((await readNotifications("user_a@yutara.com")).length, 1);
      assert.strictEqual((await readNotifications("user_b@yutara.com")).length, 1);

      // User A marks all their notifications as read:
      await markAllNotificationsRead("user_a@yutara.com");

      // Check User B's notifications:
      const userBNotifications = await readNotifications("user_b@yutara.com");
      assert.strictEqual(
        userBNotifications.length,
        1,
        "User B's notification should remain after User A marks all as read",
      );
      assert.strictEqual(userBNotifications[0].isRead, false);
    });

    it("resetAllData includes every modern storage key", () => {
      assert.strictEqual(
        STORAGE_KEYS.includes("yutara-saved-properties"),
        true,
      );

      const missingKeys = [
        "yutara-booking-requests",
        "yutara-document-requirements",
        "yutara-transaction-documents",
        "yutara-document-reviews",
        "yutara-processing-stages",
        "yutara-stage-history",
        "yutara-notifications",
        "yutara-agency-personnel",
      ];

      for (const key of missingKeys) {
        assert.strictEqual(
          STORAGE_KEYS.includes(key),
          true,
          `resetAllData should include '${key}'`,
        );
      }
    });

    it("expires pending reservations before allowing a new buyer to reserve", async () => {
      // Create an expired reservation manually in storage
      const property = getProperty(1)!;
      const { reservation } = await createReservation(property, "buyer_old@yutara.com");
      assert.ok(reservation);

      // Simulate expired timestamp 5 days ago
      reservation.expiresAt = new Date(Date.now() - 5 * 86400000).toISOString();
      const allRes = await readReservations();
      const idx = allRes.findIndex((r) => r.id === reservation.id);
      allRes[idx] = reservation;
      await mockStorage.setItem("yutara-reservations", JSON.stringify(allRes));

      const newRes = await createReservation(property, "buyer_new@yutara.com");
      assert.ok(newRes.reservation);
      assert.strictEqual(newRes.reservation.buyerId, "buyer_new@yutara.com");
    });
  });
});
