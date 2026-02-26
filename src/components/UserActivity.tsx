"use client";

import { useMemo } from "react";
import { AgentRequest } from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserActivity({ transactions }: { transactions: AgentRequest[] }) {
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalVolume = 0;
    let lastAt: string | null = null;

    for (const tx of transactions) {
      if (tx.status === "pending") pending++;
      else if (tx.status === "approved" || tx.status === "completed") approved++;
      else if (tx.status === "rejected") rejected++;
      totalVolume += parseFloat(tx.amount || "0");
      if (
        tx.requested_at &&
        (!lastAt || new Date(tx.requested_at) > new Date(lastAt))
      ) {
        lastAt = tx.requested_at;
      }
    }

    // Channel breakdown
    const byChannel: Record<string, number> = {};
    for (const tx of transactions) {
      byChannel[tx.channel] = (byChannel[tx.channel] || 0) + 1;
    }

    // Type breakdown
    const byType: Record<string, number> = {};
    for (const tx of transactions) {
      byType[tx.transaction_type] = (byType[tx.transaction_type] || 0) + 1;
    }

    return { pending, approved, rejected, totalVolume, lastAt, byChannel, byType };
  }, [transactions]);

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-dark-50">Request Summary</h2>
          <p className="text-xs text-dark-300 mt-0.5">Today&apos;s overview</p>
        </div>
        <span className="text-xs text-dark-300 bg-dark-500 border border-dark-400 px-2.5 py-1 rounded-full">
          {transactions.length} total
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center flex-1">
          <div className="w-12 h-12 rounded-full bg-dark-500 border border-dark-400 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-dark-300 text-sm">No requests yet today</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Status breakdown */}
          <div className="space-y-2">
            <p className="text-xs text-dark-300 uppercase tracking-wide">By Status</p>
            <StatusBar label="Pending" count={stats.pending} total={transactions.length} color="amber" />
            <StatusBar label="Approved" count={stats.approved} total={transactions.length} color="emerald" />
            <StatusBar label="Rejected" count={stats.rejected} total={transactions.length} color="red" />
          </div>

          {/* Volume */}
          <div className="p-3 rounded-xl bg-dark-500/40 border border-dark-400/60">
            <p className="text-xs text-dark-300">Total Volume</p>
            <p className="text-lg font-bold text-dark-50 mt-0.5">
              GHS {stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Channel breakdown */}
          {Object.keys(stats.byChannel).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-dark-300 uppercase tracking-wide">By Channel</p>
              {Object.entries(stats.byChannel).map(([ch, count]) => (
                <div key={ch} className="flex items-center justify-between text-sm">
                  <span className="text-dark-200 capitalize">{ch.replace("_", " ")}</span>
                  <span className="text-dark-50 font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Last request */}
          {stats.lastAt && (
            <p className="text-xs text-dark-400 pt-2 border-t border-dark-400/60">
              Last request {timeAgo(stats.lastAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "amber" | "emerald" | "red";
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const barColor = {
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    red: "bg-red-400",
  }[color];
  const textColor = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
  }[color];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dark-300 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-dark-400 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-6 text-right ${textColor}`}>{count}</span>
    </div>
  );
}
