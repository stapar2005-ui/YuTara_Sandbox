"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CircleUserRound,
  FileCheck2,
  Heart,
  Leaf,
  MapPin,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import {
  clearStoredSession,
  DemoUser,
  getStoredSession,
  SESSION_EVENT,
} from "@/lib/demo-auth";
import { readProperties } from "@/lib/property-store";
import { notificationsFor } from "@/lib/notifications";
import { readProfile, UserProfile, writeProfile } from "@/lib/profile";
import type { Inquiry } from "@/lib/inquiries";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  Theme,
} from "@/lib/theme";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import { AppLayout } from "@/components/AppLayout";
import { Modal } from "@/components/Modal";
import { MarketplaceView } from "@/components/MarketplaceView";
import { PropertyDetailView } from "@/components/PropertyDetailView";
import { SellLandView, SellerTab } from "@/components/SellLandView";
import { AdminView } from "@/components/AdminView";
import {
  getInitialProperties,
  isActiveListing,
  Property,
} from "@/lib/marketplace";

type View = "home" | "marketplace" | "property" | "seller" | "admin";

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [properties, setProperties] = useState<Property[]>(getInitialProperties);
  const [notifications, setNotifications] = useState({
    inquiries: 0,
    bookings: 0,
    total: 0,
  });
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileDraft, setProfileDraft] = useState<UserProfile>({});
  const [session, setSession] = useState<DemoUser | null>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState(
    "Hello, I am interested in this property and would like to know more about its availability.",
  );
  const [toast, setToast] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sellerTab, setSellerTab] = useState<SellerTab>("listings");
  const [sellForm, setSellForm] = useState({
    title: "",
    type: "Residential",
    barangay: "Gredu",
    price: "",
    area: "",
    description: "",
    image: "",
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [sort, setSort] = useState("Recommended");
  const [barangay, setBarangay] = useState("All barangays");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const stored = await getStoredTheme();
      applyTheme(stored);
      setTheme(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncSession = async () => {
      const next = getStoredSession();
      setSession(next);

      // Handle view redirect after session is confirmed (fixes race condition
      // where ?view=admin was checked before session was available)
      const requested = new URLSearchParams(window.location.search).get("view") as View | null;
      if (requested === "admin" && next?.role !== "ADMIN") return;
      if (requested === "marketplace" && next?.role === "ADMIN") {
        window.setTimeout(() => setView("admin"), 0);
        router.replace("/?view=admin#land-listings");
        return;
      }
      if (requested === "seller" && !next) return;
      if (requested && next && ["home", "marketplace", "property", "seller", "admin"].includes(requested)) {
        window.setTimeout(() => setView(requested), 0);
      }
    };
    const syncInquiries = async () => {
      const { readInquiries } = await import("@/lib/inquiries");
      const data = await readInquiries();
      setInquiries(data);
    };
    const loadSaved = () => {
      try {
        const raw = window.localStorage.getItem("yutara-saved");
        const parsed = raw ? JSON.parse(raw) : [];
        setSaved(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSaved([]);
      }
    };
    const timer = window.setTimeout(() => {
      syncSession();
      syncInquiries();
      loadSaved();
    }, 0);
    window.addEventListener("storage", syncSession);
    window.addEventListener(SESSION_EVENT, syncSession);
    window.addEventListener("storage", syncInquiries);
    window.addEventListener(SESSION_EVENT, syncInquiries);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.removeEventListener("storage", syncInquiries);
      window.removeEventListener(SESSION_EVENT, syncInquiries);
    };
  }, [router]);

  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const sync = async () => {
      const data = await readProperties();
      setProperties(data);
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const sync = async () => {
      const email = getStoredSession()?.email ?? null;
      const props = await readProperties();
      setNotifications(await notificationsFor(email, props));
      if (email) {
        const prof = await readProfile(email);
        setProfile(prof);
      } else {
        setProfile({});
      }
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener(SESSION_EVENT, sync);
    };
  }, []);

  const toggleSave = (id: number) => {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    try {
      window.localStorage.setItem("yutara-saved", JSON.stringify(next));
    } catch {}
    setToast(
      saved.includes(id)
        ? "Removed from saved properties"
        : "Saved to your properties",
    );
    window.setTimeout(() => setToast(""), 2400);
  };

  const persistProperties = async (
    updater: (current: Property[]) => Property[],
  ) => {
    const next = updater(properties);
    const { writeProperties } = await import("@/lib/property-store");
    const saved = await writeProperties(next);
    setProperties(next);
    return saved;
  };

  const handleCreateListing = async () => {
    if (!session?.email) return;
    const newProperty: Property = {
      id: Date.now(),
      title: sellForm.title,
      propertyType: sellForm.type,
      type: sellForm.type,
      barangay: sellForm.barangay,
      city: "Panabo City",
      province: "Davao del Norte",
      region: "Davao Region",
      country: "Philippines",
      generalAddress: `${sellForm.barangay}, Panabo City, Davao del Norte`,
      price: Number(sellForm.price),
      area: Number(sellForm.area),
      description: sellForm.description,
      image: sellForm.image || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      seller: session.name || "Seller",
      sellerEmail: session.email,
      listingStatus: "OPEN_FOR_OFFERS",
      roadAccess: "BARANGAY_ROAD",
      latitude: 7.3056,
      longitude: 125.6842,
      promoted: false,
    };

    await persistProperties((current) => [newProperty, ...current]);
    setToast("Property listing published successfully!");
    window.setTimeout(() => setToast(""), 3000);
    setSellerTab("listings");
    setSellForm({
      title: "",
      type: "Residential",
      barangay: "Gredu",
      price: "",
      area: "",
      description: "",
      image: "",
    });
  };

  const handleReplyInquiry = async (inquiryId: string, replyMessage: string) => {
    const { replyToInquiry } = await import("@/lib/inquiries");
    await replyToInquiry(inquiryId, replyMessage);
    setToast("Reply sent to buyer.");
    window.setTimeout(() => setToast(""), 3000);
  };

  const publicProperties = useMemo(
    () =>
      properties.filter(
        (property) => isActiveListing(property),
      ),
    [properties],
  );

  const filtered = useMemo(() => {
    const next = publicProperties.filter((property) => {
      const haystack = `${property.title} ${property.barangay} ${property.type || property.propertyType} ${property.description}`.toLowerCase();
      return (
        haystack.includes(query.toLowerCase()) &&
        (type === "All types" || (property.type || property.propertyType) === type) &&
        (barangay === "All barangays" || property.barangay === barangay) &&
        (!minPrice || property.price >= Number(minPrice)) &&
        (!maxPrice || property.price <= Number(maxPrice))
      );
    });
    return [...next].sort((a, b) =>
      sort === "Price: Low to High"
        ? a.price - b.price
        : sort === "Price: High to Low"
          ? b.price - a.price
          : sort === "Newest"
            ? b.id - a.id
            : Number(Boolean(b.promoted)) - Number(Boolean(a.promoted)),
    );
  }, [query, type, barangay, minPrice, maxPrice, sort, publicProperties]);

  const go = (next: View) => {
    if (next === "admin" && session?.role !== "ADMIN") return router.push("/login");
    if (next === "marketplace" && session?.role === "ADMIN") {
      setView("admin");
      router.replace("/?view=admin#land-listings");
      return;
    }
    if (next === "seller" && !session) return router.push("/login");
    setView(next);
    setSelected(null);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSeller = (target: SellerTab) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setSellerTab(target);
    setView("seller");
  };

  const marketplaceContent = (
    <MarketplaceView
      query={query}
      setQuery={setQuery}
      type={type}
      setType={setType}
      barangay={barangay}
      setBarangay={setBarangay}
      minPrice={minPrice}
      setMinPrice={setMinPrice}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      sort={sort}
      setSort={setSort}
      filtered={filtered}
      saved={saved}
      toggleSave={toggleSave}
      onOpen={(property) => router.push(`/marketplace/${property.id}`)}
      onSell={() => openSeller("new")}
      session={session}
    />
  );

  return (
    <div className="app-shell">
      {(view === "home" || !session) && view !== "admin" && (
        <nav className={`public-nav public-nav-transparent ${scrolled ? "scrolled" : ""}`}>
        <div className="public-nav-inner">
          <div className="public-nav-left">
            <button
              className="public-brand"
              onClick={() => { setView("home"); router.replace("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <YuTaraLogo priority />
            </button>
          </div>
          <div className="public-nav-center">
            <Link
              href="/"
              className={`public-nav-link ${view === "home" ? "active" : ""}`}
              onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              Home
            </Link>
            {session?.role !== "ADMIN" && (
              <Link
                href="/marketplace"
                className="public-nav-link"
                onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                Marketplace
              </Link>
            )}
            <Link
              href="/about"
              className="public-nav-link"
              onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              About Us
            </Link>
            <Link
              href="/services"
              className="public-nav-link"
              onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              Services Offered
            </Link>
            <Link
              href="/contact"
              className="public-nav-link"
              onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              Contact Us
            </Link>
          </div>
          <div className="public-nav-right">
            {!session && (
              <span className="header-auth-links">
                <Link href="/login" className="header-link home-login-button">Log in</Link>
                <Link href="/register" className="header-link home-register-button">Register</Link>
              </span>
            )}
            {session && (
              <>
                <Link
                  className="header-link ghost workspace-header-link"
                  href={session.role === "ADMIN" ? "/?view=admin#land-listings" : session.role.startsWith("AGENCY") ? "/agency" : "/marketplace"}
                >
                  {session.role === "ADMIN" ? "Land Listings" : session.role.startsWith("AGENCY") ? "Agency Portal" : "My YuTara"}
                </Link>
                <button
                  className="icon-button notif-trigger"
                  aria-label={`Notifications (${notifications.total})`}
                  onClick={() => router.push("/notifications")}
                >
                  <Bell size={19} />
                  {notifications.total > 0 && <span className="notif-badge">{notifications.total}</span>}
                </button>
                <button
                  className="menu-button account-trigger"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                >
                  <CircleUserRound size={19} />
                </button>
                <button className="button button-danger" onClick={() => {
                  clearStoredSession();
                  setStoredTheme("light");
                  setTheme("light");
                  setSession(null);
                  setAccountMenuOpen(false);
                  setSelected(null);
                  setSellerTab("listings");
                  setView("home");
                  router.replace("/");
                }}>
                  Log out
                </button>
                {accountMenuOpen && (
                  <div className="account-menu" role="menu">
                    {session.role === "USER" && <button onClick={() => { setAccountMenuOpen(false); router.push("/marketplace"); }}>Marketplace</button>}
                    {session.role === "USER" && <button onClick={() => { setAccountMenuOpen(false); router.push("/dashboard"); }}>My Properties</button>}
                    {session.role.startsWith("AGENCY") && <button onClick={() => { setAccountMenuOpen(false); router.push("/agency"); }}>Agency Portal</button>}
                    <button onClick={() => { setAccountMenuOpen(false); setProfileDraft({ name: profile.name ?? session.name, bio: profile.bio ?? "", avatar: profile.avatar ?? "" }); setProfileOpen(true); }}>Profile</button>
                    <button onClick={() => { setAccountMenuOpen(false); setSettingsOpen(true); }}>Settings</button>
                    {session.role === "ADMIN" && <button onClick={() => go("admin")}>Land Listings</button>}
                    <hr />
                    <button onClick={() => { clearStoredSession(); setStoredTheme("light"); setTheme("light"); setSession(null); setAccountMenuOpen(false); setSelected(null); setSellerTab("listings"); setView("home"); router.replace("/"); }}>Log out</button>
                  </div>
                )}
              </>
            )}
            <button className="icon-button nav-toggle" onClick={() => setMobileNavOpen((o) => !o)}>
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>
      )}

      {mobileNavOpen && (view === "home" || !session) && (
        <div className="mobile-nav" role="menu">
          <button onClick={() => { setMobileNavOpen(false); setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Home</button>
          {session?.role !== "ADMIN" && <button onClick={() => { setMobileNavOpen(false); go("marketplace"); }}>Marketplace</button>}
          {session?.role === "USER" && <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>My Properties</Link>}
          {session?.role === "ADMIN" && <Link href="/?view=admin#land-listings" onClick={() => setMobileNavOpen(false)}>Land Listings</Link>}
          {session?.role === "ADMIN" && <Link href="/?view=admin#user-registrations" onClick={() => setMobileNavOpen(false)}>User Registrations</Link>}
          <Link href="/about" onClick={() => setMobileNavOpen(false)}>About Us</Link>
          <Link href="/services" onClick={() => setMobileNavOpen(false)}>Services Offered</Link>
          <Link href="/contact" onClick={() => setMobileNavOpen(false)}>Contact Us</Link>
          {!session && (
            <>
              <Link href="/login" onClick={() => setMobileNavOpen(false)}>Log in</Link>
              <Link href="/register" onClick={() => setMobileNavOpen(false)}>Get started</Link>
            </>
          )}
          {session && <button onClick={() => { setMobileNavOpen(false); clearStoredSession(); setStoredTheme("light"); setTheme("light"); setSession(null); setView("home"); router.replace("/"); }}>Log out</button>}
        </div>
      )}

      {view === "home" && (
        <>
          <section className="hero-section fade-up hero-transparent">
            <div className="hero-bg" style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85")`
            }} />
            <div className="hero-overlay" />
            <div className="hero-content hero-content-left">
              <div className="hero-eyebrow">Your Digital Land Marketplace</div>
              <h1 className="hero-heading">
                Your Land. Your Opportunity. Your <em>YuTara.</em>
              </h1>
              <p className="hero-subhead">
                Discover land opportunities, connect with property owners, and
                take the next step toward a more convenient land transaction
                experience.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => go("marketplace")}>
                  Explore Marketplace <ArrowRight size={16} />
                </button>
                <button className="btn btn-outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                  Learn More
                </button>
              </div>
              <div className="hero-trust">
                Agency-assisted land transfer processing • Secure transactions
              </div>
            </div>
          </section>

          <section className="search-preview-section fade-up">
            <div className="search-preview-container">
              <div className="search-preview-card">
                <div className="search-preview-form">
                  <input
                    className="search-preview-input"
                    placeholder="Location or barangay"
                    aria-label="Location or barangay"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <select className="search-preview-select" aria-label="Property type" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="All types">Any property type</option>
                    <option value="Residential">Residential</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                  <input className="search-preview-input" placeholder="Min budget (₱)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="numeric" />
                  <input className="search-preview-input" placeholder="Max budget (₱)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" />
                  <button className="search-preview-btn" onClick={() => go("marketplace")}>
                    Search Properties
                  </button>
                </div>
                <div className="search-preview-image" style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80")`
                }} />
              </div>
            </div>
          </section>

          <section className="features-section fade-up" id="features">
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Why YuTara</div>
                  <h2>Built for trust, transparency, and convenience.</h2>
                  <p>
                    A modern property technology platform designed to make land
                    discovery and transactions simple and secure.
                  </p>
                </div>
              </div>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon"><MapPin size={20} /></div>
                  <h3 className="feature-heading">Convenient Property Discovery</h3>
                  <p className="feature-text">Browse verified land listings across Panabo City with detailed property information.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"><Users size={20} /></div>
                  <h3 className="feature-heading">Transparent Buyer-Seller Communication</h3>
                  <p className="feature-text">Connect directly with property owners through secure inquiries and booking requests.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"><FileCheck2 size={20} /></div>
                  <h3 className="feature-heading">Organized Transaction Process</h3>
                  <p className="feature-text">Track your transaction progress from agreement to transfer completion.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"><Leaf size={20} /></div>
                  <h3 className="feature-heading">Agency-Assisted Transfer Processing</h3>
                  <p className="feature-text">The affiliated agency coordinates document collection and land transfer.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="process-section fade-up">
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">How It Works</div>
                  <h2>From discovery to transfer in four steps.</h2>
                  <p>
                    A simple, guided process that takes you from browsing to
                    land ownership with confidence.
                  </p>
                </div>
              </div>
              <div className="process-steps">
                <div className="process-step">
                  <div className="process-step-number">1</div>
                  <h3 className="process-step-title">Discover</h3>
                  <p className="process-step-text">Browse land listings and explore property details.</p>
                </div>
                <div className="process-step">
                  <div className="process-connector" />
                  <div className="process-step-number">2</div>
                  <h3 className="process-step-title">Connect</h3>
                  <p className="process-step-text">Contact the seller and discuss the property.</p>
                </div>
                <div className="process-step">
                  <div className="process-connector" />
                  <div className="process-step-number">3</div>
                  <h3 className="process-step-title">Agree</h3>
                  <p className="process-step-text">When buyer and seller reach an agreement, initiate the transaction.</p>
                </div>
                <div className="process-step">
                  <div className="process-connector" />
                  <div className="process-step-number">4</div>
                  <h3 className="process-step-title">Transfer</h3>
                  <p className="process-step-text">Submit documents for the affiliated agency to process the land transfer.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="featured-lands-section home-featured-lands fade-up" id="featured-lands">
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Featured Lands</div>
                  <h2>Discover Opportunities on the Land.</h2>
                  <p>
                    Explore available properties and find the right opportunity
                    for your next investment.
                  </p>
                </div>
              </div>
              <div className="featured-grid">
                {publicProperties.slice(0, 6).map((property) => (
                  <div key={property.id} className="featured-land-card fade-up">
                    <div className="featured-image" style={{
                      backgroundImage: `url(${property.image})`
                    }}>
                      {property.promoted && (
                        <span className="featured-badge">Promoted</span>
                      )}
                      <button
                        className="featured-save"
                        aria-label={saved.includes(property.id) ? "Remove saved property" : "Save property"}
                        onClick={() => toggleSave(property.id)}
                      >
                        <Heart size={16} fill={saved.includes(property.id) ? "#d79c43" : "none"} />
                      </button>
                    </div>
                    <div className="featured-body">
                      <span className="featured-type">{property.type || property.propertyType} lot</span>
                      <h3 className="featured-title">{property.title}</h3>
                      <p className="featured-location">
                        <MapPin size={14} /> {property.barangay}, {property.city}
                      </p>
                      <div className="featured-meta">
                        <span className="featured-price">₱{property.price.toLocaleString()}</span>
                        <span className="featured-area">{property.area.toLocaleString()} sqm</span>
                      </div>
                      <button className="featured-btn" onClick={() => router.push(`/marketplace/${property.id}`)}>
                        View Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <button className="btn btn-primary" onClick={() => go("marketplace")}>
                  Browse All Properties <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="cta-section fade-up">
            <div className="cta-decoration" />
            <div className="cta-content">
              <h2 className="cta-heading">Your Next Land Opportunity Starts Here.</h2>
              <p className="cta-text">
                Find land opportunities, connect with property owners, and
                experience a more organized way to transact.
              </p>
              <button className="cta-btn" onClick={() => go("marketplace")}>
                Explore YuTara
              </button>
            </div>
          </section>

          <footer className="public-footer">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="footer-brand-text">YuTara</div>
                <div className="footer-slogan">Yuta ba? YuTara!</div>
                <p className="footer-description">
                  A trusted Philippine land marketplace helping people discover
                  land, connect with sellers, and transact with confidence.
                </p>
              </div>
              <div>
                <div className="footer-heading">Quick Links</div>
                <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/services">Services Offered</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
                </ul>
              </div>
              <div>
                <div className="footer-heading">Services</div>
                <ul className="footer-links">
              <li><Link href="/">Digital Land Marketplace</Link></li>
              <li><Link href="/">Property Discovery</Link></li>
              <li><Link href="/">Buyer-Seller Connection</Link></li>
              <li><Link href="/">Digital Reservation</Link></li>
              <li><Link href="/">Transaction Tracking</Link></li>
              <li><Link href="/">Agency-Assisted Transfer</Link></li>
                </ul>
              </div>
              <div>
                <div className="footer-heading">Contact</div>
                <ul className="footer-links">
              <li><Link href="/">Panabo City, Davao del Norte</Link></li>
              <li><Link href="/">support@yutara.com</Link></li>
              <li><Link href="/">+63 917 123 4567</Link></li>
                </ul>
                <div className="footer-social">
                  <Link href="/">facebook</Link>
                  <Link href="/">twitter</Link>
                  <Link href="/">instagram</Link>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <span className="footer-bottom-text">© 2024 YuTara Marketplace. All rights reserved.</span>
              <span className="footer-bottom-text">Internal verification does not replace legal or government due diligence.</span>
            </div>
          </footer>
        </>
      )}

      {view === "marketplace" && (
        session ? (
          <AppLayout session={session} pageTitle="Marketplace" showSearch={false} activeSectionOverride="marketplace">
            <div className="workspace-marketplace">{marketplaceContent}</div>
          </AppLayout>
        ) : (
          <main className="public-marketplace-content">{marketplaceContent}</main>
        )
      )}
      {view === "property" && selected && (
        <PropertyDetailView
          property={selected}
          saved={saved.includes(selected.id)}
          owned={Boolean(session?.email && selected.sellerEmail === session.email)}
          onSave={() => toggleSave(selected.id)}
          onBack={() => { setView("marketplace"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onContact={() => { setInquiryOpen(true); }}
          onRequestBooking={async () => {
            if (!session) { router.push(`/login?next=/property/${selected.id}`); return; }
            if (selected.sellerEmail === session.email) {
              setToast("You cannot request a booking on your own listing.");
              window.setTimeout(() => setToast(""), 2500);
              return;
            }
            try {
              const { createBookingRequest } = await import("@/lib/booking-service");
              await createBookingRequest({
                propertyId: selected.id,
                propertyTitle: selected.title,
                buyerId: session.email,
                buyerName: session.name,
                buyerEmail: session.email,
                sellerId: selected.sellerEmail || "seller@yutara.com",
                sellerName: selected.seller,
                message: "Hello, I am interested in booking this property. Please review my request.",
              });
              setToast("Booking request sent to the seller.");
              window.setTimeout(() => setToast(""), 3000);
              go("marketplace");
            } catch (err: unknown) {
              setToast((err as Error).message || "Failed to send booking request.");
              window.setTimeout(() => setToast(""), 3000);
            }
          }}
        />
      )}
      {view === "seller" && (
        session ? (
          <AppLayout session={session} pageTitle="Sell Land" showSearch={false}>
            <SellLandView
              properties={properties.filter(
                (property) => property.seller === "You" || (Boolean(session?.email) && property.sellerEmail === session?.email),
              )}
              inquiries={inquiries}
              tab={sellerTab}
              setTab={setSellerTab}
              sellerEmail={session?.email ?? ""}
              form={sellForm}
              setForm={setSellForm}
              onSubmit={handleCreateListing}
              onReply={handleReplyInquiry}
              onBack={() => { setView("marketplace"); }}
            />
          </AppLayout>
        ) : (
          <SellLandView
          properties={properties.filter(
            (property) => property.seller === "You",
          )}
          inquiries={inquiries}
          tab={sellerTab}
          setTab={setSellerTab}
          sellerEmail=""
          form={sellForm}
          setForm={setSellForm}
          onSubmit={handleCreateListing}
          onReply={handleReplyInquiry}
          onBack={() => { setView("marketplace"); }}
          />
        )
      )}
      {view === "admin" && (
        <AppLayout
          session={session}
          isAgency={false}
          pageTitle="Land Listings"
          showSearch={false}
        >
          <AdminView
            properties={properties}
            onSetListingStatus={(id, listingStatus, terminationReason) => {
              persistProperties((items) =>
                items.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        listingStatus,
                        terminationReason,
                        terminatedBy:
                          listingStatus === "TERMINATED"
                            ? session?.email
                            : undefined,
                        terminatedAt:
                          listingStatus === "TERMINATED"
                            ? new Date().toISOString()
                            : undefined,
                        promoted:
                          listingStatus === "OPEN_FOR_OFFERS"
                            ? item.promoted
                            : false,
                      }
                    : item,
                ),
              );
              setToast(
                listingStatus === "TERMINATED"
                  ? "Property terminated successfully"
                  : `Property marked ${listingStatus.replaceAll("_", " ").toLowerCase()}`,
              );
              window.setTimeout(() => setToast(""), 2500);
            }}
          />
        </AppLayout>
      )}
      {inquiryOpen && selected && (
        <Modal title="Contact seller" onClose={() => setInquiryOpen(false)}>
          <p className="muted">Send a message about <strong>{selected.title}</strong>.</p>
          <div className="form-grid">
            <label>
              Your message
              <textarea className="form-input form-textarea" value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} />
            </label>
          </div>
          <div className="modal-foot">
            <button className="button button-ghost" onClick={() => setInquiryOpen(false)}>Cancel</button>
            <button className="button button-primary" onClick={async () => {
              const { addInquiry, readInquiries } = await import("@/lib/inquiries");
              if (selected) {
                await addInquiry({
                  propertyId: selected.id,
                  propertyTitle: selected.title,
                  buyerName: session?.name || "YuTara buyer",
                  buyerEmail: session?.email || "buyer@yutara.com",
                  message: inquiryMessage.trim() || "I am interested in this property.",
                });
                const updated = await readInquiries();
                setInquiries(updated);
              }
              setInquiryOpen(false);
              setToast("Inquiry sent successfully");
              window.setTimeout(() => setToast(""), 2500);
            }}>Send inquiry <ArrowRight size={15} /></button>
          </div>
        </Modal>
      )}
      {profileOpen && session && (
        <Modal title="Profile" onClose={() => setProfileOpen(false)}>
          <div className="profile-panel">
            <div className="profile-avatar" style={profileDraft.avatar ? { backgroundImage: `url(${profileDraft.avatar})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
              {!profileDraft.avatar && <CircleUserRound size={30} />}
            </div>
            <div>
              <h3>{profileDraft.name || session.name}</h3>
              <p className="muted">{session.email}</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Display name
              <input className="form-input" value={profileDraft.name ?? ""} onChange={(e) => setProfileDraft((c) => ({ ...c, name: e.target.value }))} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Bio
              <textarea className="form-input form-textarea" value={profileDraft.bio ?? ""} onChange={(e) => setProfileDraft((c) => ({ ...c, bio: e.target.value }))} placeholder="Tell buyers or sellers a little about yourself." />
            </label>
          </div>
          <div className="modal-foot">
            <button className="button button-ghost" onClick={() => setProfileOpen(false)}>Close</button>
            <button className="button button-primary" onClick={() => {
              writeProfile(session.email, profileDraft);
              setProfile(profileDraft);
              setProfileOpen(false);
              setToast("Profile updated");
              window.setTimeout(() => setToast(""), 2500);
            }}>Save profile</button>
          </div>
        </Modal>
      )}
      {settingsOpen && (
        <Modal title="Settings" onClose={() => setSettingsOpen(false)}>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Appearance</strong>
              </div>
              <button
                className={`theme-toggle ${theme === "dark" ? "on" : ""}`}
                onClick={() => setTheme((c) => (c === "dark" ? "light" : "dark"))}
                style={{ marginLeft: "auto" }}
              >
                <span className="theme-toggle-icon">{theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}</span>
                <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>
          <div className="modal-foot">
            <button className="button button-primary" onClick={() => setSettingsOpen(false)}>Done</button>
          </div>
        </Modal>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
