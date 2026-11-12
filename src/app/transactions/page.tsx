"use client";

import { useEffect, useState } from "react";
import { FileText, ArrowRight, Handshake } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DemoUser, getStoredSession } from "@/lib/demo-auth";
import {
  readTransactions,
  STAGE_LABEL,
  STAGE_ORDER,
  stageIndex,
  Transaction,
  recordSigning,
} from "@/lib/transactions";
import { readProperties } from "@/lib/property-store";
import type { MarketplaceProperty } from "@/lib/marketplace";
import { formatMoney } from "@/lib/marketplace";
import Link from "next/link";

const STAGE_PROGRESS_MAP: Record<string, number> = {
  AGREEMENT_CONFIRMED: 10,
  BOOKING_REQUESTED: 10,
  AGENCY_INTAKE: 20,
  AGENCY_REVIEW: 20,
  DOCUMENT_COLLECTION: 30,
  DOCUMENT_REVIEW: 40,
  PAYMENT_HELD: 40,
  DOCUMENT_COMPLETION: 50,
  DOCUMENTS_PREPARED: 50,
  DEED_PREPARATION: 60,
  DEED_EXECUTION: 70,
  PARTIES_SIGNED: 70,
  BIR_PROCESSING: 80,
  LOCAL_GOVERNMENT_PROCESSING: 85,
  REGISTRY_OF_DEEDS_PROCESSING: 90,
  FUNDS_RELEASED: 90,
  NEW_TITLE_ISSUANCE: 95,
  TAX_DECLARATION_UPDATE: 98,
  COMPLETED: 100,
};

export default function TransactionsPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<MarketplaceProperty[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ id: string; message: string; error?: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      const current = getStoredSession();
      setSession(current);
      const [txs, props] = await Promise.all([
        readTransactions(),
        readProperties(),
      ]);
      setTransactions(txs);
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
            <div className="eyebrow">My Transactions</div>
            <h1 className="display">My Transactions</h1>
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
            <div className="eyebrow">My Transactions</div>
            <h1 className="display">My Transactions</h1>
            <div className="empty-state">
              <FileText size={48} />
              <h3>Please sign in to view your transactions.</h3>
              <p>Sign in to track your land transfer progress.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userTransactions = transactions.filter(
    (tx) => tx.buyerId === session.email || tx.sellerId === session.email,
  );

  const propertyMap = new Map(properties.map((p: MarketplaceProperty) => [p.id, p]));

  const signTransaction = async (transaction: Transaction, party: "BUYER" | "SELLER") => {
    setActionNotice(null);
    try {
      const updated = await recordSigning(transaction.id, party, party);
      if (!updated) throw new Error("The transfer documents could not be signed. Refresh and try again.");
      setTransactions(await readTransactions());
      setActionNotice({ id: transaction.id, message: "Your signature has been recorded." });
    } catch (error) {
      setActionNotice({
        id: transaction.id,
        message: error instanceof Error ? error.message : "The transfer documents could not be signed.",
        error: true,
      });
    }
  };

  return (
    <div className="app-shell">
      <AppLayout
        session={session}
        pageTitle="My Transactions"
        showSearch={false}
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">My Transactions</div>
              <h1>My Transactions</h1>
              <p>
                Track your land transactions and transfer progress.
              </p>
            </div>
          </div>

          {userTransactions.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No transactions yet.</h3>
              <p>
                Your transactions will appear here once you have an active
                booking or purchase.
              </p>
              <Link href="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="tx-list">
              {userTransactions.map((tx) => {
                const property = propertyMap.get(tx.propertyId);
                const party = tx.buyerId === session.email
                  ? "BUYER"
                  : tx.sellerId === session.email
                    ? "SELLER"
                    : null;
                const signedByParty = party ? tx.signedBy.includes(party) : false;
                const documentsReady = tx.stage === "DOCUMENT_COLLECTION" || tx.stage === "DOCUMENTS_PREPARED";
                const currentStageIndex = stageIndex(tx.stage);
                const progress =
                  tx.stage === "CANCELLED" || tx.stage === "TERMINATED" || tx.stage === "ON_HOLD"
                    ? STAGE_PROGRESS_MAP[tx.stage] || 0
                    : STAGE_PROGRESS_MAP[tx.stage] ??
                      ((currentStageIndex + 1) / STAGE_ORDER.length) * 100;

                return (
                  <div key={tx.id} className="tx-card fade-up">
                    <div className="tx-card-head">
                      <div className="tx-card-image" style={{
                        backgroundImage: `url(${property?.image || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80"})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }} />
                      <div className="tx-card-main">
                        <h3>{tx.propertyTitle}</h3>
                        <p className="tx-seller">
                          {tx.buyerName} → {tx.sellerName}
                        </p>
                        <span className="tx-ref">
                          Ref: {tx.id}
                        </span>
                        <span className="tx-ref">
                          Current stage: {STAGE_LABEL[tx.stage]}
                        </span>
                      </div>
                      <div className="tx-card-amount">
                        <strong>{formatMoney(tx.salePrice || 0)}</strong>
                        <span className="tx-escrow">
                          Escrow held
                        </span>
                      </div>
                    </div>
                    <div className="tx-progress">
                      <div style={{ width: `${progress}%` }}></div>
                      {STAGE_ORDER.slice(0, 4).map((stageKey) => {
                        const stage = STAGE_LABEL[stageKey];
                        const isDone =
                          STAGE_ORDER.indexOf(stageKey) < currentStageIndex;
                        const isCurrent =
                          STAGE_ORDER.indexOf(stageKey) === currentStageIndex &&
                          tx.stage !== "CANCELLED" &&
                          tx.stage !== "TERMINATED" &&
                          tx.stage !== "ON_HOLD";
                        return (
                          <div
                            key={stageKey}
                            className={`tx-step ${
                              isDone ? "done" : isCurrent ? "active" : ""
                            }`}
                          >
                            <span className="tx-step-dot" />
                            <span className="tx-step-label">{stage}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="tx-card-actions">
                      {documentsReady && party && !signedByParty && (
                        <button
                          className="btn btn-primary btn-sm"
                          data-transaction-action={`sign-${party.toLowerCase()}`}
                          onClick={() => signTransaction(tx, party)}
                        >
                          <Handshake size={14} /> Sign transfer documents
                        </button>
                      )}
                      {documentsReady && signedByParty && (
                        <span className="tx-note">
                          You have signed. Awaiting the {party === "BUYER" ? "seller" : "buyer"}&apos;s signature.
                        </span>
                      )}
                      {actionNotice?.id === tx.id && (
                        <span role="status" className={actionNotice.error ? "form-error" : "tx-note tx-note-ok"}>
                          {actionNotice.message}
                        </span>
                      )}
                      <Link className="btn btn-ghost btn-sm" href={`/marketplace/${tx.propertyId}`}>
                        View Details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </div>
  );
}
