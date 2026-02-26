"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  createInvitation,
  TeamMember,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROLE_STYLES: Record<string, string> = {
  owner: "bg-gold/15 text-gold border border-gold/30",
  agent: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40",
};

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
export default function AgentsPage() {
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    setCompanyId(localStorage.getItem("companyId") || "");
  }, []);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Invite modal ---
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // --- Edit modal ---
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // --- Delete confirm ---
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ---------------------------------------------------------------------------
  const fetchMembers = useCallback(async () => {
    if (!companyId) return;
    setError("");
    try {
      const data = await getTeamMembers(companyId);
      setMembers(data);
    } catch {
      setError("Failed to load agents. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ---------------------------------------------------------------------------
  // Invite
  // ---------------------------------------------------------------------------
  async function handleInvite() {
    if (!inviteEmail.trim()) { setInviteError("Email address is required."); return; }
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await createInvitation(companyId, { email: inviteEmail.trim(), role: "agent" });
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteEmail("");
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
    setEditName(m.user_full_name);
    setEditEmail(m.user_email);
    setEditPhone(m.user_phone || "");
    setEditError("");
  }

  async function handleEdit() {
    if (!editTarget) return;
    if (!editName.trim()) { setEditError("Full name is required."); return; }
    if (!editEmail.trim()) { setEditError("Email is required."); return; }

    setEditing(true);
    setEditError("");
    try {
      const updated = await updateTeamMember(companyId, editTarget.id, {
        full_name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update agent.");
    } finally {
      setEditing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteTeamMember(companyId, deleteTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete agent.");
    } finally {
      setDeleting(false);
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Agents</h1>
          <p className="text-dark-200 text-sm mt-1">
            {members.length} agent{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setShowInvite(true);
            setInviteSuccess("");
            setInviteError("");
            setInviteEmail("");
          }}
          className="btn-primary inline-flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Agent
        </button>
      </div>

      {/* ── Agents list ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-400/50">
          <h2 className="text-sm font-semibold text-dark-200 uppercase tracking-wider">
            Your Agents
          </h2>
        </div>
        <div className="divide-y divide-dark-400/30">
          {members.length === 0 && (
            <div className="text-center py-14">
              <svg className="w-12 h-12 text-dark-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-dark-300 text-sm">No agents yet.</p>
              <p className="text-dark-400 text-xs mt-1">Click &quot;Add New Agent&quot; to invite your first agent.</p>
            </div>
          )}
          {members.map((member) => (
            <AgentRow
              key={member.id}
              member={member}
              onEdit={() => openEdit(member)}
              onDelete={() => { setDeleteTarget(member); setDeleteError(""); }}
            />
          ))}
        </div>
      </div>

      {/* ── Invite modal ── */}
      {showInvite && (
        <Modal title="Add New Agent" onClose={() => setShowInvite(false)}>
          <div className="space-y-4">
            <p className="text-dark-200 text-sm">
              An invitation email will be sent to the agent with a link to create their account.
            </p>
            {inviteError && <ErrorBanner msg={inviteError} />}
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
                placeholder="agent@example.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="bg-dark-500 border border-dark-400 rounded-lg px-4 py-3">
              <p className="text-sm text-dark-200">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mr-2 ${ROLE_STYLES.agent}`}>
                  Agent
                </span>
                Can process transactions, view customers, and manage daily operations via the mobile app.
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
                {inviting ? "Sending\u2026" : "Send Invitation"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit agent modal ── */}
      {editTarget && (
        <Modal title="Edit Agent" onClose={() => setEditTarget(null)}>
          <div className="space-y-5">
            {/* Agent header */}
            <div className="flex items-center gap-3 pb-4 border-b border-dark-400">
              <Avatar name={editTarget.user_full_name} avatar={editTarget.user_avatar} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-dark-50 truncate">{editTarget.user_full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[editTarget.role] || ""}`}>
                  {editTarget.role}
                </span>
              </div>
            </div>

            {editError && <ErrorBanner msg={editError} />}

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Agent name"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="agent@example.com"
                value={editEmail}
                onChange={(e) => { setEditEmail(e.target.value); setEditError(""); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="+233 XX XXX XXXX"
                value={editPhone}
                onChange={(e) => { setEditPhone(e.target.value); setEditError(""); }}
              />
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
                {editing ? "Saving\u2026" : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <Modal title="Delete Agent" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-xl p-4">
              <Avatar name={deleteTarget.user_full_name} avatar={deleteTarget.user_avatar} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-dark-50 truncate">{deleteTarget.user_full_name}</p>
                <p className="text-xs text-dark-300 truncate">{deleteTarget.user_email}</p>
              </div>
            </div>
            <p className="text-dark-200 text-sm leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-dark-50">{deleteTarget.user_full_name}&apos;s</strong>{" "}
              account? This action cannot be undone. They will lose access immediately
              and their account will be removed.
            </p>
            {deleteError && <ErrorBanner msg={deleteError} />}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 px-4 rounded-lg bg-red-900/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting\u2026" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent row component
// ---------------------------------------------------------------------------
function AgentRow({
  member,
  onEdit,
  onDelete,
}: {
  member: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const joined = new Date(member.joined_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-dark-500/30 transition-colors">
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar name={member.user_full_name} avatar={member.user_avatar} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-600" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-dark-50">
            {member.user_full_name}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[member.role] || "bg-dark-400 text-dark-200"}`}>
            {member.role}
          </span>
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
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          title="Edit agent"
          className="p-2 rounded-lg hover:bg-dark-400 transition-colors text-dark-300 hover:text-dark-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          title="Delete agent"
          className="p-2 rounded-lg hover:bg-red-900/30 transition-colors text-dark-300 hover:text-red-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
