"use client";

import { useState, useEffect, useCallback } from "react";
import { getCustomers, Customer } from "@/lib/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KYC_STYLES: Record<string, string> = {
  verified: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
  pending: "bg-amber-900/40 text-amber-400 border border-amber-700/40",
  rejected: "bg-red-900/40 text-red-400 border border-red-700/40",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-dark-300",
  blocked: "bg-red-500",
};

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
function CustomerAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl: string | null;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-dark-400`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center font-bold text-gold shrink-0`}
    >
      {initials || "?"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CustomersPage() {
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    setCompanyId(localStorage.getItem("companyId") || "");
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    if (!companyId) return;
    setError("");
    try {
      const data = await getCustomers(companyId);
      setCustomers(data);
    } catch {
      setError("Failed to load customers. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Client-side search filter
  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.full_name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
      )
    : customers;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchCustomers} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Customers</h1>
          <p className="text-dark-200 text-sm mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Customer list */}
      <div className="card p-0 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_160px_180px_100px_80px] gap-4 px-6 py-3 border-b border-dark-400/50 text-xs font-semibold text-dark-300 uppercase tracking-wider">
          <span>Customer</span>
          <span>Phone</span>
          <span>Email</span>
          <span>KYC</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-dark-400/30">
          {filtered.length === 0 && (
            <div className="text-center py-14">
              <svg
                className="w-12 h-12 text-dark-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className="text-dark-300 text-sm">
                {search ? "No customers match your search." : "No customers yet."}
              </p>
            </div>
          )}

          {filtered.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer row
// ---------------------------------------------------------------------------
function CustomerRow({ customer }: { customer: Customer }) {
  const joined = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const kycCls =
    KYC_STYLES[customer.kyc_status] || "bg-dark-500 text-dark-200 border border-dark-400";
  const statusDot = STATUS_DOT[customer.status] || "bg-dark-300";

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-dark-500/30 transition-colors sm:grid sm:grid-cols-[1fr_160px_180px_100px_80px]">
      {/* Customer info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <CustomerAvatar
            name={customer.full_name}
            photoUrl={customer.photo_url}
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-dark-50 truncate">
            {customer.full_name}
          </p>
          <p className="text-xs text-dark-400 mt-0.5">Joined {joined}</p>
          {/* Mobile-only: show phone + email inline */}
          <div className="sm:hidden mt-1 space-y-0.5">
            <p className="text-xs text-dark-300">{customer.phone}</p>
            {customer.email && (
              <p className="text-xs text-dark-300 truncate">{customer.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Phone (desktop) */}
      <p className="hidden sm:block text-sm text-dark-200 truncate">
        {customer.phone}
      </p>

      {/* Email (desktop) */}
      <p className="hidden sm:block text-sm text-dark-300 truncate">
        {customer.email || <span className="text-dark-400 italic">—</span>}
      </p>

      {/* KYC badge */}
      <div className="hidden sm:flex items-center">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${kycCls}`}
        >
          {customer.kyc_status}
        </span>
      </div>

      {/* Status dot */}
      <div className="hidden sm:flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
        <span className="text-xs text-dark-300 capitalize">{customer.status}</span>
      </div>

      {/* Mobile-only badges */}
      <div className="sm:hidden flex items-center gap-2 ml-auto shrink-0">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${kycCls}`}
        >
          {customer.kyc_status}
        </span>
        <div className={`w-2 h-2 rounded-full ${statusDot}`} />
      </div>
    </div>
  );
}
