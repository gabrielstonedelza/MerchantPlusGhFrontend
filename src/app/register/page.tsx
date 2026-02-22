"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPlans,
  registerCompany,
  SubscriptionPlan,
  CompanyRegistrationData,
} from "@/lib/api";

type Step = "plan" | "company" | "owner";

const STEP_ORDER: Step[] = ["plan", "company", "owner"];
const STEP_LABELS: Record<Step, string> = {
  plan: "Choose Plan",
  company: "Company Info",
  owner: "Your Account",
};

interface FormData {
  subscription_plan: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_city: string;
  business_registration_number: string;
  owner_full_name: string;
  owner_email: string;
  owner_phone: string;
  owner_password: string;
  owner_confirm_password: string;
}

const EMPTY_FORM: FormData = {
  subscription_plan: "",
  company_name: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  company_city: "",
  business_registration_number: "",
  owner_full_name: "",
  owner_email: "",
  owner_phone: "",
  owner_password: "",
  owner_confirm_password: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("plan");
  const [done, setDone] = useState(false);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlansError("Unable to load plans. Please refresh the page."))
      .finally(() => setPlansLoading(false));
  }, []);

  function field(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function validate(): boolean {
    if (step === "plan") {
      if (!form.subscription_plan) {
        setError("Please select a subscription plan to continue.");
        return false;
      }
    }
    if (step === "company") {
      if (!form.company_name.trim()) { setError("Company name is required."); return false; }
      if (!form.company_email.trim()) { setError("Business email is required."); return false; }
      if (!form.company_phone.trim()) { setError("Business phone is required."); return false; }
    }
    if (step === "owner") {
      if (!form.owner_full_name.trim()) { setError("Full name is required."); return false; }
      if (!form.owner_email.trim()) { setError("Email address is required."); return false; }
      if (!form.owner_phone.trim()) { setError("Phone number is required."); return false; }
      if (form.owner_password.length < 8) {
        setError("Password must be at least 8 characters.");
        return false;
      }
      if (form.owner_password !== form.owner_confirm_password) {
        setError("Passwords do not match.");
        return false;
      }
    }
    return true;
  }

  async function handleNext() {
    if (!validate()) return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await submit();
    }
  }

  function handleBack() {
    setError("");
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const payload: CompanyRegistrationData = {
        company_name: form.company_name,
        company_email: form.company_email,
        company_phone: form.company_phone,
        company_address: form.company_address || undefined,
        company_city: form.company_city || undefined,
        business_registration_number: form.business_registration_number || undefined,
        owner_full_name: form.owner_full_name,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone,
        owner_password: form.owner_password,
        subscription_plan: form.subscription_plan,
      };
      await registerCompany(payload);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPlan = plans.find((p) => p.id === form.subscription_plan);
  const currentIdx = STEP_ORDER.indexOf(step);

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen bg-dark flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-md animate-slide-in">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-8">
              <svg
                className="w-12 h-12 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-3">You&apos;re all set!</h1>
            <p className="text-dark-200 mb-2">
              <strong className="text-dark-50">{form.company_name}</strong> has been
              successfully registered on MerchantPlus.
            </p>
            <Link
                href="/login"
                className="btn-primary px-8 py-3 text-base w-full block text-center"
            >
              Continue to Sign In
            </Link>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center px-6 py-12">
        {/* Progress indicator */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex items-center justify-center">
            {STEP_ORDER.map((s, i) => {
              const isPast = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                        isPast
                          ? "bg-gold border-gold text-dark"
                          : isActive
                          ? "border-gold text-gold bg-gold/10"
                          : "border-dark-400 text-dark-300 bg-dark-600"
                      }`}
                    >
                      {isPast ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium whitespace-nowrap ${
                        isActive
                          ? "text-gold"
                          : isPast
                          ? "text-dark-200"
                          : "text-dark-400"
                      }`}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div
                      className={`w-20 md:w-32 h-px mx-3 mb-5 transition-colors duration-200 ${
                        i < currentIdx ? "bg-gold/40" : "bg-dark-400"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full max-w-3xl mb-6 bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Step 1: Plan Selection ── */}
        {step === "plan" && (
          <div className="w-full max-w-5xl">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
              <p className="text-dark-200">
                Start with the plan that fits your business. You can upgrade anytime.
              </p>
            </div>

            {plansError ? (
              <div className="card text-center py-10">
                <p className="text-red-400 mb-4">{plansError}</p>
                <button
                  onClick={() => {
                    setPlansError("");
                    setPlansLoading(true);
                    getPlans()
                      .then(setPlans)
                      .catch(() => setPlansError("Unable to load plans. Please refresh."))
                      .finally(() => setPlansLoading(false));
                  }}
                  className="btn-secondary"
                >
                  Retry
                </button>
              </div>
            ) : plansLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const selected = form.subscription_plan === plan.id;
                  const isFree = parseFloat(plan.monthly_price) === 0;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => field("subscription_plan", plan.id)}
                      className={`card text-left transition-all duration-200 hover:-translate-y-0.5 relative ${
                        selected
                          ? "border-gold glow-gold"
                          : "hover:border-gold/30"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-dark"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="text-xs text-gold font-semibold uppercase tracking-wider mb-2">
                        {plan.tier}
                      </div>
                      <div className="font-bold text-lg mb-1">{plan.name}</div>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-black text-gold">
                          {isFree ? "Free" : `GH₵${plan.monthly_price}`}
                        </span>
                        {!isFree && (
                          <span className="text-dark-300 text-xs font-normal">/mo</span>
                        )}
                      </div>
                      <p className="text-dark-200 text-xs mb-5 leading-relaxed">
                        {plan.description}
                      </p>
                      <ul className="space-y-2 text-xs text-dark-200">
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          Up to {plan.max_users} users
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          {plan.max_customers.toLocaleString()} customers
                        </li>
                        {plan.has_mobile_money && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Mobile Money
                          </li>
                        )}
                        {plan.has_bank_deposits && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Bank Deposits
                          </li>
                        )}
                        {plan.has_reports && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Reports
                          </li>
                        )}
                        {plan.has_audit_trail && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Audit Trail
                          </li>
                        )}
                        {plan.has_multi_branch && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Multi-Branch
                          </li>
                        )}
                        {plan.has_api_access && (
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> API Access
                          </li>
                        )}
                      </ul>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Company Info ── */}
        {step === "company" && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold mb-2">Company information</h1>
              <p className="text-dark-200">Tell us about your business.</p>
            </div>
            <div className="card space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Acme Mobile Money Ltd"
                    value={form.company_name}
                    onChange={(e) => field("company_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Business Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="info@acmemobimoney.com"
                    value={form.company_email}
                    onChange={(e) => field("company_email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Business Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+233 XX XXX XXXX"
                    value={form.company_phone}
                    onChange={(e) => field("company_phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Accra"
                    value={form.company_city}
                    onChange={(e) => field("company_city", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Business Registration No.
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="GH-XXX-XXXXXXX (optional)"
                    value={form.business_registration_number}
                    onChange={(e) =>
                      field("business_registration_number", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Business Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123 Liberation Road, Accra"
                    value={form.company_address}
                    onChange={(e) => field("company_address", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Owner Account ── */}
        {step === "owner" && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold mb-2">Your owner account</h1>
              <p className="text-dark-200">
                This account will have full owner-level access to{" "}
                <strong className="text-dark-100">{form.company_name}</strong>.
              </p>
            </div>
            <div className="card space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Kwame Mensah"
                    value={form.owner_full_name}
                    onChange={(e) => field("owner_full_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="kwame@example.com"
                    value={form.owner_email}
                    onChange={(e) => field("owner_email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+233 XX XXX XXXX"
                    value={form.owner_phone}
                    onChange={(e) => field("owner_phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="Min. 8 characters"
                      value={form.owner_password}
                      onChange={(e) => field("owner_password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="Re-enter password"
                      value={form.owner_confirm_password}
                      onChange={(e) => field("owner_confirm_password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                    >
                      {showConfirm ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan summary */}
              {selectedPlan && (
                <div className="bg-gold/5 border border-gold/20 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gold font-medium mb-0.5">Selected Plan</div>
                    <div className="text-sm font-semibold">
                      {selectedPlan.name}
                      {" — "}
                      {parseFloat(selectedPlan.monthly_price) === 0
                        ? "Free"
                        : `GH₵${selectedPlan.monthly_price}/mo`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("plan")}
                    className="text-xs text-gold/70 hover:text-gold transition-colors underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="w-full max-w-2xl mt-8 flex items-center justify-between">
          {currentIdx > 0 ? (
            <button onClick={handleBack} className="btn-secondary px-6 py-2.5">
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={submitting || plansLoading}
            className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark" />
                Registering…
              </>
            ) : step === "owner" ? (
              "Complete Registration"
            ) : (
              "Continue →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="border-b border-dark-400/50 bg-dark-900/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-lg">
            <span className="text-dark font-black text-sm leading-none">M+</span>
          </div>
          <span className="font-bold text-lg tracking-tight">MerchantPlus</span>
        </Link>
        <Link
          href="/login"
          className="text-dark-200 hover:text-dark-50 text-sm transition-colors"
        >
          Already have an account?{" "}
          <span className="text-gold hover:text-gold-300">Sign in</span>
        </Link>
      </div>
    </nav>
  );
}
