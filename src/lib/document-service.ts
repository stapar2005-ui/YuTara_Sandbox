import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type DocumentStatus =
  | "NOT_REQUESTED"
  | "REQUESTED"
  | "PENDING_SUBMISSION"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED"
  | "ADDITIONAL_DOCUMENT_REQUIRED"
  | "WAIVED";

export type DocumentCategory =
  | "BUYER"
  | "SELLER"
  | "AGENCY"
  | "GOVERNMENT_OFFICE"
  | "OTHER";

export type DocumentRequirement = {
  id: string;
  transactionId: string;
  requirementName: string;
  description: string;
  responsibleParty: DocumentCategory;
  issuingOffice?: string;
  required: boolean;
  submissionDeadline?: string;
  status: DocumentStatus;
  agencyRemarks?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

export type TransactionDocument = {
  id: string;
  requirementId: string;
  transactionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: string;
  isPrivate: boolean;
  description?: string;
};

export type DocumentReview = {
  id: string;
  documentId: string;
  transactionId: string;
  reviewerId: string;
  reviewerRole: string;
  status: DocumentStatus;
  remarks: string;
  reviewedAt: string;
  previousStatus: DocumentStatus;
};

export const DOCUMENT_REQUIREMENTS_KEY = "yutara-document-requirements";
export const TRANSACTION_DOCUMENTS_KEY = "yutara-transaction-documents";
export const DOCUMENT_REVIEWS_KEY = "yutara-document-reviews";

export const DOCUMENT_REQUIREMENTS_EVENT = "yutara-document-requirements-change";
export const TRANSACTION_DOCUMENTS_EVENT = "yutara-transaction-documents-change";
export const DOCUMENT_REVIEWS_EVENT = "yutara-document-reviews-change";

const reqStorage = new SupabaseAdapter(supabase, DOCUMENT_REQUIREMENTS_KEY);
const docStorage = new SupabaseAdapter(supabase, TRANSACTION_DOCUMENTS_KEY);
const reviewStorage = new SupabaseAdapter(supabase, DOCUMENT_REVIEWS_KEY);

function emitReq(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DOCUMENT_REQUIREMENTS_EVENT));
}
function emitDoc(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTION_DOCUMENTS_EVENT));
}
function emitReview(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DOCUMENT_REVIEWS_EVENT));
}

/* ---------- Document Requirements ---------- */

export async function readDocumentRequirements(
  transactionId?: string
): Promise<DocumentRequirement[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await reqStorage.getItem<DocumentRequirement[]>(
      DOCUMENT_REQUIREMENTS_KEY
    );
    if (!stored) return [];
    return transactionId
      ? stored.filter((item) => item.transactionId === transactionId)
      : stored;
  } catch {
    return [];
  }
}

export async function createDocumentRequirement(input: {
  transactionId: string;
  requirementName: string;
  description: string;
  responsibleParty: DocumentCategory;
  issuingOffice?: string;
  required?: boolean;
  submissionDeadline?: string;
  status?: DocumentStatus;
  agencyRemarks?: string;
  createdBy?: string;
}): Promise<DocumentRequirement> {
  const all = await readDocumentRequirements();
  const req: DocumentRequirement = {
    id: `YT-REQ-${String(Date.now()).slice(-6)}`,
    transactionId: input.transactionId,
    requirementName: input.requirementName,
    description: input.description,
    responsibleParty: input.responsibleParty,
    issuingOffice: input.issuingOffice,
    required: input.required ?? true,
    submissionDeadline: input.submissionDeadline,
    status: input.status ?? "NOT_REQUESTED",
    agencyRemarks: input.agencyRemarks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
  await reqStorage.setItem(DOCUMENT_REQUIREMENTS_KEY, [...all, req]);
  emitReq();
  return req;
}

export async function updateDocumentRequirement(
  id: string,
  patch: Partial<DocumentRequirement>
): Promise<DocumentRequirement | null> {
  const all = await readDocumentRequirements();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated: DocumentRequirement = {
    ...all[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await reqStorage.setItem(DOCUMENT_REQUIREMENTS_KEY, all);
  emitReq();
  return updated;
}

export async function deleteDocumentRequirement(id: string): Promise<boolean> {
  const all = await readDocumentRequirements();
  const next = all.filter((item) => item.id !== id);
  if (next.length === all.length) return false;
  await reqStorage.setItem(DOCUMENT_REQUIREMENTS_KEY, next);
  emitReq();
  return true;
}

/* ---------- Transaction Documents ---------- */

export async function readTransactionDocuments(
  transactionId?: string
): Promise<TransactionDocument[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await docStorage.getItem<TransactionDocument[]>(
      TRANSACTION_DOCUMENTS_KEY
    );
    if (!stored) return [];
    return transactionId
      ? stored.filter((item) => item.transactionId === transactionId)
      : stored;
  } catch {
    return [];
  }
}

export async function createTransactionDocument(input: {
  requirementId: string;
  transactionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByRole: string;
  isPrivate: boolean;
  description?: string;
}): Promise<TransactionDocument> {
  const all = await readTransactionDocuments();
  const existingForReq = all.filter(
    (item) => item.requirementId === input.requirementId
  );
  const version = existingForReq.length > 0
    ? Math.max(...existingForReq.map((item) => item.version)) + 1
    : 1;

  const doc: TransactionDocument = {
    id: `YT-DOC-${String(Date.now()).slice(-6)}`,
    requirementId: input.requirementId,
    transactionId: input.transactionId,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    version,
    uploadedBy: input.uploadedBy,
    uploadedByRole: input.uploadedByRole,
    uploadedAt: new Date().toISOString(),
    isPrivate: input.isPrivate,
    description: input.description,
  };
  await docStorage.setItem(TRANSACTION_DOCUMENTS_KEY, [...all, doc]);
  emitDoc();
  return doc;
}

/* ---------- Document Reviews ---------- */

export async function readDocumentReviews(
  transactionId?: string
): Promise<DocumentReview[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await reviewStorage.getItem<DocumentReview[]>(
      DOCUMENT_REVIEWS_KEY
    );
    if (!stored) return [];
    return transactionId
      ? stored.filter((item) => item.transactionId === transactionId)
      : stored;
  } catch {
    return [];
  }
}

export async function createDocumentReview(input: {
  documentId: string;
  transactionId: string;
  reviewerId: string;
  reviewerRole: string;
  status: DocumentStatus;
  remarks: string;
  previousStatus: DocumentStatus;
}): Promise<DocumentReview> {
  const all = await readDocumentReviews();
  const review: DocumentReview = {
    id: `YT-REV-${String(Date.now()).slice(-6)}`,
    documentId: input.documentId,
    transactionId: input.transactionId,
    reviewerId: input.reviewerId,
    reviewerRole: input.reviewerRole,
    status: input.status,
    remarks: input.remarks,
    reviewedAt: new Date().toISOString(),
    previousStatus: input.previousStatus,
  };
  await reviewStorage.setItem(DOCUMENT_REVIEWS_KEY, [...all, review]);
  emitReview();
  return review;
}
