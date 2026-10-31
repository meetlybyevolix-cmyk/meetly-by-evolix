import React, { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getFirstName, getFunkyAvatar } from "@/lib/funkyAvatar";
import {
  CheckCircle2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
            }
          ) => void;
          prompt: (momentListener?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

export const HARDCODED_GOOGLE_CLIENT_ID =
  "162654871088-dkiopg65foj48avnhhr34s3rs1v4ccq9.apps.googleusercontent.com";

export const GOOGLE_APPS_SCRIPT_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbwhyOz3RqpgSFZpiasjVZMMlAzuUAf8M8wJJqcrGCPOn5glQMv5-g1MFZKXQAC8KD4/exec";

export function postUserToGoogleSheet(userData: {
  userId: string;
  name?: string | null;
  email?: string | null;
  action?: "upsert" | "delete";
}) {
  try {
    fetch(GOOGLE_APPS_SCRIPT_WEBHOOK, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: userData.action || "upsert",
        userId: userData.userId,
        name: userData.name || "Google User",
        email: userData.email || "",
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: userData.action === "delete" ? "Deleted" : "Active",
        loginMethod: "Google",
      }),
    }).catch(() => {});
  } catch {}
}

export interface GoogleAuthButtonProps {
  compact?: boolean;
  buttonText?: "signin_with" | "signup_with" | "continue_with" | "signin";
  onSuccess?: (user: { name: string; userId: string; isNewUser: boolean }) => void;
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  compact = false,
  buttonText = "continue_with",
  onSuccess,
}: GoogleAuthButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current user from server session
  const { data: user, refetch: refetchUser, isLoading: userLoading } = trpc.auth.me.useQuery();

  const googleLoginMutation = trpc.auth.googleLogin.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  const { data: authConfig } = trpc.auth.config.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    authConfig?.googleClientId ||
    HARDCODED_GOOGLE_CLIENT_ID;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Auto-sync logged-in user to Google Sheet upon session mount
  useEffect(() => {
    if (user?.userId && !sessionStorage.getItem("meetly_sheet_synced_" + user.userId)) {
      sessionStorage.setItem("meetly_sheet_synced_" + user.userId, "true");
      postUserToGoogleSheet({
        userId: user.userId,
        name: user.name,
        email: user.email,
        action: "upsert",
      });
    }
  }, [user?.userId, user?.name, user?.email]);

  // Handle GIS credential callback
  const handleCredentialResponse = async (credential: string) => {
    setErrorNotice(null);
    try {
      const result = await googleLoginMutation.mutateAsync({ idToken: credential });
      if (result.sessionToken) {
        localStorage.setItem("meetly-auth-token", result.sessionToken);
      }
      if (result.user) {
        postUserToGoogleSheet({
          userId: result.user.userId,
          name: result.user.name,
          email: result.user.email,
          action: "upsert",
        });
      }
      await refetchUser();
      if (onSuccess && result.user) {
        onSuccess({
          name: result.user.name || "Google User",
          userId: result.user.userId,
          isNewUser: result.isNewUser,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google authentication failed";
      setErrorNotice(msg);
    }
  };

  // Initialize official Google Identity Services button
  useEffect(() => {
    if (!googleClientId || user || !buttonRef.current) {
      return;
    }

    const initGis = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: response => {
            if (response?.credential) {
              void handleCredentialResponse(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: compact ? "medium" : "large",
          text: buttonText,
          shape: "pill",
          width: compact ? 180 : 250,
        });
        return true;
      } catch (e) {
        console.warn("[Google Identity] Render button initialization error:", e);
        return false;
      }
    };

    if (initGis()) return;

    // Retry checking if script is still loading
    const interval = setInterval(() => {
      if (initGis()) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [googleClientId, user, compact, buttonText]);

  const handleManualLoginClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorNotice("Google authentication is loading. Please wait a moment.");
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      localStorage.removeItem("meetly-auth-token");
      await logoutMutation.mutateAsync();
      await refetchUser();
    } catch (err) {
      console.error("[Logout] Failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setDropdownOpen(false);
    try {
      if (user?.userId) {
        postUserToGoogleSheet({
          userId: user.userId,
          action: "delete",
        });
      }
      localStorage.removeItem("meetly-auth-token");
      await deleteAccountMutation.mutateAsync();
      await refetchUser();
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Account deletion failed");
    }
  };

  if (userLoading) {
    return (
      <div className="google-auth-loading">
        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
      </div>
    );
  }

  // User is logged in: Display verified user badge with funky avatar and profile dropdown
  if (user) {
    const username = getFirstName(user.name);
    const avatar = getFunkyAvatar(user.userId || user.name);

    return (
      <div className="google-user-container" ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="google-user-pill funky-user-pill"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          title={`Profile: ${username}`}
        >
          <div
            className="funky-avatar-circle"
            style={{
              background: avatar.bgGradient,
            }}
          >
            <span className="funky-avatar-emoji">{avatar.emoji}</span>
          </div>
          <span className="google-user-name">{username}</span>
          <CheckCircle2 size={13} className="google-verified-icon" />
          <ChevronDown size={13} className={`google-caret ${dropdownOpen ? "open" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="google-user-dropdown funky-user-dropdown" role="menu">
            <div className="dropdown-header funky-dropdown-header">
              <div
                className="funky-profile-avatar-large"
                style={{
                  background: avatar.bgGradient,
                  boxShadow: `0 4px 14px ${avatar.shadow}`,
                }}
              >
                <span className="funky-avatar-emoji-large">{avatar.emoji}</span>
                <span className="funky-avatar-online-dot" />
              </div>
              <div className="funky-profile-info">
                <div className="funky-profile-title-row">
                  <strong className="funky-profile-username">{username}</strong>
                  <span className="funky-profile-badge">18+ Verified</span>
                </div>
                {user.name && user.name !== username && (
                  <span className="funky-profile-fullname">{user.name}</span>
                )}
                <small className="dropdown-user-id">{user.userId}</small>
                {user.email && <span className="dropdown-user-email">{user.email}</span>}
              </div>
            </div>

            <div className="dropdown-privacy-note">
              <ShieldCheck size={14} className="privacy-icon" />
              <span>
                <strong>100% Anonymous in Chat:</strong> Your name and email are kept strictly private on the server.
              </span>
            </div>

            <div className="dropdown-divider" />

            <button
              type="button"
              className="dropdown-item"
              onClick={handleLogout}
              role="menuitem"
              disabled={logoutMutation.isPending}
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>

            <button
              type="button"
              className="dropdown-item danger"
              onClick={() => setShowDeleteConfirm(true)}
              role="menuitem"
            >
              <Trash2 size={15} />
              <span>Delete account & data</span>
            </button>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-backdrop" role="presentation">
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="del-title">
              <h3 id="del-title">Delete Account & Google Sheets Record?</h3>
              <p>
                This will mark your internal account as deleted in MySQL and update your row in the
                administrative Google Sheet to <strong>Deleted</strong>.
              </p>
              <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? "Deleting..." : "Confirm Deletion"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User is not logged in: Display official Google Identity button
  return (
    <div className="google-auth-wrapper">
      <div ref={buttonRef} className="google-gis-host">
        <button
          type="button"
          className={`google-signin-btn ${compact ? "compact" : ""}`}
          onClick={handleManualLoginClick}
          disabled={googleLoginMutation.isPending}
        >
          {googleLoginMutation.isPending ? (
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : (
            <GoogleIcon size={17} />
          )}
          <span>{buttonText === "signup_with" ? "Sign up with Google" : "Continue with Google"}</span>
        </button>
      </div>

      {errorNotice && (
        <div className="google-auth-error-popover" role="alert">
          <span>{errorNotice}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setErrorNotice(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
