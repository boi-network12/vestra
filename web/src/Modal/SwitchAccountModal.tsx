"use client";
import { LoginData, User } from '@/types/user';
import Image from 'next/image';
import React, { useState } from 'react'

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  isLoading: boolean;
  linkedAccounts?: User[];
  switchAccount?: (accountId: string) => Promise<boolean>;
  linkAccount?: (data: LoginData) => Promise<boolean>;
}


const SwitchAccountModal = ({ 
    open, 
    onClose, 
    user, 
    isLoading, 
    linkedAccounts, 
    switchAccount, 
    linkAccount 
}: Props) => {
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleLinkAccount = async () => {
    if (!linkAccount) return;
    setSubmitting(true);
    setError(null);
    try {
      const ok = await linkAccount(form);
      if (ok){
        setShowAddAccountForm(false);
        setForm({ email: "", password: "" })
      } else {
        setError("Failed to link account. Please try again.");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An error occurred while linking the account.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  const handleSwitch = async (id: string) => {
    if (!switchAccount) return;
    setSubmitting(true);
    try {
      await switchAccount(id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const firstLetter =
    user?.profile?.firstName?.charAt(0)?.toUpperCase() ??
    user?.username?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!submitting ? onClose : undefined}
      />
      {/* panel */}
      <div className="relative z-[1000] w-full md:max-w-md md:rounded-lg bg-white text-gray-900 shadow-lg max-h-[95vh] overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-base">Switch account</h2>
          <button
          disabled={submitting}
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Active account */}
          <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
            {user?.profile?.avatar ? (
              <Image
                src={user.profile.avatar}
                width={36}
                height={36}
                alt="avatar"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-600 text-white font-bold">
                {firstLetter}
              </div>
            )}

            <div className="flex-1">
              <p className="font-medium text-sm">
                {user?.username ?? "Guest"}
              </p>
              <p className="text-xs text-gray-500">Active account</p>
            </div>

            <span className="text-blue-500 text-sm font-semibold">●</span>
          </div>

          {/* Linked accounts */}
          {(linkedAccounts?.length ?? 0) > 0 && (
            <div className="space-y-1">
              {linkedAccounts!.map((acc) => (
                <button
                  key={acc._id ?? acc.username}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                  onClick={() => handleSwitch(acc._id!)}
                  disabled={isLoading || submitting}
                >
                  {acc.profile?.avatar ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden">
                      <Image
                        src={acc.profile.avatar}
                        alt="avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-600 text-white font-bold">
                      {acc.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{acc.username}</p>
                    {acc.email && (
                      <p className="text-xs text-gray-500">{acc.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add account toggle / form */}
          {!showAddAccountForm ? (
            <button
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-gray-600"
              onClick={() => setShowAddAccountForm(true)}
            >
              <span className="text-xl leading-none">＋</span>
              <span className="text-sm font-medium">Add account</span>
            </button>
          ) : (
            <div className="border border-gray-200 rounded p-3 space-y-3">
              <p className="font-medium text-sm">Add New Account</p>

              {error && (
                <p className="text-red-500 text-sm">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLinkAccount}
                  disabled={submitting}
                  className="flex-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 disabled:opacity-50"
                >
                  {submitting ? "Linking..." : "Link account"}
                </button>
                <button
                  onClick={() => {
                    setShowAddAccountForm(false);
                    setError(null);
                    setForm({ email: "", password: "" });
                  }}
                  disabled={submitting}
                  className="rounded border border-gray-300 text-gray-600 text-sm py-2 px-3 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SwitchAccountModal