const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  data: Record<string, unknown>;
  constructor(message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.data = data;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  companyId?: string;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, companyId } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (companyId) {
    headers["X-Company-ID"] = companyId;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (error.error) throw new ApiError(error.error, error);
    if (error.detail) throw new ApiError(error.detail, error);

    const fieldErrors = Object.entries(error)
      .filter(([, v]) => Array.isArray(v))
      .map(([field, msgs]) => {
        const label = field.replace(/_/g, " ");
        return `${label}: ${(msgs as string[]).join(", ")}`;
      });
    if (fieldErrors.length > 0) throw new ApiError(fieldErrors.join(". "), error);

    throw new ApiError(`Request failed: ${response.status}`, error);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginSuccessResponse {
  token: string;
  user: User;
  membership: Membership;
  companies: Company[];
}

export interface CompanySelectionResponse {
  requires_company_selection: true;
  message: string;
  companies: Company[];
}

export interface TwoFactorRequiredResponse {
  requires_2fa: true;
  temp_token: string;
  message: string;
}

export type LoginResponse =
  | LoginSuccessResponse
  | CompanySelectionResponse
  | TwoFactorRequiredResponse;

export function isCompanySelection(
  resp: LoginResponse
): resp is CompanySelectionResponse {
  return "requires_company_selection" in resp && resp.requires_company_selection === true;
}

export function isTwoFactorRequired(
  resp: LoginResponse
): resp is TwoFactorRequiredResponse {
  return "requires_2fa" in resp && resp.requires_2fa === true;
}

export async function login(
  email: string,
  password: string,
  companyId?: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: { email, password, ...(companyId && { company_id: companyId }) },
  });
}

export async function verify2FA(
  tempToken: string,
  code: string
): Promise<LoginSuccessResponse> {
  return apiRequest<LoginSuccessResponse>("/api/v1/auth/2fa/verify/", {
    method: "POST",
    body: { temp_token: tempToken, code },
  });
}

export async function logout() {
  return apiRequest("/api/v1/auth/logout/", { method: "POST" });
}

export async function getMe(companyId: string) {
  return apiRequest<{ user: User; memberships: Membership[] }>("/api/v1/auth/me/", {
    companyId,
  });
}

// ---------------------------------------------------------------------------
// Agent Requests (formerly Transactions)
// ---------------------------------------------------------------------------

export async function getTransactions(companyId: string) {
  return apiRequest<AgentRequest[]>("/api/v1/transactions/", { companyId });
}

export async function getPendingRequests(companyId: string) {
  return apiRequest<AgentRequest[]>("/api/v1/transactions/pending/", { companyId });
}

export async function getRequestDetail(companyId: string, requestId: string) {
  return apiRequest<AgentRequest>(`/api/v1/transactions/${requestId}/`, { companyId });
}

export async function approveRequest(
  companyId: string,
  requestId: string,
  action: "approve" | "reject",
  rejectionReason?: string
) {
  return apiRequest<AgentRequest>(`/api/v1/transactions/${requestId}/approve/`, {
    method: "POST",
    companyId,
    body: { action, rejection_reason: rejectionReason || "" },
  });
}

// ---------------------------------------------------------------------------
// Provider Balances
// ---------------------------------------------------------------------------
export async function getProviderBalances(companyId: string) {
  return apiRequest<ProviderBalance[]>("/api/v1/transactions/balances/", {
    companyId,
  });
}

export async function initializeBalances(
  companyId: string,
  userId: string,
  balances: Record<string, number>
) {
  return apiRequest<ProviderBalance[]>(
    "/api/v1/transactions/balances/initialize/",
    {
      method: "POST",
      companyId,
      body: { user: userId, balances },
    }
  );
}

export async function adminAdjustBalance(
  companyId: string,
  userId: string,
  provider: string,
  amount: number,
  operation: "add" | "subtract" | "set"
) {
  return apiRequest<ProviderBalance>("/api/v1/transactions/balances/admin-adjust/", {
    method: "POST",
    companyId,
    body: { user: userId, provider, amount, operation },
  });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function getCustomers(companyId: string) {
  return apiRequest<Customer[]>("/api/v1/customers/", {
    companyId,
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export async function getDashboard(companyId: string) {
  return apiRequest<DashboardData>("/api/v1/reports/dashboard/", {
    companyId,
  });
}

// ---------------------------------------------------------------------------
// Team Management
// ---------------------------------------------------------------------------
export interface TeamMember {
  id: string;
  user: string;
  user_email: string;
  user_full_name: string;
  user_phone: string;
  user_avatar: string | null;
  company: string;
  company_name: string;
  role: string;
  branch: string | null;
  branch_name: string | null;
  is_active: boolean;
  joined_at: string;
  deactivated_at: string | null;
}

export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  return apiRequest<TeamMember[]>("/api/v1/auth/team/", { companyId });
}

export async function updateTeamMember(
  companyId: string,
  memberId: string,
  data: { role?: string; branch?: string | null; is_active?: boolean; full_name?: string; email?: string; phone?: string }
): Promise<TeamMember> {
  return apiRequest<TeamMember>(`/api/v1/auth/team/${memberId}/update/`, {
    method: "PATCH",
    companyId,
    body: data,
  });
}

export async function deactivateTeamMember(
  companyId: string,
  memberId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/auth/team/${memberId}/deactivate/`, {
    method: "POST",
    companyId,
  });
}

export async function deleteTeamMember(
  companyId: string,
  memberId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/auth/team/${memberId}/delete/`, {
    method: "DELETE",
    companyId,
  });
}

export async function createInvitation(
  companyId: string,
  data: { email: string; role: string; branch?: string }
): Promise<{ id: string; email: string; role: string; token: string }> {
  return apiRequest(`/api/v1/auth/invitations/`, {
    method: "POST",
    companyId,
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Accept Invitation (public — no auth required)
// ---------------------------------------------------------------------------
export interface AcceptInvitationData {
  token: string;
  full_name: string;
  phone: string;
  password: string;
}

export interface AcceptInvitationResponse {
  message: string;
  token: string;
  user: User;
}

export async function acceptInvitation(
  data: AcceptInvitationData
): Promise<AcceptInvitationResponse> {
  return apiRequest<AcceptInvitationResponse>("/api/v1/auth/invitations/accept/", {
    method: "POST",
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Plans & Registration
// ---------------------------------------------------------------------------
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  max_users: number;
  max_customers: number;
  max_transactions_per_month: number;
  has_reports: boolean;
  has_audit_trail: boolean;
  has_api_access: boolean;
  has_mobile_money: boolean;
  has_bank_deposits: boolean;
  has_multi_branch: boolean;
  monthly_price: string;
  annual_price: string;
  currency: string;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiRequest<SubscriptionPlan[] | { results: SubscriptionPlan[] }>(
    "/api/v1/plans/"
  );
  return Array.isArray(res) ? res : res.results;
}

export interface CompanyRegistrationData {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address?: string;
  company_city?: string;
  company_country?: string;
  business_registration_number?: string;
  owner_email: string;
  owner_phone: string;
  owner_full_name: string;
  owner_password: string;
  subscription_plan: string;
}

export async function registerCompany(data: CompanyRegistrationData): Promise<void> {
  return apiRequest<void>("/api/v1/register/", {
    method: "POST",
    body: data,
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar: string | null;
  preferred_language: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  last_login_ip: string | null;
}

export interface Company {
  id: string;
  name: string;
  role: string;
}

export interface Membership {
  id: string;
  user: string;
  user_email: string;
  user_full_name: string;
  user_phone: string;
  user_avatar: string | null;
  company: string;
  company_name: string;
  role: string;
  branch: string | null;
  branch_name: string | null;
  is_active: boolean;
  joined_at: string;
  deactivated_at: string | null;
}

export interface BankDepositDetail {
  bank_name: string;
  account_number: string;
  account_name: string;
  depositor_name: string;
  slip_number: string;
  slip_image: string | null;
}

export interface MoMoDetail {
  network: string;
  service_type: string;
  sender_number: string;
  receiver_number: string;
  momo_reference: string;
}

export interface CashDetail {
  d_200: number;
  d_100: number;
  d_50: number;
  d_20: number;
  d_10: number;
  d_5: number;
  d_2: number;
  d_1: number;
  denomination_total: string;
}

/** Agent request — every financial operation submitted via the mobile app. */
export interface AgentRequest {
  id: string;
  reference: string;
  company: string;
  customer: string | null;
  customer_name: string | null;
  transaction_type: string;
  channel: string;
  status: string;
  amount: string;
  fee: string;
  requires_approval: boolean;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  bank_deposit_detail: BankDepositDetail | null;
  momo_detail: MoMoDetail | null;
  cash_detail: CashDetail | null;
  requested_at: string;
}

/** Alias kept for backward-compatibility with existing components. */
export type Transaction = AgentRequest;

export interface ProviderBalance {
  id: string;
  company: string;
  user: string;
  user_name: string;
  provider: string;
  provider_display: string;
  starting_balance: string;
  balance: string;
  last_updated: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  kyc_status: string;
  registered_by: string | null;
  created_at: string;
}

/** Matches the actual response from /api/v1/reports/dashboard/ */
export interface DashboardData {
  total_requests_today: number;
  total_deposits_today: string;
  total_withdrawals_today: string;
  total_fees_today: string;
  pending_approvals: number;
  total_customers: number;
  total_active_users: number;
  requests_by_channel: Record<string, number>;
  requests_by_status: Record<string, number>;
  recent_requests: AgentRequest[];
}
