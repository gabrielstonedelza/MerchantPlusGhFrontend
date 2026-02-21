"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTeamMembers,
  updateTeamMember,
  deactivateTeamMember,
  createInvitation,
  TeamMember,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROLE_STYLES: Record<string, string> = {
  owner:   "bg-gold/15 text-gold border border-gold/30",
  admin:   "bg-purple-900/40 text-purple-300 border border-purple-700/40",
  manager: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  teller:  "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
};

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4, admin: 3, manager: 2, teller: 1,
};

const ALL_ROLES = ["admin", "manager", "teller"] as const;

// ---------------------------------------------------------------------------
// Avatar component
// ---------------------------------------------------------------------------
function Avatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];

  if (avatar) {
    return <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-dark-400`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center font-bold text-gold shrink-0`}>
      {initials || "?"}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-dark-900/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card glow-gold animate-slide-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-dark-300 hover:text-dark-50 transition-colors p-1 rounded hover:bg-dark-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TeamPage() {
  const token     = typeof window !== "undefined" ? localStorage.getItem("token")     || "" : "";
  const companyId = typeof window !== "undefined" ? localStorage.getItem("companyId") || "" : "";
  const myRole    = typeof window !== "undefined" ? localStorage.getItem("role")      || "" : "";
  const myId      = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("membership") || "{}").id || ""; } catch { return ""; } })() : "";

  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // --- Invite modal ---
  const [showInvite,    setShowInvite]    = useState(false);
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState("teller");
  const [inviting,      setInviting]      = useState(false);
  const [inviteError,   setInviteError]   = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // --- Edit modal ---
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editRole,   setEditRole]   = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editing,    setEditing]    = useState(false);
  const [editError,  setEditError]  = useState("");

  // --- Deactivate confirm ---
  const [deactivateTarget, setDeactivateTarget] = useState<TeamMember | null>(null);
  const [deactivating,     setDeactivating]     = useState(false);
  const [deactivateError,  setDeactivateError]  = useState("");

  // ---------------------------------------------------------------------------
  const fetchMembers = useCallback(async () => {
    if (!token || !companyId) return;
    setError("");
    try {
      const data = await getTeamMembers(token, companyId);
      setMembers(data);
    } catch {
      setError("Failed to load team members. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Roles the current user can assign (strictly below their own level)
  const assignableRoles = ALL_ROLES.filter(
    (r) => ROLE_HIERARCHY[r] < (ROLE_HIERARCHY[myRole] ?? 0)
  );

  // Can the current user manage a given member?
  const canManageMember = (m: TeamMember) =>
    m.id !== myId &&
    m.role !== "owner" &&
    ROLE_HIERARCHY[m.role] < (ROLE_HIERARCHY[myRole] ?? 0);

  const canInvite = ["owner", "admin", "manager"].includes(myRole) && assignableRoles.length > 0;

  // ---------------------------------------------------------------------------
  // Invite
  // ---------------------------------------------------------------------------
  async function handleInvite() {
    if (!inviteEmail.trim()) { setInviteError("Email address is required."); return; }
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await createInvitation(token, companyId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteEmail("");
      setInviteRole(assignableRoles[assignableRoles.length - 1] || "teller");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------
  function openEdit(m: TeamMember) {
    setEditTarget(m);
    setEditRole(m.role);
    setEditActive(m.is_active);
    setEditError("");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditing(true);
    setEditError("");
    try {
      const updated = await updateTeamMember(token, companyId, editTarget.id, {
        role: editRole,
        is_active: editActive,
      });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update member.");
    } finally {
      setEditing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Deactivate
  // ---------------------------------------------------------------------------
  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setDeactivateError("");
    try {
      await deactivateTeamMember(token, companyId, deactivateTarget.id);
      setMembers((prev) =>
        prev.map((m) => (m.id === deactivateTarget.id ? { ...m, is_active: false } : m))
      );
      setDeactivateTarget(null);
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : "Failed to deactivate member.");
    } finally {
      setDeactivating(false);
    }
  }

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
        <button onClick={fetchMembers} className="btn-secondary">Retry</button>
      </div>
    );
  }

  const active   = members.filter((m) => m.is_active);
  const inactive = members.filter((m) => !m.is_active);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Team Members</h1>
          <p className="text-dark-200 text-sm mt-1">
            {active.length} active{inactive.length > 0 ? ` · ${inactive.length} inactive` : ""}
          </p>
        </div>
        {canInvite && (
          <button
            onClick={() => {
              setShowInvite(true);
              setInviteSuccess("");
              setInviteError("");
              setInviteEmail("");
              setInviteRole(assignableRoles[assignableRoles.length - 1] || "teller");
            }}
            className="btn-primary inline-flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </button>
        )}
      </div>

      {/* ── Active members ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-400/50">
          <h2 className="text-sm font-semibold text-dark-200 uppercase tracking-wider">
            Active Members
          </h2>
        </div>
        <div className="divide-y divide-dark-400/30">
          {active.length === 0 && (
            <p className="text-dark-300 text-sm text-center py-10">No active members found.</p>
          )}
          {active.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canManage={canManageMember(member)}
              onEdit={() => openEdit(member)}
              onDeactivate={() => { setDeactivateTarget(member); setDeactivateError(""); }}
            />
          ))}
        </div>
      </div>

      {/* ── Inactive members ── */}
      {inactive.length > 0 && (
        <div className="card p-0 overflow-hidden opacity-70">
          <div className="px-6 py-4 border-b border-dark-400/50">
            <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
              Inactive Members
            </h2>
          </div>
          <div className="divide-y divide-dark-400/30">
            {inactive.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                canManage={canManageMember(member)}
                onEdit={() => openEdit(member)}
                onDeactivate={() => { setDeactivateTarget(member); setDeactivateError(""); }}
                isInactive
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInvite && (
        <Modal title="Add New User" onClose={() => setShowInvite(false)}>
          <div className="space-y-4">
            <p className="text-dark-200 text-sm">
              An invitation email will be sent to the user with a link to create their account.
            </p>
            {inviteError   && <ErrorBanner msg={inviteError} />}
            {inviteSuccess && (
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-4 py-3 text-emerald-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {inviteSuccess}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Role</label>
              <select
                className="input-field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-300 mt-1">
                {inviteRole === "teller"  && "Can process transactions and view customers."}
                {inviteRole === "manager" && "Can approve transactions and manage tellers."}
                {inviteRole === "admin"   && "Can manage team members and company settings."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowInvite(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {inviting ? "Sending…" : "Send Invitation"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <Modal title="Edit Team Member" onClose={() => setEditTarget(null)}>
          <div className="space-y-5">
            {/* Member header */}
            <div className="flex items-center gap-3 pb-4 border-b border-dark-400">
              <Avatar name={editTarget.user_full_name} avatar={editTarget.user_avatar} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-dark-50 truncate">{editTarget.user_full_name}</p>
                <p className="text-xs text-dark-300 truncate">{editTarget.user_email}</p>
                {editTarget.user_phone && (
                  <p className="text-xs text-dark-400 mt-0.5">{editTarget.user_phone}</p>
                )}
              </div>
            </div>

            {editError && <ErrorBanner msg={editError} />}

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Role</label>
              <select
                className="input-field"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEditActive(true)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    editActive
                      ? "bg-emerald-900/40 border-emerald-700/60 text-emerald-400"
                      : "bg-dark-500 border-dark-400 text-dark-300 hover:bg-dark-400"
                  }`}
                >
                  ● Active
                </button>
                <button
                  onClick={() => setEditActive(false)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    !editActive
                      ? "bg-red-900/40 border-red-800/60 text-red-400"
                      : "bg-dark-500 border-dark-400 text-dark-300 hover:bg-dark-400"
                  }`}
                >
                  ○ Inactive
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditTarget(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editing}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {editing ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Deactivate confirm ── */}
      {deactivateTarget && (
        <Modal title="Deactivate Member" onClose={() => setDeactivateTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-xl p-4">
              <Avatar name={deactivateTarget.user_full_name} avatar={deactivateTarget.user_avatar} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-dark-50 truncate">{deactivateTarget.user_full_name}</p>
                <p className="text-xs text-dark-300 truncate">{deactivateTarget.user_email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${ROLE_STYLES[deactivateTarget.role] || ""}`}>
                  {deactivateTarget.role}
                </span>
              </div>
            </div>
            <p className="text-dark-200 text-sm leading-relaxed">
              This will revoke{" "}
              <strong className="text-dark-50">{deactivateTarget.user_full_name}&apos;s</strong>{" "}
              access immediately. They will not be able to log in until reactivated.
            </p>
            {deactivateError && <ErrorBanner msg={deactivateError} />}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeactivateTarget(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 py-2 px-4 rounded-lg bg-red-900/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                {deactivating ? "Deactivating…" : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member row component
// ---------------------------------------------------------------------------
function MemberRow({
  member,
  canManage,
  onEdit,
  onDeactivate,
  isInactive = false,
}: {
  member: TeamMember;
  canManage: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  isInactive?: boolean;
}) {
  const joined = new Date(member.joined_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={`flex items-center gap-4 px-6 py-4 hover:bg-dark-500/30 transition-colors ${isInactive ? "opacity-60" : ""}`}>
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar name={member.user_full_name} avatar={member.user_avatar} size="md" />
        {!isInactive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm ${isInactive ? "text-dark-300 line-through" : "text-dark-50"}`}>
            {member.user_full_name}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[member.role] || "bg-dark-400 text-dark-200"}`}>
            {member.role}
          </span>
          {isInactive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-dark-400 text-dark-300 border border-dark-300/30">
              inactive
            </span>
          )}
        </div>
        <p className="text-xs text-dark-300 mt-0.5 truncate">{member.user_email}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {member.user_phone && (
            <span className="text-xs text-dark-400">{member.user_phone}</span>
          )}
          {member.branch_name && (
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {member.branch_name}
            </span>
          )}
          <span className="text-xs text-dark-400">Joined {joined}</span>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            title="Edit member"
            className="p-2 rounded-lg hover:bg-dark-400 transition-colors text-dark-300 hover:text-dark-50 group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {member.is_active && (
            <button
              onClick={onDeactivate}
              title="Deactivate member"
              className="p-2 rounded-lg hover:bg-red-900/30 transition-colors text-dark-300 hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
