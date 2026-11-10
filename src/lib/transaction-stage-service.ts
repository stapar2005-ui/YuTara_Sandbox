import { SupabaseAdapter } from "./storage-adapter";
import { supabase } from "./supabase";

export type TransactionStage =
  | "AGREEMENT_CONFIRMED"
  | "AGENCY_INTAKE"
  | "DOCUMENT_COLLECTION"
  | "DOCUMENT_REVIEW"
  | "DOCUMENT_COMPLETION"
  | "DEED_PREPARATION"
  | "DEED_EXECUTION"
  | "BIR_PROCESSING"
  | "LOCAL_GOVERNMENT_PROCESSING"
  | "REGISTRY_OF_DEEDS_PROCESSING"
  | "NEW_TITLE_ISSUANCE"
  | "TAX_DECLARATION_UPDATE"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED"
  | "TERMINATED";

export type TransactionStageConfig = {
  id: string;
  stageName: string;
  description: string;
  order: number;
  required: boolean;
  responsibleParty: "BUYER" | "SELLER" | "AGENCY" | "JOINT";
  office?: "BIR" | "City Treasurer" | "Registry of Deeds" | "City Assessor" | "Other";
  defaultDeadlineDays?: number;
};

export type StageHistoryEntry = {
  id: string;
  transactionId: string;
  stage: TransactionStage;
  previousStage?: TransactionStage;
  changedBy: string;
  changedByRole: string;
  note: string;
  createdAt: string;
};

export type ProcessingStage = {
  id: string;
  transactionId: string;
  stage: TransactionStage;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "SKIPPED";
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  assignedTo?: string;
  assignedRole?: "BUYER" | "SELLER" | "AGENCY";
  nextAction?: string;
  agencyRemarks?: string;
  officeReferenceNumber?: string;
  officeSubmissionDate?: string;
  officeResponseDate?: string;
  supportingDocuments: string[];
  updatedAt: string;
};

export const PROCESSING_STAGES_KEY = "yutara-processing-stages";
export const STAGE_HISTORY_KEY = "yutara-stage-history";

export const PROCESSING_STAGES_EVENT = "yutara-processing-stages-change";
export const STAGE_HISTORY_EVENT = "yutara-stage-history-change";

const stageStorage = new SupabaseAdapter(supabase, PROCESSING_STAGES_KEY);
const historyStorage = new SupabaseAdapter(supabase, STAGE_HISTORY_KEY);

function emitStage(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROCESSING_STAGES_EVENT));
}
function emitHistory(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STAGE_HISTORY_EVENT));
}

/* ---------- Default Stage Config ---------- */

export const DEFAULT_STAGE_CONFIGS: TransactionStageConfig[] = [
  {
    id: "agreement_confirmed",
    stageName: "Agreement Confirmed",
    description: "Buyer and seller have agreed on the property transaction terms.",
    order: 1,
    required: true,
    responsibleParty: "JOINT",
  },
  {
    id: "agency_intake",
    stageName: "Agency Intake",
    description: "Agency receives the transaction and assigns a processor.",
    order: 2,
    required: true,
    responsibleParty: "AGENCY",
    defaultDeadlineDays: 3,
  },
  {
    id: "document_collection",
    stageName: "Document Collection",
    description:
      "Agency collects required documents from buyer, seller, and government offices.",
    order: 3,
    required: true,
    responsibleParty: "JOINT",
    defaultDeadlineDays: 14,
  },
  {
    id: "document_review",
    stageName: "Document Review",
    description:
      "Agency reviews submitted documents for completeness and accuracy.",
    order: 4,
    required: true,
    responsibleParty: "AGENCY",
    defaultDeadlineDays: 7,
  },
  {
    id: "document_completion",
    stageName: "Document Completion",
    description:
      "Any missing or rejected documents are resubmitted and finalized.",
    order: 5,
    required: true,
    responsibleParty: "JOINT",
    defaultDeadlineDays: 7,
  },
  {
    id: "deed_preparation",
    stageName: "Deed Preparation",
    description:
      "Agency prepares the Deed of Absolute Sale and supporting transfer documents.",
    order: 6,
    required: true,
    responsibleParty: "AGENCY",
    defaultDeadlineDays: 5,
  },
  {
    id: "deed_execution",
    stageName: "Deed Execution",
    description:
      "Buyer and seller sign the deed before a notary public.",
    order: 7,
    required: true,
    responsibleParty: "JOINT",
    defaultDeadlineDays: 5,
  },
  {
    id: "bir_processing",
    stageName: "BIR Processing",
    description:
      "Capital gains tax and documentary stamp tax computation and filing with BIR.",
    order: 8,
    required: true,
    responsibleParty: "AGENCY",
    office: "BIR",
    defaultDeadlineDays: 30,
  },
  {
    id: "local_government_processing",
    stageName: "Local Government Processing",
    description:
      "Transfer tax and documentary stamp tax payment with city/municipal treasurer.",
    order: 9,
    required: true,
    responsibleParty: "AGENCY",
    office: "City Treasurer",
    defaultDeadlineDays: 15,
  },
  {
    id: "registry_of_deeds_processing",
    stageName: "Registry of Deeds Processing",
    description:
      "Submission of documents to the Registry of Deeds for title transfer annotation.",
    order: 10,
    required: true,
    responsibleParty: "AGENCY",
    office: "Registry of Deeds",
    defaultDeadlineDays: 30,
  },
  {
    id: "new_title_issuance",
    stageName: "New Title Issuance",
    description:
      "Registry of Deeds issues a new title in the buyer's name.",
    order: 11,
    required: true,
    responsibleParty: "AGENCY",
    office: "Registry of Deeds",
    defaultDeadlineDays: 15,
  },
  {
    id: "tax_declaration_update",
    stageName: "Tax Declaration Update",
    description:
      "Update tax declaration with the City Assessor's Office under the new owner.",
    order: 12,
    required: true,
    responsibleParty: "AGENCY",
    office: "City Assessor",
    defaultDeadlineDays: 15,
  },
  {
    id: "completed",
    stageName: "Completed",
    description: "Land transfer is fully completed and registered.",
    order: 13,
    required: true,
    responsibleParty: "AGENCY",
  },
];

export const STAGE_ORDER: TransactionStage[] = [
  "AGREEMENT_CONFIRMED",
  "AGENCY_INTAKE",
  "DOCUMENT_COLLECTION",
  "DOCUMENT_REVIEW",
  "DOCUMENT_COMPLETION",
  "DEED_PREPARATION",
  "DEED_EXECUTION",
  "BIR_PROCESSING",
  "LOCAL_GOVERNMENT_PROCESSING",
  "REGISTRY_OF_DEEDS_PROCESSING",
  "NEW_TITLE_ISSUANCE",
  "TAX_DECLARATION_UPDATE",
  "COMPLETED",
];

export const STAGE_LABEL: Record<TransactionStage, string> = {
  AGREEMENT_CONFIRMED: "Agreement Confirmed",
  AGENCY_INTAKE: "Agency Intake",
  DOCUMENT_COLLECTION: "Document Collection",
  DOCUMENT_REVIEW: "Document Review",
  DOCUMENT_COMPLETION: "Document Completion",
  DEED_PREPARATION: "Deed Preparation",
  DEED_EXECUTION: "Deed Execution",
  BIR_PROCESSING: "BIR Processing",
  LOCAL_GOVERNMENT_PROCESSING: "Local Government Processing",
  REGISTRY_OF_DEEDS_PROCESSING: "Registry of Deeds Processing",
  NEW_TITLE_ISSUANCE: "New Title Issuance",
  TAX_DECLARATION_UPDATE: "Tax Declaration Update",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
  TERMINATED: "Terminated",
};

export const STAGE_COLOR: Record<TransactionStage, string> = {
  AGREEMENT_CONFIRMED: "#166534",
  AGENCY_INTAKE: "#166534",
  DOCUMENT_COLLECTION: "#d97706",
  DOCUMENT_REVIEW: "#d97706",
  DOCUMENT_COMPLETION: "#d97706",
  DEED_PREPARATION: "#15803d",
  DEED_EXECUTION: "#15803d",
  BIR_PROCESSING: "#15803d",
  LOCAL_GOVERNMENT_PROCESSING: "#15803d",
  REGISTRY_OF_DEEDS_PROCESSING: "#15803d",
  NEW_TITLE_ISSUANCE: "#166534",
  TAX_DECLARATION_UPDATE: "#16653d",
  COMPLETED: "#166534",
  ON_HOLD: "#d97706",
  CANCELLED: "#b91c1c",
  TERMINATED: "#b91c1c",
};

export function stageIndex(stage: TransactionStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/* ---------- Processing Stages CRUD ---------- */

export async function readProcessingStages(
  transactionId?: string
): Promise<ProcessingStage[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await stageStorage.getItem<ProcessingStage[]>(
      PROCESSING_STAGES_KEY
    );
    if (!stored) return [];
    return transactionId
      ? stored.filter((item) => item.transactionId === transactionId)
      : stored;
  } catch {
    return [];
  }
}

export async function createProcessingStage(input: {
  transactionId: string;
  stage: TransactionStage;
  status?: ProcessingStage["status"];
  deadline?: string;
  assignedTo?: string;
  assignedRole?: ProcessingStage["assignedRole"];
  nextAction?: string;
}): Promise<ProcessingStage> {
  const all = await readProcessingStages();
  const exists = all.find(
    (item) => item.transactionId === input.transactionId && item.stage === input.stage,
  );
  if (exists) return exists;

  const stage: ProcessingStage = {
    id: `YT-STG-${String(Date.now()).slice(-6)}`,
    transactionId: input.transactionId,
    stage: input.stage,
    status: input.status ?? "NOT_STARTED",
    startedAt: input.status === "IN_PROGRESS" ? new Date().toISOString() : undefined,
    deadline: input.deadline,
    assignedTo: input.assignedTo,
    assignedRole: input.assignedRole,
    nextAction: input.nextAction,
    supportingDocuments: [],
    updatedAt: new Date().toISOString(),
  };
  await stageStorage.setItem(PROCESSING_STAGES_KEY, [...all, stage]);
  emitStage();
  return stage;
}

export async function updateProcessingStage(
  id: string,
  patch: Partial<ProcessingStage>
): Promise<ProcessingStage | null> {
  const all = await readProcessingStages();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated: ProcessingStage = {
    ...all[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await stageStorage.setItem(PROCESSING_STAGES_KEY, all);
  emitStage();
  return updated;
}

/* ---------- Stage History ---------- */

export async function readStageHistory(
  transactionId?: string
): Promise<StageHistoryEntry[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await historyStorage.getItem<StageHistoryEntry[]>(
      STAGE_HISTORY_KEY
    );
    if (!stored) return [];
    return transactionId
      ? stored.filter((item) => item.transactionId === transactionId)
      : stored;
  } catch {
    return [];
  }
}

export async function addStageHistoryEntry(input: {
  transactionId: string;
  stage: TransactionStage;
  previousStage?: TransactionStage;
  changedBy: string;
  changedByRole: string;
  note: string;
}): Promise<StageHistoryEntry> {
  const all = await readStageHistory();
  const entry: StageHistoryEntry = {
    id: `YT-HIST-${String(Date.now()).slice(-6)}`,
    transactionId: input.transactionId,
    stage: input.stage,
    previousStage: input.previousStage,
    changedBy: input.changedBy,
    changedByRole: input.changedByRole,
    note: input.note,
    createdAt: new Date().toISOString(),
  };
  await historyStorage.setItem(STAGE_HISTORY_KEY, [entry, ...all]);
  emitHistory();
  return entry;
}
