"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile Money & Bank Deposits",
    description:
      "Process MTN, Vodafone, and AirtelTigo mobile money transactions alongside bank deposits — all in one unified platform.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Real-Time Dashboard",
    description:
      "Monitor live transactions, provider balances, and agent performance the moment they happen — no refresh needed.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Team & Branch Management",
    description:
      "Manage tellers, managers, and admins across multiple branches with granular role-based access control.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "KYC & Compliance",
    description:
      "Verify customer identities, maintain immutable audit trails, and stay fully compliant with Ghana's financial regulations.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Webhook Integrations",
    description:
      "Connect your existing systems with real-time HMAC-signed webhooks for every transaction, customer, and balance event.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Reports & CSV Exports",
    description:
      "Generate detailed transaction reports, daily closing summaries, and CSV exports ready for your accounting team.",
  },
];

const steps = [
  {
    number: "01",
    title: "Register Your Company",
    desc: "Sign up in minutes with your business details and choose the plan that fits your agency.",
  },
  {
    number: "02",
    title: "Set Up Your Team",
    desc: "Invite agents to your team, configure branches, set approval thresholds and fees.",
  },
  {
    number: "03",
    title: "Start Processing",
    desc: "Your agents are ready to process mobile money and bank transactions from day one.",
  },
];

const stats = [
  { value: "4 Plans", label: "From free to enterprise" },
  { value: "6+", label: "Mobile networks supported" },
  { value: "Real-time", label: "Live transaction monitoring" },
  { value: "Audit-ready", label: "Immutable compliance logs" },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-dark-50 overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-400/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-lg">
              <span className="text-dark font-black text-sm leading-none">M+</span>
            </div>
            <span className="font-bold text-lg tracking-tight">MerchantPlus</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-5 py-2">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">
              Register Company
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Radial glow backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(212,168,67,0.10) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,168,67,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-sm font-medium">
              Built for Ghanaian Payment Agents
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            The Smarter Way to
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #C49A32 0%, #F5D778 45%, #D4A843 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Manage Payments
            </span>
            <br />
            in Ghana
          </h1>

          {/* Subtitle */}
          <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            MerchantPlus is a complete multi-tenant platform for mobile money agents — manage
            transactions, verify customers, oversee your team, and grow your business in real time.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gold text-dark font-bold px-8 py-4 rounded-xl hover:bg-gold-300 transition-all hover:scale-105 text-base shadow-lg glow-gold"
            >
              Register Your Company
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-dark-500 text-dark-100 font-semibold px-8 py-4 rounded-xl hover:bg-dark-400 transition-all border border-dark-400 text-base"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-16 flex items-center justify-center gap-8 text-dark-300 text-sm flex-wrap">
            {[
              "🔒 Bank-grade security",
              "⚡ Real-time processing",
              "📱 Mobile app included",
              "🇬🇭 Made for Ghana",
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything your agency needs
            </h2>
            <p className="text-dark-200 text-lg max-w-xl mx-auto">
              One platform to handle every aspect of your mobile money and payment operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="card hover:border-gold/30 transition-all duration-200 group hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-5 group-hover:bg-gold/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2 group-hover:text-gold transition-colors">
                  {f.title}
                </h3>
                <p className="text-dark-200 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-28 px-6" style={{ background: "rgba(26, 29, 39, 0.4)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Up and running in minutes
            </h2>
            <p className="text-dark-200 text-lg">
              No complex setup. No technical expertise required.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-start">
            {steps.map((step, i) => (
              <div key={step.number} className="flex-1 flex flex-col md:items-center text-center relative px-4">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[58%] right-0 h-px bg-gradient-to-r from-gold/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-dark-500 border border-gold/20 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <span className="text-gold font-black text-lg">{step.number}</span>
                </div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-dark-200 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="card glow-gold grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-gold mb-1">{s.value}</div>
                <div className="text-dark-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to grow your payment business?
          </h2>
          <p className="text-dark-200 text-lg mb-10 max-w-xl mx-auto">
            Join agencies across Ghana using MerchantPlus to process transactions faster,
            smarter, and more securely.
          </p>
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gold text-dark font-bold px-8 py-4 rounded-xl hover:bg-gold-300 transition-all hover:scale-105 text-base shadow-lg glow-gold"
            >
              Get Started Free
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/login"
              className="text-dark-200 hover:text-gold transition-colors text-base underline underline-offset-4"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-dark-400/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-dark font-black text-xs leading-none">M+</span>
            </div>
            <span className="font-bold text-dark-100">MerchantPlus</span>
          </div>
          <p className="text-dark-300 text-sm">
            © {new Date().getFullYear()} MerchantPlus Ghana. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
