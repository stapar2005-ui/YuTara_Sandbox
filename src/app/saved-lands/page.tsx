"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import { readProperties } from "@/lib/property-store";
import { Property } from "@/lib/marketplace";

export default function SavedLandsPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoUser | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      const data = await readProperties();
      setProperties(data);
      try {
        const raw = window.localStorage.getItem("yutara-saved");
        const parsed = raw ? JSON.parse(raw) : [];
        setSaved(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSaved([]);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const toggleSave = (id: number) => {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    try {
      window.localStorage.setItem("yutara-saved", JSON.stringify(next));
    } catch {}
  };

  const savedProperties = useMemo(
    () => properties.filter((p) => saved.includes(p.id)),
    [properties, saved],
  );

  if (!loaded) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="container">
            <div className="eyebrow">Saved Lands</div>
            <h1 className="display">Your Saved Lands</h1>
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
            <div className="eyebrow">Saved Lands</div>
            <h1 className="display">Your Saved Lands</h1>
            <div className="empty-state">
              <MapPin size={48} />
              <h3>Please sign in to view your saved lands.</h3>
              <p>
                Sign in to see the properties you have bookmarked.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="Your Saved Lands"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Your Saved Lands</div>
              <h1>Your Saved Lands</h1>
              <p>
                Keep track of properties you are interested in. You can view
                details or remove them at any time.
              </p>
            </div>
          </div>

          {savedProperties.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} />
              <h3>No saved lands yet.</h3>
              <p>
                Bookmark properties you are interested in from the marketplace,
                and they will appear here.
              </p>
              <Link href="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="property-grid">
              {savedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  saved={true}
                  onSave={() => toggleSave(property.id)}
                  onOpen={() => router.push(`/marketplace/${property.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </div>
  );
}
