"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import {
  readBookingRequests,
  cancelBookingRequest,
  type BookingRequest,
} from "@/lib/booking-service";
import { readProperties } from "@/lib/property-store";
import type { MarketplaceProperty } from "@/lib/marketplace";

export default function BookingsPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [properties, setProperties] = useState<MarketplaceProperty[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      if (current) {
        const [allBookings, props] = await Promise.all([
          readBookingRequests(),
          readProperties(),
        ]);
        const userBookings = allBookings.filter(
          (b) => b.buyerId === current.email || b.sellerId === current.email,
        );
        setBookings(userBookings);
        setProperties(props);
      }
      setLoaded(true);
    };
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Bookings</div>
            <h1 className="display">Bookings</h1>
            <div className="empty-state">
              <span className="spinner" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Bookings</div>
            <h1 className="display">Bookings</h1>
            <div className="empty-state">
              <Calendar size={48} />
              <h3>Please sign in to view your bookings.</h3>
              <p>Sign in to see your booking requests and reservations.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const propertyMap = new Map(properties.map((p: MarketplaceProperty) => [p.id, p]));

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="Bookings"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">My Bookings</div>
              <h1>Bookings</h1>
              <p>
                Track the site visit requests you send and receive.
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No bookings yet.</h3>
              <p>
                Request a site visit from a property listing to get started.
              </p>
              <Link href="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const property = propertyMap.get(booking.propertyId);
                    return (
                      <tr key={booking.id}>
                        <td>
                          <strong>{property?.title || "Unknown Property"}</strong>
                        </td>
                        <td>
                          {property ? (
                            <>
                              <MapPin size={12} />{" "}
                              {property.barangay}, {property.city}
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {property ? (
                            <strong>₱{property.price.toLocaleString()}</strong>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              booking.status === "APPROVED"
                                ? "badge-green"
                                : booking.status === "REJECTED" ||
                                  booking.status === "CANCELLED"
                                  ? "badge-red"
                                  : "badge-amber"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          {booking.status === "PENDING" && (
                            <button
                              className="button button-ghost btn-sm"
                              onClick={() => {
                                cancelBookingRequest(booking.id, session.email);
                                setBookings(bookings.filter((b) => b.id !== booking.id));
                              }}
                            >
                              Cancel Visit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    </div>
  );
}
