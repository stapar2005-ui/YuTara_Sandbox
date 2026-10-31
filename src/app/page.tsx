"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CircleUserRound,
  FileCheck2,
  Leaf,
  Menu,
  MessageCircle,
  Moon,
  ShieldCheck,
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
import {
  addInquiry,
  INQUIRIES_EVENT,
  Inquiry,
  readInquiries,
  replyToInquiry,
} from "@/lib/inquiries";
import {
  readProperties,
  PROPERTIES_EVENT,
  writeProperties,
} from "@/lib/property-store";
import { notificationsFor } from "@/lib/notifications";
import { readProfile, writeProfile, UserProfile } from "@/lib/profile";
import { resizeImage } from "@/lib/image";
import { TRANSACTIONS_EVENT } from "@/lib/transactions";
import { isPromotionActive } from "@/lib/marketplace";
import { useAutoHideHeader } from "@/lib/use-auto-hide-header";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  Theme,
} from "@/lib/theme";
import { YuTaraLogo } from "@/components/YuTaraLogo";
import {
  isWithinServiceArea,
  PANABO_BARANGAYS,
  YUTARA_SERVICE_AREA,
} from "@/lib/yutara-config";
import {
  getInitialProperties,
  getListingStatus,
  isActiveListing,
  Property,
} from "@/lib/marketplace";
import { PromotedCarousel } from "@/components/PromotedCarousel";
import { CertificationSection } from "@/components/CertificationSection";
import { MarketplaceView } from "@/components/MarketplaceView";
import { PropertyDetailView } from "@/components/PropertyDetailView";
import { SellLandView, SellerTab } from "@/components/SellLandView";
import { AdminView } from "@/components/AdminView";
import { AdminTransactionVerifications } from "@/components/AdminTransactionVerifications";
import { Modal } from "@/components/Modal";

type View = "home" | "marketplace" | "property" | "seller" | "admin";

function Logo() {
  return (
    <div className="brand">
      <YuTaraLogo priority />
    </div>
  );
}

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
  const headerHidden = useAutoHideHeader();
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
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("Recommended");
  const [barangay, setBarangay] = useState("All barangays");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [form, setForm] = useState<{
    title: string;
    type: string;
    barangay: string;
    price: string;
    area: string;
    description: string;
    image: string;
  }>({
    title: "",
    type: "Residential",
    barangay: PANABO_BARANGAYS[0],
    price: "",
    area: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "view",
    ) as View | null;
    const currentSession = getStoredSession();
    if (requested === "admin" && currentSession?.role !== "ADMIN") return;
    if (requested === "seller" && !currentSession) return;
    if (
      requested &&
      currentSession &&
      ["home", "marketplace", "property", "seller", "admin"].includes(requested)
    ) {
      window.setTimeout(() => setView(requested), 0);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getStoredTheme();
      applyTheme(stored);
      setTheme(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncSession = () => {
      const next = getStoredSession();
      setSession(next);
      setView((current) => {
        if (!next && (current === "seller" || current === "admin")) {
          return "home";
        }
        return current;
      });
    };
    const syncInquiries = () => setInquiries(readInquiries());
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
    window.addEventListener(INQUIRIES_EVENT, syncInquiries);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(SESSION_EVENT, syncSession);
      window.removeEventListener(INQUIRIES_EVENT, syncInquiries);
    };
  }, []);

  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => setProperties(readProperties());
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persistProperties = (
    updater: (current: Property[]) => Property[],
  ) => {
    const next = updater(properties);
    const saved = writeProperties(next);
    setProperties(next);
    if (!saved) {
      setToast("Browser storage is full — this change may not be saved.");
      window.setTimeout(() => setToast(""), 3200);
    }
  };

  useEffect(() => {
    const sync = () => {
      const email = getStoredSession()?.email ?? null;
      setNotifications(notificationsFor(email, readProperties()));
      setProfile(email ? readProfile(email) : {});
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener(INQUIRIES_EVENT, sync);
    window.addEventListener(TRANSACTIONS_EVENT, sync);
    window.addEventListener(PROPERTIES_EVENT, sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener(INQUIRIES_EVENT, sync);
      window.removeEventListener(TRANSACTIONS_EVENT, sync);
      window.removeEventListener(PROPERTIES_EVENT, sync);
    };
  }, []);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".account-trigger") &&
        !target.closest(".account-menu")
      ) {
        setAccountMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountMenuOpen]);

  const toggleSave = (id: number) => {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    try {
      window.localStorage.setItem("yutara-saved", JSON.stringify(next));
    } catch {
      // ignore
    }
    setToast(
      saved.includes(id)
        ? "Removed from saved properties"
        : "Saved to your properties",
    );
    window.setTimeout(() => setToast(""), 2400);
  };

  const publicProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          isWithinServiceArea(property.city, property.province) &&
          isActiveListing(property),
      ),
    [properties],
  );

  const filtered = useMemo(() => {
    const next = publicProperties.filter((property) => {
      const haystack =
        `${property.title} ${property.barangay} ${property.type || property.propertyType} ${property.description}`.toLowerCase();
      return (
        haystack.includes(query.toLowerCase()) &&
        (type === "All types" || (property.type || property.propertyType) === type) &&
        (barangay === "All barangays" || property.barangay === barangay) &&
        (!minPrice || property.price >= Number(minPrice)) &&
        (!maxPrice || property.price <= Number(maxPrice)) &&
        (!verifiedOnly || property.status === "PUBLISHED" || property.verificationStatus === "VERIFIED")
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
  }, [
    query,
    type,
    barangay,
    minPrice,
    maxPrice,
    verifiedOnly,
    sort,
    publicProperties,
  ]);

  const go = (next: View) => {
    if (next === "admin" && session?.role !== "ADMIN")
      return router.push("/login");
    if (next === "seller" && !session) return router.push("/login");
    setView(next);
    setSelected(null);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToHomeMarketplace = () => {
    if (view === "home") {
      document
        .getElementById("marketplace-preview")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    go("marketplace");
  };

  const submitProperty = (documents: Record<string, string>) => {
    const created: Property = {
      id: Date.now(),
      title: form.title.trim() || "New property submission",
      type: form.type,
      propertyType: form.type,
      city: YUTARA_SERVICE_AREA.city,
      province: YUTARA_SERVICE_AREA.province,
      region: YUTARA_SERVICE_AREA.region,
      country: YUTARA_SERVICE_AREA.country,
      barangay: form.barangay,
      generalAddress: "General location available upon inquiry",
      price: Number(form.price) || 0,
      area: Number(form.area) || 0,
      description: form.description.trim() || "Submitted for YuTara review.",
      status: "UNDER_REVIEW",
      verificationStatus: "UNDER_REVIEW",
      listingStatus: "CLOSED",
      seller: "You",
      sellerEmail: session?.email,
      roadAccess: "BARANGAY_ROAD",
      latitude: 7.308,
      longitude: 125.684,
      verificationDate: "",
      verificationId: `YT-2026-${String(Date.now()).slice(-6)}`,
      image:
        form.image ||
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
      submittedDocuments: Object.values(documents).filter(Boolean),
      submitted: "Just now",
    };
    persistProperties((current) => [created, ...current]);
    setForm({
      title: "",
      type: "Residential",
      barangay: PANABO_BARANGAYS[0],
      price: "",
      area: "",
      description: "",
      image: "",
    });
    setToast("Listing submitted for YuTara verification");
    setTimeout(() => setToast(""), 2600);
    setSellerTab("listings");
    go("seller");
  };

  const openSeller = (target: SellerTab) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setSellerTab(target);
    go("seller");
  };

  return (
    <div className="app-shell">
      <header className={`topbar ${headerHidden ? "topbar-hidden" : ""}`}>
        <div className="container nav">
          <button
            onClick={() => go("home")}
            style={{ border: 0, background: "none", padding: 0 }}
          >
            <Logo />
          </button>
          {view === "home" && (
            <nav className="nav-links">
              <button className="active" onClick={() => go("home")}>
                Home
              </button>
              <button onClick={() => go("marketplace")}>Marketplace</button>
              {session && <Link href="/dashboard">Dashboard</Link>}
              <button
                onClick={() =>
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                About Us
              </button>
            </nav>
          )}
          <div className="nav-actions">
            {!session && (
              <span className="nav-auth">
                <a className="button button-ghost" href="/login">
                  Login
                </a>
                <a className="button button-primary" href="/register">
                  Register
                </a>
              </span>
            )}
            {session && (
              <button
                className="icon-button notif-trigger"
                aria-label={`Notifications (${notifications.total})`}
                onClick={() => openSeller("transactions")}
              >
                <Bell size={19} />
                {notifications.total > 0 && (
                  <span className="notif-badge">{notifications.total}</span>
                )}
              </button>
            )}
            {session && (
              <>
                <button
                  className="menu-button account-trigger"
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                >
                  <CircleUserRound size={19} />
                </button>
                {accountMenuOpen && (
                  <div className="account-menu" role="menu">
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/dashboard");
                      }}
                    >
                      My dashboard
                    </button>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setProfileDraft({
                          name: profile.name ?? session.name,
                          bio: profile.bio ?? "",
                          avatar: profile.avatar ?? "",
                        });
                        setProfileOpen(true);
                      }}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setSettingsOpen(true);
                      }}
                    >
                      Settings
                    </button>
                    {session.role === "ADMIN" && (
                      <button onClick={() => go("admin")}>
                        Admin dashboard
                      </button>
                    )}
                    <hr />
                    <button
                      onClick={() => {
                        clearStoredSession();
                        setStoredTheme("light");
                        setTheme("light");
                        setSession(null);
                        setAccountMenuOpen(false);
                        setSelected(null);
                        setSellerTab("listings");
                        setView("home");
                        router.push("/");
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              className="icon-button nav-toggle"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => {
                setMobileNavOpen((open) => !open);
                setAccountMenuOpen(false);
              }}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="mobile-nav" role="menu">
            <button
              onClick={() => {
                setMobileNavOpen(false);
                go("home");
              }}
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileNavOpen(false);
                go("marketplace");
              }}
            >
              Marketplace
            </button>
            {session && (
              <Link
                href="/dashboard"
                onClick={() => setMobileNavOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={() => {
                setMobileNavOpen(false);
                go("home");
                window.setTimeout(
                  () =>
                    document
                      .getElementById("about")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  60,
                );
              }}
            >
              About Us
            </button>
            {!session && (
              <>
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      {view === "home" && (
        <>
          <section className="hero">
            <div className="container hero-content">
              <div className="eyebrow">Currently serving Panabo City</div>
              <h1 className="display">
                Yuta ba?
                <br />
                <em>YuTara.</em>
              </h1>
              <p>
                Find verified land in Panabo City with confidence. YuTara is
                starting local to build trust before expanding with care.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={goToHomeMarketplace}
                >
                  Explore Panabo City properties <ArrowRight size={16} />
                </button>
              </div>
              <div className="hero-note">
                <span className="seal">
                  <ShieldCheck size={17} />
                </span>
                <span>
                  <strong>Verification-first.</strong> Better questions before
                  bigger decisions.
                </span>
              </div>
            </div>
          </section>
          <section className="section" id="trust">
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">The YuTara standard</div>
                  <h2 className="display">Trust, made visible.</h2>
                </div>
                <p>
                  We make the review journey legible, so you can spend less time
                  wondering and more time deciding.
                </p>
              </div>
              <div className="trust-grid">
                <div className="trust-card">
                  <FileCheck2 className="trust-icon" />
                  <h3>Verified listings</h3>
                  <p>
                    Every published property passes YuTara&apos;s internal
                    review process.
                  </p>
                </div>
                <div className="trust-card">
                  <Users className="trust-icon" />
                  <h3>Trusted sellers</h3>
                  <p>
                    Seller information and required submission details are
                    reviewed.
                  </p>
                </div>
                <div className="trust-card">
                  <Leaf className="trust-icon" />
                  <h3>Clear information</h3>
                  <p>
                    See the details, status, and context you need before
                    reaching out.
                  </p>
                </div>
                <div className="trust-card">
                  <MessageCircle className="trust-icon" />
                  <h3>Direct connection</h3>
                  <p>
                    Ask the seller your next question from the listing itself.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section
            className="section home-marketplace"
            id="marketplace-preview"
          >
            <div className="container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">YuTara Promoted</div>
                  <h2 className="display">Promoted lands in Panabo City.</h2>
                </div>
                <p>
                  Properties intentionally placed above the recommendations
                  because the seller chose to promote them.
                </p>
              </div>
              <PromotedCarousel
                properties={publicProperties.filter(
                  (property) =>
                    isPromotionActive(property) &&
                    (property.status === "PUBLISHED" ||
                      property.verificationStatus === "VERIFIED") &&
                    getListingStatus(property) === "OPEN_FOR_OFFERS",
                )}
                saved={saved}
                onSave={toggleSave}
                onOpen={(property) => {
                  setSelected(property);
                  setView("property");
                }}
              />
              <div className="home-marketplace-action">
                <button
                  className="button button-primary"
                  onClick={() => go("marketplace")}
                >
                  Open marketplace <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
      {view === "marketplace" && (
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
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          sort={sort}
          setSort={setSort}
          filtered={filtered}
          saved={saved}
          toggleSave={toggleSave}
          onOpen={(property) => {
            setSelected(property);
            setView("property");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onSell={() => openSeller("new")}
        />
      )}
      {view === "property" && selected && (
        <PropertyDetailView
          property={selected}
          saved={saved.includes(selected.id)}
          owned={Boolean(
            session?.email && selected.sellerEmail === session.email,
          )}
          onSave={() => toggleSave(selected.id)}
          onBack={() => go("marketplace")}
          onContact={() => {
            setInquiryMessage(
              "Hello, I am interested in this property and would like to know more about its availability.",
            );
            setInquiryOpen(true);
          }}
          onReserve={() => {
            if (session?.email && selected.sellerEmail === session.email) {
              setToast("You can't reserve your own listing");
              setTimeout(() => setToast(""), 2500);
              return;
            }
            if (!session)
              return router.push(`/login?next=/reservation/${selected.id}`);
            router.push(`/reservation/${selected.id}`);
          }}
        />
      )}
      {view === "seller" && (
        <SellLandView
          properties={properties.filter(
            (property) =>
              property.seller === "You" ||
              (Boolean(session?.email) &&
                property.sellerEmail === session?.email),
          )}
          inquiries={inquiries}
          tab={sellerTab}
          setTab={setSellerTab}
          sellerEmail={session?.email ?? ""}
          form={form}
          setForm={setForm}
          onSubmit={submitProperty}
          onReply={(id, reply) => setInquiries(replyToInquiry(id, reply))}
          onBack={() => go("marketplace")}
        />
      )}
      {view === "admin" && (
        <>
          <AdminView
            properties={properties}
          onApprove={(id) => {
            const item = properties.find((property) => property.id === id);
            if (!item || !isWithinServiceArea(item.city, item.province)) {
              setToast("Location outside current service area");
              setTimeout(() => setToast(""), 2500);
              return;
            }
            persistProperties((items) =>
              items.map((prop) =>
                prop.id === id
                  ? {
                      ...prop,
                      status: "PUBLISHED",
                      verificationStatus: "VERIFIED",
                      listingStatus: "OPEN_FOR_OFFERS",
                    }
                  : prop,
              ),
            );
            setToast("Property approved and published");
            setTimeout(() => setToast(""), 2500);
          }}
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
            setTimeout(() => setToast(""), 2500);
          }}
          onSetVerification={(id, status, note) => {
            persistProperties((items) =>
              items.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status,
                      verificationStatus: status,
                      listingStatus: "CLOSED",
                      terminationReason:
                        status === "REJECTED" ? note : item.terminationReason,
                    }
                  : item,
              ),
            );
            setToast(
              status === "REJECTED"
                ? "Submission rejected and seller notified"
                : "Correction requested from seller",
            );
            setTimeout(() => setToast(""), 2500);
          }}
          />
          <section className="section">
            <div className="container">
              <div className="eyebrow">Transaction verification</div>
              <h2 className="display">
                Bookings awaiting document verification
              </h2>
              <AdminTransactionVerifications />
            </div>
          </section>
        </>
      )}
      {view === "home" && <CertificationSection />}
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Logo />
            <small>Yuta ba? YuTara!</small>
          </div>
          <small>
            Internal verification helps inform your next step. It does not
            replace legal or government due diligence.
          </small>
        </div>
      </footer>
      {inquiryOpen && (
        <Modal title="Contact seller" onClose={() => setInquiryOpen(false)}>
          <p className="muted">
            Send a thoughtful first message about{" "}
            <strong>{selected?.title}</strong>.
          </p>
          <div className="form-grid">
            <label>
              Your message
              <textarea
                className="form-input form-textarea"
                value={inquiryMessage}
                onChange={(event) => setInquiryMessage(event.target.value)}
              />
            </label>
          </div>
          <div className="modal-foot">
            <button
              className="button button-ghost"
              onClick={() => setInquiryOpen(false)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                if (selected) {
                  addInquiry({
                    propertyId: selected.id,
                    propertyTitle: selected.title,
                    buyerName: session?.name || "YuTara buyer",
                    buyerEmail: session?.email || "buyer@yutara.com",
                    message:
                      inquiryMessage.trim() ||
                      "I am interested in this property.",
                  });
                  setInquiries(readInquiries());
                }
                setInquiryOpen(false);
                setToast("Inquiry sent successfully");
                setTimeout(() => setToast(""), 2500);
              }}
            >
              Send inquiry <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {profileOpen && session && (
        <Modal title="Profile" onClose={() => setProfileOpen(false)}>
          <div className="profile-panel">
            <div
              className="profile-avatar"
              style={
                profileDraft.avatar
                  ? {
                      backgroundImage: `url(${profileDraft.avatar})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!profileDraft.avatar && <CircleUserRound size={30} />}
            </div>
            <div>
              <h3>{profileDraft.name || session.name}</h3>
              <p className="muted">{session.email}</p>
              <span className="badge badge-verified">
                {session.role === "ADMIN" ? "YuTara Admin" : "YuTara User"}
              </span>
            </div>
          </div>
          {profileDraft.bio && (
            <p className="muted" style={{ marginTop: 10 }}>
              {profileDraft.bio}
            </p>
          )}
          <div className="form-grid">
            <label>
              Display name
              <input
                className="form-input"
                value={profileDraft.name ?? ""}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Profile photo
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await resizeImage(file, 400, 0.8);
                  setProfileDraft((current) => ({
                    ...current,
                    avatar: dataUrl,
                  }));
                }}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Bio
              <textarea
                className="form-input form-textarea"
                value={profileDraft.bio ?? ""}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                placeholder="Tell buyers or sellers a little about yourself."
              />
            </label>
          </div>
          <div className="modal-foot">
            <button
              className="button button-ghost"
              onClick={() => setProfileOpen(false)}
            >
              Close
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                writeProfile(session.email, profileDraft);
                setProfile(profileDraft);
                setProfileOpen(false);
                setToast("Profile updated");
                setTimeout(() => setToast(""), 2500);
              }}
            >
              Save profile
            </button>
          </div>
        </Modal>
      )}
      {settingsOpen && (
        <Modal title="Settings" onClose={() => setSettingsOpen(false)}>
          <div className="settings-list">
            <div className="settings-row">
              <div>
                <strong>Appearance</strong>
                <p className="muted">
                  Switch between light and dark mode for YuTara.
                </p>
              </div>
              <button
                className={`theme-toggle ${theme === "dark" ? "on" : ""}`}
                role="switch"
                aria-checked={theme === "dark"}
                onClick={() =>
                  setTheme((current) => (current === "dark" ? "light" : "dark"))
                }
              >
                <span className="theme-toggle-icon">
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                </span>
                <span className="theme-toggle-label">
                  {theme === "dark" ? "Dark" : "Light"}
                </span>
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>Inquiry alerts</strong>
                <p className="muted">
                  Show a badge when buyers reach out about your listings.
                </p>
              </div>
              <span className="badge badge-verified">On</span>
            </div>
          </div>
          <div className="modal-foot">
            <button
              className="button button-primary"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
