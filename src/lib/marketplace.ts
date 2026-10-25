import { PANABO_BARANGAYS, YUTARA_SERVICE_AREA } from "./yutara-config";

export type VerificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "VERIFIED"
  | "PUBLISHED"
  | "REJECTED";

export type Status = VerificationStatus;

export type ListingStatus =
  | "OPEN_FOR_OFFERS"
  | "CLOSED"
  | "SOLD"
  | "TERMINATED";

export type RoadAccess =
  | "BARANGAY_ROAD"
  | "NATIONAL_ROAD"
  | "PRIVATE_ROAD"
  | "NONE_SPECIFIED";

export type MarketplaceProperty = {
  id: number;
  title: string;
  description: string;
  propertyType: string;
  type: string;
  price: number;
  area: number;
  barangay: string;
  city: string;
  province: string;
  region: string;
  country: string;
  generalAddress: string;
  latitude: number;
  longitude: number;
  parcelBoundary?: [number, number][];
  roadAccess: RoadAccess;
  verificationStatus: VerificationStatus;
  status: VerificationStatus;
  listingStatus: ListingStatus;
  promoted?: boolean;
  seller: string;
  sellerEmail?: string;
  image: string;
  imagePosition?: string;
  verificationDate: string;
  verificationId: string;
  submitted?: string;
  submittedDocuments?: string[];
  promotionUntil?: string;
  promotionDays?: number;
  terminationReason?: string;
  terminatedBy?: string;
  terminatedAt?: string;
};

export type Property = MarketplaceProperty;

export const roadAccessLabel: Record<RoadAccess, string> = {
  BARANGAY_ROAD: "Accessible from Barangay Road",
  NATIONAL_ROAD: "Accessible from National Road",
  PRIVATE_ROAD: "Private road access",
  NONE_SPECIFIED: "Road access not specified",
};

export const getListingStatus = (property: MarketplaceProperty): ListingStatus =>
  property.listingStatus ||
  (property.status === "PUBLISHED" || property.verificationStatus === "VERIFIED"
    ? "OPEN_FOR_OFFERS"
    : "CLOSED");

export const isActiveListing = (property: MarketplaceProperty): boolean =>
  (property.status === "PUBLISHED" || property.verificationStatus === "VERIFIED") &&
  getListingStatus(property) === "OPEN_FOR_OFFERS";

/** True when a listing is promoted and its paid promotion window is still open. */
export const isPromotionActive = (property: MarketplaceProperty): boolean => {
  if (!property.promoted) return false;
  if (!property.promotionUntil) return true;
  return new Date(property.promotionUntil).getTime() > Date.now();
};

export const formatMoney = (value: number): string =>
  `₱${new Intl.NumberFormat("en-PH").format(value)}`;

export const money = formatMoney;

const rawBaseProperties = [
  {
    id: 1,
    title: "Quiet family lot near the city center",
    type: "Residential",
    barangay: "San Vicente",
    price: 2500000,
    area: 200,
    status: "PUBLISHED" as VerificationStatus,
    promoted: true,
    seller: "Maya Santos",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    imagePosition: "center",
    description: "A gently sloping residential lot in a growing Panabo neighborhood, close to everyday essentials.",
    latitude: 7.308,
    longitude: 125.684,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    parcelBoundary: [
      [7.309, 125.683],
      [7.309, 125.685],
      [7.307, 125.685],
      [7.307, 125.683],
    ] as [number, number][],
    verificationDate: "2026-08-12",
  },
  {
    id: 2,
    title: "Productive coconut land with road access",
    type: "Agricultural",
    barangay: "Cagangohan",
    price: 3900000,
    area: 1800,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Lio Navarro",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    description: "Productive agricultural land with road access and a calm rural setting in Panabo City.",
    latitude: 7.331,
    longitude: 125.676,
    roadAccess: "NATIONAL_ROAD" as RoadAccess,
    verificationDate: "2026-07-30",
  },
  {
    id: 3,
    title: "Corner parcel for a neighborhood shop",
    type: "Commercial",
    barangay: "Gredu",
    price: 5200000,
    area: 350,
    status: "PUBLISHED" as VerificationStatus,
    promoted: true,
    seller: "Celia Ramos",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    description: "A visible corner lot positioned for a small commercial build in an active Panabo district.",
    latitude: 7.3,
    longitude: 125.688,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-03",
  },
  {
    id: 4,
    title: "Family lot in a quiet neighborhood",
    type: "Residential",
    barangay: "New Pandan",
    price: 1800000,
    area: 160,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Noah Villanueva",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    description: "An accessible lot for a first home, with wide streets and established utilities nearby.",
    latitude: 7.315,
    longitude: 125.679,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-10",
  },
  {
    id: 5,
    title: "Open farm land with creek access",
    type: "Agricultural",
    barangay: "Kasilak",
    price: 2850000,
    area: 2500,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Rina Dela Cruz",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    description: "Open, practical land with water access and room for mixed agricultural use.",
    latitude: 7.322,
    longitude: 125.665,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-07-28",
  },
  {
    id: 6,
    title: "Warehouse-ready lot near the highway",
    type: "Industrial",
    barangay: "A.O. Floirendo",
    price: 7600000,
    area: 900,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Eli Mercado",
    image: "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1200&q=80",
    description: "A strategically placed Panabo parcel with vehicle access for logistics, storage, or light industry.",
    latitude: 7.295,
    longitude: 125.692,
    roadAccess: "NATIONAL_ROAD" as RoadAccess,
    verificationDate: "2026-08-01",
  },
  {
    id: 7,
    title: "Garden lot for a modern home",
    type: "Residential",
    barangay: "San Pedro",
    price: 3100000,
    area: 280,
    status: "UNDER_REVIEW" as VerificationStatus,
    seller: "Amara Reyes",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80",
    description: "A promising residential property submitted for YuTara review.",
    latitude: 7.317,
    longitude: 125.699,
    roadAccess: "NONE_SPECIFIED" as RoadAccess,
    verificationDate: "",
  },
  {
    id: 8,
    title: "Flat field beside a barangay road",
    type: "Agricultural",
    barangay: "Katipunan",
    price: 2100000,
    area: 1400,
    status: "NEEDS_CORRECTION" as VerificationStatus,
    seller: "Tomas Flores",
    image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1200&q=80",
    description: "Submitted land awaiting additional information from the seller.",
    latitude: 7.329,
    longitude: 125.688,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "",
  },
  {
    id: 9,
    title: "Small office site in a growing district",
    type: "Commercial",
    barangay: "J.P. Laurel",
    price: 8300000,
    area: 420,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Mara Lim",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    description: "A commercial site surrounded by new residential development in Panabo City.",
    latitude: 7.305,
    longitude: 125.681,
    roadAccess: "NATIONAL_ROAD" as RoadAccess,
    verificationDate: "2026-08-05",
  },
  {
    id: 10,
    title: "Eco-retreat parcel with bamboo grove",
    type: "Other",
    barangay: "Waterfall",
    price: 3400000,
    area: 1900,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Ira Bautista",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    description: "A spacious green parcel suited to a low-impact retreat concept.",
    latitude: 7.341,
    longitude: 125.658,
    roadAccess: "PRIVATE_ROAD" as RoadAccess,
    verificationDate: "2026-07-22",
  },
  {
    id: 11,
    title: "Starter lot close to local schools",
    type: "Residential",
    barangay: "Poblacion",
    price: 1950000,
    area: 180,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Nico Dizon",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    description: "A practical residential parcel within reach of schools and local services.",
    latitude: 7.302,
    longitude: 125.685,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-11",
  },
  {
    id: 12,
    title: "Wide farm parcel for mixed crops",
    type: "Agricultural",
    barangay: "San Francisco",
    price: 4700000,
    area: 3200,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Jessa Cruz",
    image: "https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=80",
    description: "A wide parcel with productive soil and room for a mixed-crop plan.",
    latitude: 7.319,
    longitude: 125.672,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-07-15",
  },
  {
    id: 13,
    title: "Visible roadside commercial lot",
    type: "Commercial",
    barangay: "New Malaga",
    price: 6400000,
    area: 500,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Rafi Torres",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    description: "A roadside commercial opportunity for a local retail or service concept.",
    latitude: 7.311,
    longitude: 125.695,
    roadAccess: "NATIONAL_ROAD" as RoadAccess,
    verificationDate: "2026-08-08",
  },
  {
    id: 14,
    title: "Light industrial parcel with access",
    type: "Industrial",
    barangay: "Mabuhay",
    price: 5900000,
    area: 1100,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Tina Valdez",
    image: "https://images.unsplash.com/photo-1586528116493-da8b7e4a7c2b?auto=format&fit=crop&w=1200&q=80",
    description: "A flexible parcel for light industrial or storage use within Panabo City.",
    latitude: 7.298,
    longitude: 125.679,
    roadAccess: "NATIONAL_ROAD" as RoadAccess,
    verificationDate: "2026-08-02",
  },
  {
    id: 15,
    title: "Residential lot with open views",
    type: "Residential",
    barangay: "San Roque",
    price: 2750000,
    area: 240,
    status: "PUBLISHED" as VerificationStatus,
    promoted: true,
    seller: "Lara Gomez",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    description: "A bright residential lot with open views and a quiet neighborhood feel.",
    latitude: 7.324,
    longitude: 125.69,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-14",
  },
  {
    id: 16,
    title: "Orchard parcel near farm roads",
    type: "Agricultural",
    barangay: "Cacao",
    price: 3600000,
    area: 2200,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Pia Santiago",
    image: "https://images.unsplash.com/photo-1464221315629-4d42f6b9f5f0?auto=format&fit=crop&w=1200&q=80",
    description: "An orchard-ready parcel with straightforward access to farm roads.",
    latitude: 7.336,
    longitude: 125.669,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-07-19",
  },
  {
    id: 17,
    title: "Compact lot for a local storefront",
    type: "Commercial",
    barangay: "New Malitbog",
    price: 4250000,
    area: 300,
    status: "UNDER_REVIEW" as VerificationStatus,
    seller: "Berto Lim",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    description: "A compact commercial lot currently in YuTara verification.",
    latitude: 7.307,
    longitude: 125.698,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "",
  },
  {
    id: 18,
    title: "Open parcel for storage use",
    type: "Industrial",
    barangay: "Lower Panaga",
    price: 6800000,
    area: 1250,
    status: "REJECTED" as VerificationStatus,
    seller: "Cora Medina",
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80",
    description: "A listing removed from the marketplace after review.",
    latitude: 7.345,
    longitude: 125.682,
    roadAccess: "PRIVATE_ROAD" as RoadAccess,
    verificationDate: "",
  },
  {
    id: 19,
    title: "Small homestead parcel",
    type: "Other",
    barangay: "Buenavista",
    price: 2200000,
    area: 700,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Nena Flores",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    description: "A flexible parcel for a small homestead or nature-oriented project.",
    latitude: 7.314,
    longitude: 125.661,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-04",
  },
  {
    id: 20,
    title: "Well-positioned family property",
    type: "Residential",
    barangay: "Santa Cruz",
    price: 2950000,
    area: 210,
    status: "PUBLISHED" as VerificationStatus,
    seller: "Miko Reyes",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    description: "A well-positioned family property in a growing Panabo community.",
    latitude: 7.309,
    longitude: 125.674,
    roadAccess: "BARANGAY_ROAD" as RoadAccess,
    verificationDate: "2026-08-09",
  },
];

const generatedAdditional = Array.from({ length: 10 }, (_, index) => {
  const source = rawBaseProperties[index % rawBaseProperties.length];
  const newId = 21 + index;
  const titles = [
    "Sunlit family parcel",
    "Harvest-ready farm lot",
    "Neighborhood trade site",
    "Flexible work yard",
    "Quiet garden property",
  ];
  return {
    ...source,
    id: newId,
    title: `${titles[index % 5]} ${index + 1}`,
    barangay: PANABO_BARANGAYS[(index + 12) % PANABO_BARANGAYS.length],
    price: source.price + (index + 1) * 125000,
    area: source.area + (index + 1) * 25,
    status: "PUBLISHED" as VerificationStatus,
    promoted: index === 2,
    latitude: 7.300 + ((index * 7) % 40) * 0.001,
    longitude: 125.660 + ((index * 9) % 40) * 0.001,
    verificationDate: "2026-08-15",
  };
});

const allRawProperties = [...rawBaseProperties, ...generatedAdditional];

export const MARKETPLACE_PROPERTIES: MarketplaceProperty[] = allRawProperties.map(
  (prop) => {
    const listingStatus: ListingStatus = [4, 10, 16, 19].includes(prop.id)
      ? "CLOSED"
      : [5, 12, 20].includes(prop.id)
        ? "SOLD"
        : [6, 14, 18].includes(prop.id)
          ? "TERMINATED"
          : "OPEN_FOR_OFFERS";

    const vStatus: VerificationStatus =
      prop.status === "PUBLISHED" ? "PUBLISHED" : prop.status;

    return {
      id: prop.id,
      title: prop.title,
      description: prop.description,
      propertyType: prop.type,
      type: prop.type,
      price: prop.price,
      area: prop.area,
      barangay: prop.barangay,
      city: YUTARA_SERVICE_AREA.city,
      province: YUTARA_SERVICE_AREA.province,
      region: YUTARA_SERVICE_AREA.region,
      country: YUTARA_SERVICE_AREA.country,
      generalAddress: "General location available upon inquiry",
      latitude: prop.latitude,
      longitude: prop.longitude,
      parcelBoundary: prop.parcelBoundary,
      roadAccess: prop.roadAccess || "BARANGAY_ROAD",
      verificationStatus: vStatus,
      status: vStatus,
      listingStatus,
      promoted: Boolean(prop.promoted),
      seller: prop.seller,
      image: prop.image,
      imagePosition: (prop as { imagePosition?: string }).imagePosition || "center",
      verificationDate: prop.verificationDate || "",
      verificationId: `YT-2026-${String(prop.id).padStart(6, "0")}`,
      submitted: "2026-08-01",
    };
  },
);

export const activeProperties: MarketplaceProperty[] = MARKETPLACE_PROPERTIES.filter(
  (property) => isActiveListing(property),
);

export function getProperty(id: string | number): MarketplaceProperty | undefined {
  const numericId = Number(id);
  return MARKETPLACE_PROPERTIES.find((property) => property.id === numericId);
}

export function getInitialProperties(): MarketplaceProperty[] {
  return [...MARKETPLACE_PROPERTIES];
}
