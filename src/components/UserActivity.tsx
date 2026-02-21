"use client";

import { useMemo } from "react";
import { Transaction } from "@/lib/api";

interface AgentStats {
  name: string;
  transactionCount: number;
  totalVolume: number;
  completedCount: number;
  pendingCount: number;
  lastActivityAt: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserActivity({ transactions }: { transactions: Transaction[] }) {
  const agents = useMemo<AgentStats[]>(() => {
    const map = new Map<string, AgentStats>();

    for (const tx of transactions) {
      const name = tx.initiated_by_name?.trim() || "Unknown";
      if (!map.has(name)) {
        map.set(name, {
          name,
          transactionCount: 0,
          totalVolume: 0,
          completedCount: 0,
          pendingCount: 0,
          lastActivityAt: null,
        });
      }
      const s = map.get(name)!;
      s.transactionCount += 1;
      s.totalVolume += parseFloat(tx.amount || "0");
      if (tx.status === "completed") s.completedCount += 1;
      if (tx.status === "pending") s.pendingCount += 1;
      if (
        tx.created_at &&
        (!s.lastActivityAt || new Date(tx.created_at) > new Date(s.lastActivityAt))
      ) {
        s.lastActivityAt = tx.created_at;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.transactionCount - a.transactionCount);
  }, [transactions]);

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-dark-50">Agent Activity</h2>
          <p className="text-xs text-dark-300 mt-0.5">Based on today&apos;s transactions</p>
        </div>
        <span className="text-xs text-dark-300 bg-dark-500 border border-dark-400 px-2.5 py-1 rounded-full">
          {agents.length} agent{agents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[480px] pr-1">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-dark-500 border border-dark-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-dark-300 text-sm">No transactions yet today</p>
          </div>
        ) : (
          agents.map((agent, i) => (
            <AgentRow key={agent.name} agent={agent} rank={i} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-dark-400/60">
        <p className="text-xs text-dark-300 text-center">
          {transactions.length} total transaction{transactions.length !== 1 ? "s" : ""} today
        </p>
      </div>
    </div>
  );
}

function AgentRow({ agent, rank }: { agent: AgentStats; rank: number }) {
  const isTop = rank === 0;
  const completionRate =
    agent.transactionCount > 0
      ? Math.round((agent.completedCount / agent.transactionCount) * 100)
      : 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isTop
          ? "bg-gold/8 border-gold/25"
          : "bg-dark-500/40 border-dark-400/60 hover:bg-dark-500/70"
      }`}
    >
      {/* Avatar with optional top-agent star */}
      <div className="relative shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            isTop
              ? "bg-gold/20 border-2 border-gold/50 text-gold"
              : "bg-dark-400 border border-dark-300/30 text-dark-100"
          }`}
        >
          {initials(agent.name)}
        </div>
        {isTop && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center shadow-sm">
            <span className="text-dark font-black" style={{ fontSize: 8 }}>★</span>
          </div>
        )}
        {/* Online pulse — shown if last activity was within 15 minutes */}
        {agent.lastActivityAt &&
          Date.now() - new Date(agent.lastActivityAt).getTime() < 15 * 60_000 && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-600" />
          )}
      </div>

      {/* Name + last activity */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark-50 truncate">{agent.name}</p>
        <p className="text-xs text-dark-300 mt-0.5">
          {agent.lastActivityAt ? timeAgo(agent.lastActivityAt) : "no activity"}
          {agent.pendingCount > 0 && (
            <span className="ml-2 text-amber-400">{agent.pendingCount} pending</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-dark-50">
          {agent.transactionCount}{" "}
          <span className="text-xs font-normal text-dark-300">
            txn{agent.transactionCount !== 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-xs text-dark-300 mt-0.5">
          GHS {agent.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        {agent.transactionCount > 0 && (
          <p className="text-[10px] text-emerald-400 mt-0.5">{completionRate}% done</p>
        )}
      </div>
    </div>
  );
}
