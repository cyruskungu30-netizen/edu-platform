"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AccountSettingsFormProps = {
  userId: string;
  email: string;
  initialFullName: string;
  initialAvatarUrl: string;
};

export default function AccountSettingsForm({
  userId,
  email,
  initialFullName,
  initialAvatarUrl,
}: AccountSettingsFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const cleanName = fullName.trim();
      const cleanAvatarUrl = avatarUrl.trim();

      if (!cleanName) {
        setProfileError("Please enter your full name.");
        return;
      }

      if (cleanName.length > 120) {
        setProfileError(
          "Your full name must be 120 characters or less.",
        );
        return;
      }

      if (cleanAvatarUrl && !/^https?:\/\/.+/i.test(cleanAvatarUrl)) {
        setProfileError(
          "Avatar URL must start with http:// or https://.",
        );
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setProfileError(
          "Your session has expired. Please sign in again.",
        );
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          avatar_url: cleanAvatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setFullName(cleanName);
      setAvatarUrl(cleanAvatarUrl);

      setProfileMessage("Your profile has been updated successfully.");

      window.setTimeout(() => {
        setProfileMessage("");
      }, 4000);
    } catch (caughtError) {
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    setChangingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      if (!currentPassword) {
        setPasswordError("Enter your current password.");
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError(
          "Your new password must contain at least 8 characters.",
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("The new passwords do not match.");
        return;
      }

      if (newPassword === currentPassword) {
        setPasswordError(
          "Your new password must be different from your current password.",
        );
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setPasswordError(
          "Your session has expired. Please sign in again.",
        );
        return;
      }

      if (!user.email) {
        setPasswordError(
          "No email address is associated with this account.",
        );
        return;
      }

      /*
       * Supabase does not require the old password when calling
       * updateUser(). We verify the current password first by
       * re-authenticating the user.
       */

      const { error: verifyError } = await supabase.auth.signInWithPassword(
        {
          email: user.email,
          password: currentPassword,
        },
      );

      if (verifyError) {
        setPasswordError("Your current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Your password has been changed successfully.",
      );

      window.setTimeout(() => {
        setPasswordMessage("");
      }, 4000);
    } catch (caughtError) {
      setPasswordError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* PROFILE */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <User className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Profile Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your EduMarket profile information up to date.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {profileMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <p className="font-semibold">{profileMessage}</p>
            </div>
          )}

          {profileError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {profileError}
            </div>
          )}

          <div className="mb-7 flex flex-col items-center gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || "Profile"}
                className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white shadow-sm">
                {initials}
              </div>
            )}

            <div className="text-center sm:text-left">
              <p className="font-black text-slate-900">
                Profile photo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add an image URL below to personalize your account.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Full Name
              </label>

              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={120}
                disabled={savingProfile}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="account-email"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Email Address
              </label>

              <input
                id="account-email"
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />

              <p className="mt-2 text-xs text-slate-400">
                Your authentication email is managed securely by Supabase.
              </p>
            </div>

            <div>
              <label
                htmlFor="avatar-url"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Profile Image URL
              </label>

              <input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                disabled={savingProfile}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Password & Security
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Change your password and keep your account secure.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {passwordMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <p className="font-semibold">{passwordMessage}</p>
            </div>
          )}

          {passwordError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {passwordError}
            </div>
          )}

          <div className="space-y-5">
            <PasswordField
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              onToggle={() =>
                setShowCurrentPassword((value) => !value)
              }
              disabled={changingPassword}
              placeholder="Enter current password"
            />

            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((value) => !value)}
              disabled={changingPassword}
              placeholder="At least 8 characters"
            />

            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword((value) => !value)
              }
              disabled={changingPassword}
              placeholder="Repeat your new password"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <p className="text-xs leading-5 text-slate-500">
                Use a strong password with a combination of letters, numbers,
                and symbols. Never share your password with anyone.
              </p>
            </div>

            <button
              type="button"
              onClick={changePassword}
              disabled={changingPassword}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={
            id === "current-password"
              ? "current-password"
              : "new-password"
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}