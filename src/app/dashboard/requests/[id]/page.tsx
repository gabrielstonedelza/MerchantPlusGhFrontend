"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getRequestDetail, approveRequest, AgentRequest, ApiError } from "@/lib/api";
import Link from "next/link";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-dark-400/60 last:border-0">
      <span className="text-xs text-dark-300 uppercase tracking-wide shrink-0 w-40">{label}</span>
      <span className="text-sm text-dark-50 text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wide mb-1">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<AgentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    async function load() {
      const companyId = localStorage.getItem("companyId") || "";
      if (!companyId) return;
      try {
        const data = await getRequestDetail(companyId, id);
        setRequest(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleApprove() {
    setActionLoading(true);
    setError("");
    const companyId = localStorage.getItem("companyId") || "";
    try {
      const updated = await approveRequest(companyId, id, "approve");
      setRequest(updated);
      setDone("approved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setActionLoading(true);
    setError("");
    const companyId = localStorage.getItem("companyId") || "";
    try {
      const updated = await approveRequest(companyId, id, "reject", rejectionReason.trim());
      setRequest(updated);
      setDone("rejected");
      setShowRejectModal(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-dark-300">Request not found.</p>
        <Link href="/dashboard/requests" className="text-sm text-gold hover:underline">
          ← Back to requests
        </Link>
      </div>
    );
  }

  const isPending = request.status === "pending";
  const isDeposit = request.transaction_type === "deposit";
  const isWithdrawal = request.transaction_type === "withdrawal";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/requests" className="text-xs text-dark-400 hover:text-dark-200 transition-colors">
            ← Requests
          </Link>
          <h1 className="text-xl font-bold text-dark-50 mt-1">{request.reference}</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Success banner */}
      {done && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          done === "approved"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {done === "approved" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          <p className="text-sm font-medium">
            Request has been {done}. The agent has been notified.
          </p>
          <button
            onClick={() => router.push("/dashboard/requests")}
            className="ml-auto text-xs underline opacity-70 hover:opacity-100"
          >
            Back to list
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Core details */}
      <Section title="Request Details">
        <DetailRow label="Reference" value={request.reference} />
        <DetailRow label="Type" value={<span className="capitalize">{request.transaction_type}</span>} />
        <DetailRow label="Channel" value={<span className="capitalize">{request.channel.replace("_", " ")}</span>} />
        <DetailRow label="Status" value={<StatusBadge status={request.status} />} />
        <DetailRow
          label="Amount"
          value={
            <span className={`font-bold ${isDeposit ? "text-emerald-400" : isWithdrawal ? "text-red-400" : ""}`}>
              {isDeposit ? "+" : isWithdrawal ? "-" : ""}
              GHS {Number(request.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          }
        />
        <DetailRow
          label="Fee"
          value={`GHS ${Number(request.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <DetailRow label="Customer" value={request.customer_name || "Walk-in"} />
        <DetailRow
          label="Requested At"
          value={new Date(request.requested_at).toLocaleString()}
        />
        {request.requires_approval && (
          <DetailRow label="Requires Approval" value="Yes" />
        )}
      </Section>

      {/* Bank Deposit Details */}
      {request.bank_deposit_detail && (
        <Section title="Bank Deposit Details">
          <DetailRow label="Bank Name" value={request.bank_deposit_detail.bank_name} />
          <DetailRow label="Account Number" value={request.bank_deposit_detail.account_number} />
          <DetailRow label="Account Name" value={request.bank_deposit_detail.account_name} />
          <DetailRow label="Depositor Name" value={request.bank_deposit_detail.depositor_name} />
          <DetailRow label="Slip Number" value={request.bank_deposit_detail.slip_number} />
          {request.bank_deposit_detail.slip_image && (
            <div className="pt-3">
              <p className="text-xs text-dark-300 uppercase tracking-wide mb-2">Deposit Slip</p>
              <img
                src={request.bank_deposit_detail.slip_image}
                alt="Deposit slip"
                className="max-w-xs rounded-lg border border-dark-400"
              />
            </div>
          )}
        </Section>
      )}

      {/* MoMo Details */}
      {request.momo_detail && (
        <Section title="Mobile Money Details">
          <DetailRow label="Network" value={<span className="uppercase">{request.momo_detail.network}</span>} />
          <DetailRow label="Service Type" value={<span className="capitalize">{request.momo_detail.service_type.replace("_", " ")}</span>} />
          <DetailRow label="Sender Number" value={request.momo_detail.sender_number || "—"} />
          <DetailRow label="Receiver Number" value={request.momo_detail.receiver_number || "—"} />
          <DetailRow label="MoMo Reference" value={request.momo_detail.momo_reference} />
        </Section>
      )}

      {/* Cash Details */}
      {request.cash_detail && (
        <Section title="Cash Breakdown">
          {(
            [
              ["GHS 200", request.cash_detail.d_200],
              ["GHS 100", request.cash_detail.d_100],
              ["GHS 50", request.cash_detail.d_50],
              ["GHS 20", request.cash_detail.d_20],
              ["GHS 10", request.cash_detail.d_10],
              ["GHS 5", request.cash_detail.d_5],
              ["GHS 2", request.cash_detail.d_2],
              ["GHS 1", request.cash_detail.d_1],
            ] as [string, number][]
          )
            .filter(([, qty]) => qty > 0)
            .map(([denom, qty]) => (
              <DetailRow key={denom} label={denom} value={`× ${qty}`} />
            ))}
          <DetailRow label="Total" value={`GHS ${Number(request.cash_detail.denomination_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        </Section>
      )}

      {/* Approval info (if already actioned) */}
      {(request.approved_by_name || request.rejection_reason) && (
        <Section title="Action Details">
          {request.approved_by_name && (
            <DetailRow label="Actioned By" value={request.approved_by_name} />
          )}
          {request.approved_at && (
            <DetailRow label="Actioned At" value={new Date(request.approved_at).toLocaleString()} />
          )}
          {request.rejection_reason && (
            <DetailRow label="Rejection Reason" value={request.rejection_reason} />
          )}
        </Section>
      )}

      {/* Action Buttons */}
      {isPending && !done && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {actionLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Approve
          </button>
          <button
            onClick={() => { setShowRejectModal(true); setError(""); }}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-dark-600 border border-dark-400 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-dark-50">Reject Request</h2>
            <p className="text-sm text-dark-300">
              Please provide a reason. The agent will be notified with this message.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete documentation, amount mismatch…"
              className="w-full bg-dark-500 border border-dark-400 rounded-lg px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-red-500 resize-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(""); setError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-dark-400 text-dark-200 hover:text-dark-50 hover:border-dark-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm"
              >
                {actionLoading ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
