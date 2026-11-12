"use client";

import { useEffect, useState } from "react";
import { MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { readInquiries, Inquiry } from "@/lib/inquiries";
import { readProperties } from "@/lib/property-store";
import type { Property } from "@/lib/marketplace";

export default function InquiriesPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      const [inqs, props] = await Promise.all([
        readInquiries(),
        readProperties(),
      ]);
      setInquiries(inqs);
      setProperties(props);
      setLoaded(true);
    };
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Inquiries</div>
            <h1 className="display">Inquiries</h1>
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
            <div className="eyebrow">Inquiries</div>
            <h1 className="display">Inquiries</h1>
            <div className="empty-state">
              <MessageCircle size={48} />
              <h3>Please sign in to view your inquiries.</h3>
              <p>Sign in to see messages from property sellers.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="Inquiries"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">My Inquiries</div>
              <h1>Inquiries</h1>
              <p>
                View and manage your messages to property sellers.
              </p>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <h3>No inquiries yet.</h3>
              <p>
                Send an inquiry from a property listing to start a conversation
                with a seller.
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
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => {
                    const property = propertyMap.get(inquiry.propertyId);
                    return (
                      <tr key={inquiry.id}>
                        <td>
                          <strong>{inquiry.propertyTitle}</strong>
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
                        <td>{inquiry.message}</td>
                        <td>{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-green">
                            {inquiry.status}
                          </span>
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
