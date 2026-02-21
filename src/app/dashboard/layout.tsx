"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/team",
    label: "Team",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.full_name || "Admin");
      setUserAvatar(user.avatar || null);
    } catch {
      setUserName("Admin");
    }
    setCompanyName(localStorage.getItem("companyName") || "");
    setRole(localStorage.getItem("role") || "");
  }, [router]);

  function handleLogout() {
    ["token", "user", "membership", "companyId", "companyName", "role", "companies"].forEach(
      (k) => localStorage.removeItem(k)
    );
    router.replace("/login");
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-dark">
      {/* Top Navbar */}
      <nav className="bg-dark-600 border-b border-dark-400 sticky top-0 z-40">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + company */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                  <span className="text-dark text-sm font-black leading-none">M+</span>
                </div>
                <span className="text-lg font-bold text-gold hidden sm:block">Merchant+</span>
              </Link>
              {companyName && (
                <span className="hidden md:inline text-sm text-dark-200 border-l border-dark-400 pl-4 truncate max-w-[180px]">
                  {companyName}
                </span>
              )}
            </div>

            {/* Centre: Nav tabs */}
            <div className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gold/15 text-gold"
                        : "text-dark-200 hover:text-dark-50 hover:bg-dark-500"
                    }`}
                  >
                    {link.icon}
                    <span className="hidden sm:block">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right: User info + logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                    <span className="text-gold text-xs font-bold">{initials}</span>
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm font-medium text-dark-50">{userName}</span>
                  {role && (
                    <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-dark-500 border border-dark-400 text-dark-200">
                      {role}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-dark-300 hover:text-red-400 font-medium transition-colors px-2 py-1 rounded hover:bg-red-900/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-6 max-w-screen-2xl mx-auto">{children}</main>
    </div>
  );
}
