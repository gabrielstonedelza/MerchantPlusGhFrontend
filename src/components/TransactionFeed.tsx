"use client";

import { useState, useEffect, useRef } from "react";
import { AgentRequest } from "@/lib/api";
import Link from "next/link";

interface Props {
  transactions: AgentRequest[];
}

export default function TransactionFeed({ transactions }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const prevCountRef = useRef(transactions.length);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (transactions.length > prevCountRef.current) {
      const newTxIds = new Set(
        transactions.slice(0, transactions.length - prevCountRef.current).map((t) => t.id)
      );
      setNewIds(newTxIds);
      const timer = setTimeout(() => setNewIds(new Set()), 3000);
      prevCountRef.current = transactions.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = transactions.length;
  }, [transactions]);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.transaction_type === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-dark-50">
            Request Feed
            <span className="text-sm font-normal text-dark-200 ml-2">(live)</span>
          </h2>
          {transactions.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {transactions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {["all", "deposit", "withdrawal", "transfer"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filter === f
                    ? "bg-gold text-dark font-semibold"
                    : "bg-dark-500 text-dark-200 hover:bg-dark-400"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <Link
            href="/dashboard/requests"
            className="text-xs text-dark-300 hover:text-gold transition-colors ml-2"
          >
            View all &rarr;
          </Link>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-dark-500 border border-dark-400 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-dark-300 text-sm">No pending requests</p>
          </div>
        ) : (
          sorted.slice(0, 50).map((tx) => (
            <RequestRow key={tx.id} request={tx} isNew={newIds.has(tx.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function RequestRow({
  request: tx,
  isNew,
}: {
  request: AgentRequest;
  isNew: boolean;
}) {
  const isDeposit = tx.transaction_type === "deposit";
  const isWithdrawal = tx.transaction_type === "withdrawal";

  return (
    <Link
      href={`/dashboard/requests/${tx.id}`}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${
        isNew
          ? "animate-slide-in bg-gold/10 border-gold/30"
          : "bg-dark-500/50 border-dark-400 hover:bg-dark-500 hover:border-dark-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            isDeposit
              ? "bg-emerald-900/50 text-emerald-400"
              : isWithdrawal
              ? "bg-red-900/50 text-red-400"
              : "bg-blue-900/50 text-blue-400"
          }`}
        >
          {isDeposit ? "D" : isWithdrawal ? "W" : "T"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark-50 group-hover:text-white">
              {tx.requested_by_name || "Unknown Agent"}
            </span>
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-500/30">
              pending
            </span>
          </div>
          <p className="text-xs text-dark-300 capitalize">
            {tx.transaction_type} &middot;{" "}
            {tx.channel.replace("_", " ")} &middot;{" "}
            <span className="text-dark-400">
              {tx.reference}
            </span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold ${
            isDeposit ? "text-emerald-400" : isWithdrawal ? "text-red-400" : "text-dark-50"
          }`}
        >
          {isDeposit ? "+" : isWithdrawal ? "-" : ""}
          GHS {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {tx.requested_at && (
          <p className="text-[10px] text-dark-300">
            {new Date(tx.requested_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </Link>
  );
}
