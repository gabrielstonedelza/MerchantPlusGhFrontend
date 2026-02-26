"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getProviderBalances,
  getTeamMembers,
  initializeBalances,
  adminAdjustBalance,
  ProviderBalance,
  TeamMember,
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

interface AgentBalanceGroup {
  member: TeamMember;
  balances: Record<string, ProviderBalance>;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function BalancesPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [balances, setBalances] = useState<ProviderBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  // Morning float modal
  const [floatModal, setFloatModal] = useState<TeamMember | null>(null);
  const [floatValues, setFloatValues] = useState<Record<string, string>>({});
  const [floatSaving, setFloatSaving] = useState(false);

  // Adjust modal
  const [adjustModal, setAdjustModal] = useState<{ member: TeamMember; provider: string; current: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustOp, setAdjustOp] = useState<"add" | "subtract" | "set">("add");
  const [adjustSaving, setAdjustSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use state so values are read after hydration and trigger re-renders
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    setCompanyId(localStorage.getItem("companyId") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [memberData, balanceData] = await Promise.all([
        getTeamMembers(companyId),
        getProviderBalances(companyId),
      ]);
      setMembers(memberData.filter((m) => m.is_active));
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

  // Group balances by agent
  const agentGroups: AgentBalanceGroup[] = members.map((member) => {
    const memberBalances: Record<string, ProviderBalance> = {};
    for (const b of balances) {
      if (b.user === member.user) {
        memberBalances[b.provider] = b;
      }
    }
    return { member, balances: memberBalances };
  });

  const canManage = role === "owner";

  // Open morning float modal
  function openFloatModal(member: TeamMember) {
    const group = agentGroups.find((g) => g.member.id === member.id);
    const initial: Record<string, string> = {};
    for (const p of PROVIDERS) {
      initial[p.key] = group?.balances[p.key]?.balance ?? "0";
    }
    setFloatValues(initial);
    setFloatModal(member);
    setError("");
  }

  async function saveFloat() {
    if (!floatModal) return;
    setFloatSaving(true);
    setError("");
    try {
      const numericBalances: Record<string, number> = {};
      for (const [k, v] of Object.entries(floatValues)) {
        const n = parseFloat(v);
        if (!isNaN(n) && n >= 0) numericBalances[k] = n;
      }
      const updated = await initializeBalances(companyId, floatModal.user, numericBalances);
      setBalances((prev) => {
        const next = prev.filter((b) => b.user !== floatModal.user);
        return [...next, ...updated];
      });
      setSuccess(`Morning float set for ${floatModal.user_full_name}`);
      setFloatModal(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save float.");
    } finally {
      setFloatSaving(false);
    }
  }

  // Open adjust modal
  function openAdjustModal(member: TeamMember, provider: string, current: string) {
    setAdjustModal({ member, provider, current });
    setAdjustAmount("");
    setAdjustOp("add");
    setError("");
  }

  async function saveAdjust() {
    if (!adjustModal) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setAdjustSaving(true);
    setError("");
    try {
      const updated = await adminAdjustBalance(
        companyId, adjustModal.member.user, adjustModal.provider, amt, adjustOp
      );
      setBalances((prev) => {
        const idx = prev.findIndex((b) => b.user === adjustModal.member.user && b.provider === adjustModal.provider);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setSuccess(`Balance updated for ${adjustModal.member.user_full_name}`);
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
          <h1 className="text-2xl font-bold text-dark-50">Agent Balances</h1>
          <p className="text-dark-200 text-sm mt-1">
            Set morning floats and manage provider balances for each agent
          </p>
        </div>
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

      {agentGroups.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-dark-300 text-sm">No active agents found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agentGroups.map(({ member, balances: agentBal }) => {
            const totalBalance = Object.values(agentBal).reduce(
              (sum, b) => sum + parseFloat(b.balance || "0"), 0
            );
            return (
              <div key={member.id} className="card">
                {/* Agent header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {member.user_avatar ? (
                      <img src={member.user_avatar} alt={member.user_full_name}
                        className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                        <span className="text-gold text-sm font-bold">{initials(member.user_full_name)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-dark-50">{member.user_full_name}</p>
                      <p className="text-xs text-dark-300 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-dark-300">Total Balance</p>
                      <p className="text-sm font-bold text-dark-50">
                        GHS {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => openFloatModal(member)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Set Morning Float
                      </button>
                    )}
                  </div>
                </div>

                {/* Provider balances grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROVIDERS.map((p) => {
                    const bal = agentBal[p.key];
                    const current = parseFloat(bal?.balance || "0");
                    const starting = parseFloat(bal?.starting_balance || "0");
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
                              onClick={() => openAdjustModal(member, p.key, bal?.balance || "0")}
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
                        {bal && (
                          <p className={`text-[10px] mt-0.5 ${diff < 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {diff >= 0 ? "+" : ""}{diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} from start
                          </p>
                        )}
                        {!bal && (
                          <p className="text-[10px] mt-0.5 opacity-50">Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Morning Float Modal */}
      {floatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-600 border border-dark-400 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-dark-400">
              <h2 className="text-lg font-semibold text-dark-50">Set Morning Float</h2>
              <p className="text-xs text-dark-300 mt-0.5">
                {floatModal.user_full_name} — enter starting balances for today
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
              <button onClick={() => setFloatModal(null)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button onClick={saveFloat} disabled={floatSaving} className="btn-primary text-sm px-6 py-2">
                {floatSaving ? "Saving…" : "Set Float"}
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
                {adjustModal.member.user_full_name} — {PROVIDERS.find((p) => p.key === adjustModal.provider)?.label}
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
