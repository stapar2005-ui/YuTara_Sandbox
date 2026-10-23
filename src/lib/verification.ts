export type OfficeCheckStatus =
  | "PENDING"
  | "CLEARED"
  | "DISCREPANCY"
  | "NOT_FOUND";

export type OfficeCheck = {
  id: string;
  office: string;
  scope: string;
  status: OfficeCheckStatus;
  response: string;
  requestedAt?: string;
  checkedAt?: string;
};

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type DocumentReview = {
  key: string;
  name: string;
  required: boolean;
  status: DocumentStatus;
  note: string;
};

export type VerificationDecision =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_CORRECTION";

export type VerificationRecord = {
  propertyId: number;
  documents: DocumentReview[];
  checks: OfficeCheck[];
  decision: VerificationDecision;
  decisionNote: string;
  updatedAt: string;
};

export const VERIFICATION_KEY = "yutara-verifications";
export const VERIFICATION_EVENT = "yutara-verifications-change";

const OFFICE_TEMPLATE: { id: string; office: string; scope: string }[] = [
  {
    id: "rd",
    office: "Registry of Deeds",
    scope: "Title authenticity, annotations, and encumbrances",
  },
  {
    id: "assessor",
    office: "City Assessor's Office",
    scope: "Tax declaration and assessed value",
  },
  {
    id: "bir",
    office: "BIR Revenue District Office",
    scope: "Tax clearance and capital gains obligations",
  },
  {
    id: "lra",
    office: "Land Registration Authority",
    scope: "Certificate of title verification",
  },
  {
    id: "planning",
    office: "City Planning & Development Office",
    scope: "Zoning and land-use classification",
  },
  {
    id: "barangay",
    office: "Barangay Hall",
    scope: "Actual location and tax mapping reference",
  },
];

const DOCUMENT_TEMPLATE: { key: string; name: string; required: boolean }[] = [
  { key: "title", name: "Ownership / title document", required: true },
  { key: "tax", name: "Tax Declaration", required: true },
  { key: "id", name: "Seller valid government ID", required: true },
  { key: "authority", name: "Authority to Sell", required: false },
  { key: "supporting", name: "Supporting property document", required: false },
];

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VERIFICATION_EVENT));
}

export function readVerificationRecords(): VerificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VERIFICATION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is VerificationRecord =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof item.propertyId === "number" &&
            Array.isArray(item.documents) &&
            Array.isArray(item.checks),
        ),
    );
  } catch {
    return [];
  }
}

function writeVerificationRecords(records: VerificationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VERIFICATION_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
  emit();
}

export function defaultVerificationRecord(
  propertyId: number,
): VerificationRecord {
  return {
    propertyId,
    documents: DOCUMENT_TEMPLATE.map((document) => ({
      ...document,
      status: "PENDING",
      note: "",
    })),
    checks: OFFICE_TEMPLATE.map((check) => ({
      ...check,
      status: "PENDING",
      response: "",
    })),
    decision: "PENDING",
    decisionNote: "",
    updatedAt: new Date().toISOString(),
  };
}

export function getVerificationRecord(
  propertyId: number,
): VerificationRecord {
  const existing = readVerificationRecords().find(
    (record) => record.propertyId === propertyId,
  );
  return existing || defaultVerificationRecord(propertyId);
}

export function saveVerificationRecord(
  record: VerificationRecord,
): VerificationRecord {
  const records = readVerificationRecords();
  const index = records.findIndex(
    (item) => item.propertyId === record.propertyId,
  );
  const next = { ...record, updatedAt: new Date().toISOString() };
  if (index >= 0) records[index] = next;
  else records.push(next);
  writeVerificationRecords(records);
  return next;
}

export function isReadyForApproval(record: VerificationRecord): boolean {
  // Approval requires the required documents to be reviewed and verified.
  // Office checks are recorded for the audit trail but do not block publishing.
  return record.documents
    .filter((document) => document.required)
    .every((document) => document.status === "VERIFIED");
}

export function verificationProgress(record: VerificationRecord): number {
  const items = [...record.documents, ...record.checks];
  if (!items.length) return 0;
  const done = items.filter((item) =>
    item.status === "VERIFIED" || item.status === "CLEARED",
  ).length;
  return Math.round((done / items.length) * 100);
}

export function recordOfficeResponse(
  record: VerificationRecord,
  checkId: string,
  status: OfficeCheckStatus,
  response: string,
): VerificationRecord {
  return {
    ...record,
    checks: record.checks.map((check) =>
      check.id === checkId
        ? {
            ...check,
            status,
            response,
            checkedAt: new Date().toISOString(),
          }
        : check,
    ),
  };
}

export function setDocumentStatus(
  record: VerificationRecord,
  key: string,
  status: DocumentStatus,
  note?: string,
): VerificationRecord {
  return {
    ...record,
    documents: record.documents.map((document) =>
      document.key === key
        ? { ...document, status, note: note ?? document.note }
        : document,
    ),
  };
}

export function formatCheckDate(value?: string): string {
  if (!value) return "Awaiting response";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting response";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
