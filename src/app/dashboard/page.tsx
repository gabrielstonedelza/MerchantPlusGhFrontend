"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DashboardWebSocket, WebSocketMessage } from "@/lib/websocket";
import {
  getTransactions,
  getProviderBalances,
  getDashboard,
  Transaction,
  ProviderBalance,
  DashboardData,
} from "@/lib/api";
import Link from "next/link";
import ProviderBalanceCards from "@/components/ProviderBalanceCards";
import TransactionFeed from "@/components/TransactionFeed";
import UserActivity from "@/components/UserActivity";
import ConnectionStatus from "@/components/ConnectionStatus";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<ProviderBalance[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [wsStatus, setWsStatus] = useState<string>("connecting");
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<DashboardWebSocket | null>(null);

  // Use state so values are read after hydration and trigger re-renders
  const [token, setToken] = useState("");
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    const storedCompanyId = localStorage.getItem("companyId") || "";
    setToken(storedToken);
    setCompanyId(storedCompanyId);
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!token || !companyId) return;

    try {
      const [txData, balData, dashData] = await Promise.all([
        getTransactions(token, companyId),
        getProviderBalances(token, companyId),
        getDashboard(token, companyId),
      ]);
      setTransactions(txData);
      setBalances(balData);
      setDashboard(dashData);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);

  const handleTransactionUpdate = useCallback((data: WebSocketMessage) => {
    const tx = data.transaction as Transaction;
    setTransactions((prev) => {
      const existing = prev.findIndex((t) => t.id === tx.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = tx;
        return updated;
      }
      return [tx, ...prev];
    });
  }, []);

  const handleBalanceChange = useCallback((data: WebSocketMessage) => {
    const bal = data.balance as {
      user_id: string;
      user_name: string;
      provider: string;
      balance: string;
      starting_balance: string;
    };
    setBalances((prev) => {
      const existing = prev.findIndex(
        (b) => b.user === bal.user_id && b.provider === bal.provider
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          balance: bal.balance,
          starting_balance: bal.starting_balance,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: "",
          company: companyId,
          user: bal.user_id,
          user_name: bal.user_name,
          provider: bal.provider,
          provider_display: bal.provider.toUpperCase(),
          starting_balance: bal.starting_balance,
          balance: bal.balance,
          last_updated: new Date().toISOString(),
        },
      ];
    });
  }, [companyId]);

  const handleInitialState = useCallback(
    (data: WebSocketMessage) => {
      const serverBalances = data.balances as Array<{
        user_id: string;
        user_name: string;
        providers: Record<string, { balance: string; starting_balance: string }>;
      }>;

      const flatBalances: ProviderBalance[] = [];
      for (const user of serverBalances) {
        for (const [provider, vals] of Object.entries(user.providers)) {
          flatBalances.push({
            id: `${user.user_id}-${provider}`,
            company: companyId,
            user: user.user_id,
            user_name: user.user_name,
            provider,
            provider_display: provider.replace("_", " ").toUpperCase(),
            starting_balance: vals.starting_balance,
            balance: vals.balance,
            last_updated: new Date().toISOString(),
          });
        }
      }
      if (flatBalances.length > 0) {
        setBalances(flatBalances);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (!token || !companyId) return;

    fetchInitialData();

    const ws = new DashboardWebSocket(companyId, token);
    wsRef.current = ws;

    ws.on("connection", (data) => {
      setWsStatus(data.status as string);
    });

    ws.on("initial_state", handleInitialState);
    ws.on("transaction_update", handleTransactionUpdate);
    ws.on("balance_change", handleBalanceChange);

    ws.connect();

    return () => {
      ws.disconnect();
    };
  }, [
    token,
    companyId,
    fetchInitialData,
    handleInitialState,
    handleTransactionUpdate,
    handleBalanceChange,
  ]);

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
          <h1 className="text-2xl font-bold text-dark-50">Admin Dashboard</h1>
          <p className="text-dark-200 text-sm mt-1">
            Real-time overview of all operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/balances"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-500 border border-dark-400 text-dark-200 hover:text-dark-50 hover:border-dark-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="hidden sm:block">Balances</span>
          </Link>
          <Link
            href="/dashboard/team"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold text-dark font-semibold hover:bg-gold/90 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            Add Agent
          </Link>
          <ConnectionStatus status={wsStatus} />
        </div>
      </div>

      {/* KPI Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            label="Today's Transactions"
            value={dashboard.total_transactions_today}
          />
          <KPICard
            label="Deposits Today"
            value={`GHS ${Number(dashboard.total_deposits_today || 0).toLocaleString()}`}
          />
          <KPICard
            label="Withdrawals Today"
            value={`GHS ${Number(dashboard.total_withdrawals_today || 0).toLocaleString()}`}
          />
          <KPICard
            label="Fees Today"
            value={`GHS ${Number(dashboard.total_fees_today || 0).toLocaleString()}`}
          />
          <KPICard label="Total Customers" value={dashboard.total_customers} />
          <KPICard
            label="Pending Approvals"
            value={dashboard.pending_approvals}
            highlight={dashboard.pending_approvals > 0}
          />
        </div>
      )}

      <ProviderBalanceCards balances={balances} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionFeed transactions={transactions} />
        </div>
        <div>
          <UserActivity transactions={transactions} />
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? "border-gold/50 glow-gold" : ""}`}>
      <p className="text-xs text-dark-200 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-gold" : "text-dark-50"}`}>
        {value}
      </p>
    </div>
  );
}
