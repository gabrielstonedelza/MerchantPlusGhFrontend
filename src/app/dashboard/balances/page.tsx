"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getProviderBalances,
  initializeBalances,
  adminAdjustBalance,
  ProviderBalance,
} from "@/lib/api";

const PROVIDERS = [
  { key: "mtn", label: "MTN" },
  { key: "vodafone", label: "Vodafone" },
  { key: "airtel", label: "Airtel" },
  { key: "tigo", label: "Tigo" },
  { key: "ecobank", label: "Ecobank" },
  { key: "fidelity", label: "Fidelity" },
  { key: "cal_bank", label: "Cal Bank" },
  { key: "cash", label: "Cash" },
];

const PROVIDER_COLORS: Record<string, string> = {
  mtn: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  vodafone: "text-red-400 bg-red-400/10 border-red-400/30",
  airtel: "text-red-500 bg-red-500/10 border-red-500/30",
  tigo: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  ecobank: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  fidelity: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  cal_bank: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  cash: "text-gold bg-gold/10 border-gold/30",
};

export default function BalancesPage() {
  const [balances, setBalances] = useState<ProviderBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  // Morning float modal
  const [floatModal, setFloatModal] = useState(false);
  const [floatValues, setFloatValues] = useState<Record<string, string>>({});
  const [floatSaving, setFloatSaving] = useState(false);

  // Adjust modal
  const [adjustModal, setAdjustModal] = useState<{ provider: string; current: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustOp, setAdjustOp] = useState<"add" | "subtract" | "set">("add");
  const [adjustSaving, setAdjustSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setCompanyId(localStorage.getItem("companyId") || "");
    setRole(localStorage.getItem("role") || "");
    try {
      const membership = JSON.parse(localStorage.getItem("membership") || "{}");
      setUserId(membership.user || "");
    } catch {
      setUserId("");
    }
  }, []);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const balanceData = await getProviderBalances(companyId);
      setBalances(balanceData);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      load();
    }
  }, [companyId, load]);

  // Aggregate balances by provider
  const providerTotals: Record<string, { balance: number; starting_balance: number }> = {};
  for (const b of balances) {
    if (!providerTotals[b.provider]) {
      providerTotals[b.provider] = { balance: 0, starting_balance: 0 };
    }
    providerTotals[b.provider].balance += parseFloat(b.balance || "0");
    providerTotals[b.provider].starting_balance += parseFloat(b.starting_balance || "0");
  }

  const totalBalance = Object.values(providerTotals).reduce(
    (sum, p) => sum + p.balance, 0
  );

  const hasExistingFloat = balances.length > 0;
  const canManage = role === "owner";

  // Determine the userId to use for API calls (first balance's user, or logged-in user)
  const targetUserId = balances.length > 0 ? balances[0].user : userId;

  // Open morning float modal
  function openFloatModal() {
    const initial: Record<string, string> = {};
    for (const p of PROVIDERS) {
      initial[p.key] = providerTotals[p.key]?.balance?.toString() ?? "0";
    }
    setFloatValues(initial);
    setFloatModal(true);
    setError("");
  }

  async function saveFloat() {
    if (!targetUserId) return;
    setFloatSaving(true);
    setError("");
    try {
      const numericBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(floatValues)) {
        const n = parseFloat(v);
        if (!isNaN(n) && n >= 0) numericBalances[k] = n;
      }
      const updated = await initializeBalances(companyId, targetUserId, numericBalances);
      setBalances((prev) => {
        const next = prev.filter((b) => b.user !== targetUserId);
        return [...next, ...updated];
      });
      setSuccess("Morning float updated successfully");
      setFloatModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save float.");
    } finally {
      setFloatSaving(false);
    }
  }

  // Open adjust modal
  function openAdjustModal(provider: string, current: string) {
    setAdjustModal({ provider, current });
    setAdjustAmount("");
    setAdjustOp("add");
    setError("");
  }

  async function saveAdjust() {
    if (!adjustModal || !targetUserId) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setAdjustSaving(true);
    setError("");
    try {
      const updated = await adminAdjustBalance(
        companyId, targetUserId, adjustModal.provider, amt, adjustOp
      );
      setBalances((prev) => {
        const idx = prev.findIndex((b) => b.user === targetUserId && b.provider === adjustModal.provider);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setSuccess("Balance updated successfully");
      setAdjustModal(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to adjust balance.");
    } finally {
      setAdjustSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Balances</h1>
          <p className="text-dark-200 text-sm mt-1">
            Manage morning floats and track provider balance deductions
          </p>
        </div>
        {canManage && (
          <button
            onClick={openFloatModal}
            className="btn-primary text-sm px-4 py-2"
          >
            {hasExistingFloat ? "Update Morning Float" : "Set Morning Float"}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {error && !floatModal && !adjustModal && (
        <div className="bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Total balance */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-dark-300">Total Balance</p>
            <p className="text-2xl font-bold text-dark-50">
              GHS {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Provider balances grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROVIDERS.map((p) => {
            const totals = providerTotals[p.key];
            const current = totals?.balance ?? 0;
            const starting = totals?.starting_balance ?? 0;
            const diff = current - starting;
            const colorCls = PROVIDER_COLORS[p.key] || "text-dark-200 bg-dark-500 border-dark-400";

            return (
              <div key={p.key}
                className={`relative rounded-lg border p-3 ${colorCls}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{p.label}</span>
                  {canManage && (
                    <button
                      onClick={() => openAdjustModal(p.key, current.toString())}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      title="Adjust balance"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-base font-bold">
                  {current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                {totals ? (
                  <p className={`text-[10px] mt-0.5 ${diff < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {diff >= 0 ? "+" : ""}{diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} from start
                  </p>
                ) : (
                  <p className="text-[10px] mt-0.5 opacity-50">Not set</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Morning Float Modal */}
      {floatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-600 border border-dark-400 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-dark-400">
              <h2 className="text-lg font-semibold text-dark-50">
                {hasExistingFloat ? "Update Morning Float" : "Set Morning Float"}
              </h2>
              <p className="text-xs text-dark-300 mt-0.5">
                Enter starting balances for today
              </p>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {PROVIDERS.map((p) => (
                <div key={p.key} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold w-20 shrink-0 px-2 py-1 rounded border text-center ${PROVIDER_COLORS[p.key]}`}>
                    {p.label}
                  </span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-300">GHS</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={floatValues[p.key] ?? ""}
                      onChange={(e) => setFloatValues((v) => ({ ...v, [p.key]: e.target.value }))}
                      className="input-field pl-10 w-full text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-dark-400 flex gap-3 justify-end">
              <button onClick={() => setFloatModal(false)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button onClick={saveFloat} disabled={floatSaving} className="btn-primary text-sm px-6 py-2">
                {floatSaving ? "Saving…" : hasExistingFloat ? "Update Float" : "Set Float"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-600 border border-dark-400 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-dark-400">
              <h2 className="text-lg font-semibold text-dark-50">Adjust Balance</h2>
              <p className="text-xs text-dark-300 mt-0.5">
                {PROVIDERS.find((p) => p.key === adjustModal.provider)?.label}
              </p>
              <p className="text-xs text-dark-400 mt-1">
                Current: GHS {parseFloat(adjustModal.current).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-dark-300 block mb-1.5">Operation</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["add", "subtract", "set"] as const).map((op) => (
                    <button
                      key={op}
                      onClick={() => setAdjustOp(op)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-colors capitalize ${
                        adjustOp === op
                          ? "bg-gold/20 border-gold/50 text-gold"
                          : "bg-dark-500 border-dark-400 text-dark-300 hover:border-dark-300"
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-300 block mb-1.5">Amount (GHS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>
            <div className="p-6 border-t border-dark-400 flex gap-3 justify-end">
              <button onClick={() => setAdjustModal(null)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button onClick={saveAdjust} disabled={adjustSaving} className="btn-primary text-sm px-6 py-2">
                {adjustSaving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
