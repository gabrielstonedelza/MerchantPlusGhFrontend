"use client";

import { useEffect, useState, useCallback } from "react";
import { getPendingRequests, getTransactions, AgentRequest } from "@/lib/api";
import Link from "next/link";

type Tab = "pending" | "all";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<AgentRequest[]>([]);
  const [all, setAll] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const companyId = localStorage.getItem("companyId") || "";
    if (!companyId) return;
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingRequests(companyId),
        getTransactions(companyId),
      ]);
      setPending(pendingData.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()));
      setAll(allData.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()));
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = tab === "pending" ? pending : all;
  const filtered = search.trim()
    ? rows.filter((r) =>
        r.reference.toLowerCase().includes(search.toLowerCase()) ||
        (r.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        r.transaction_type.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Agent Requests</h1>
          <p className="text-dark-200 text-sm mt-1">Review and approve requests from your agents</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-dark-300 hover:text-dark-50 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-dark-600 border border-dark-400 rounded-lg p-1">
          <button
            onClick={() => setTab("pending")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "pending"
                ? "bg-amber-500/20 text-amber-400"
                : "text-dark-300 hover:text-dark-50"
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-400">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "all"
                ? "bg-dark-500 text-dark-50"
                : "text-dark-300 hover:text-dark-50"
            }`}
          >
            All Requests
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by reference, customer, or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-dark-200"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-dark-500 border border-dark-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-dark-300 text-sm">
              {search ? "No requests match your search" : tab === "pending" ? "No pending requests" : "No requests found"}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_6rem] gap-4 px-4 py-2.5 border-b border-dark-400 bg-dark-600">
              <div />
              <p className="text-xs text-dark-300 uppercase tracking-wide">Reference</p>
              <p className="text-xs text-dark-300 uppercase tracking-wide">Customer</p>
              <p className="text-xs text-dark-300 uppercase tracking-wide">Type / Channel</p>
              <p className="text-xs text-dark-300 uppercase tracking-wide text-right">Amount</p>
              <p className="text-xs text-dark-300 uppercase tracking-wide text-right">Time</p>
            </div>

            <div className="divide-y divide-dark-400/60">
              {filtered.map((req) => (
                <RequestRow key={req.id} req={req} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RequestRow({ req }: { req: AgentRequest }) {
  const isDeposit = req.transaction_type === "deposit";
  const isWithdrawal = req.transaction_type === "withdrawal";

  return (
    <Link
      href={`/dashboard/requests/${req.id}`}
      className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_6rem] gap-4 px-4 py-3 hover:bg-dark-500/40 transition-colors items-center group"
    >
      {/* Type icon */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        isDeposit
          ? "bg-emerald-900/50 text-emerald-400"
          : isWithdrawal
          ? "bg-red-900/50 text-red-400"
          : "bg-blue-900/50 text-blue-400"
      }`}>
        {isDeposit ? "D" : isWithdrawal ? "W" : "T"}
      </div>

      {/* Reference */}
      <div>
        <p className="text-sm font-medium text-dark-50 group-hover:text-white">{req.reference}</p>
        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}>
          {req.status}
        </span>
      </div>

      {/* Customer */}
      <p className="text-sm text-dark-200 truncate">{req.customer_name || "Walk-in"}</p>

      {/* Type / Channel */}
      <div>
        <p className="text-sm text-dark-200 capitalize">{req.transaction_type}</p>
        <p className="text-xs text-dark-400 capitalize">{req.channel.replace("_", " ")}</p>
      </div>

      {/* Amount */}
      <p className={`text-sm font-bold text-right ${
        isDeposit ? "text-emerald-400" : isWithdrawal ? "text-red-400" : "text-dark-50"
      }`}>
        {isDeposit ? "+" : isWithdrawal ? "-" : ""}
        GHS {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>

      {/* Time */}
      <p className="text-xs text-dark-300 text-right">{timeAgo(req.requested_at)}</p>
    </Link>
  );
}
