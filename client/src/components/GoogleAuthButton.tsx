import React, { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
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

export interface GoogleAuthButtonProps {
  compact?: boolean;
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

export default function GoogleAuthButton({ compact = false, onSuccess }: GoogleAuthButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [customName, setCustomName] = useState("Ayush Sharma");
  const [customEmail, setCustomEmail] = useState("ayush@evolix.studio");

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
    import.meta.env.VITE_GOOGLE_CLIENT_ID || authConfig?.googleClientId || "";

  const [gisReady, setGisReady] = useState(Boolean(window.google?.accounts?.id));

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGisReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGisReady(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

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

  // Handle GIS credential callback
  const handleCredentialResponse = async (credential: string) => {
    setErrorNotice(null);
    try {
      const result = await googleLoginMutation.mutateAsync({ idToken: credential });
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
    if (!googleClientId || user || !window.google?.accounts?.id || !buttonRef.current) {
      return;
    }

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
        text: "continue_with",
        shape: "pill",
        width: compact ? 180 : 230,
      });
    } catch (e) {
      console.warn("[Google Identity] Render button initialization fallback:", e);
    }
  }, [googleClientId, user, compact, gisReady]);

  const handleManualLoginClick = () => {
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.prompt();
      } catch {
        setTestModalOpen(true);
      }
    } else {
      // In development or when VITE_GOOGLE_CLIENT_ID is not configured, show friendly test modal
      setTestModalOpen(true);
    }
  };

  const handleSimulatedTestLogin = async () => {
    setTestModalOpen(false);
    setErrorNotice(null);
    try {
      const mockToken = `mock-google-token:usr_${Date.now().toString(36)}:${encodeURIComponent(
        customName
      )}:${encodeURIComponent(customEmail)}`;
      const result = await googleLoginMutation.mutateAsync({ idToken: mockToken });
      await refetchUser();
      if (onSuccess && result.user) {
        onSuccess({
          name: result.user.name || "Google User",
          userId: result.user.userId,
          isNewUser: result.isNewUser,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Simulated login failed";
      setErrorNotice(msg);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
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

  // User is logged in: Display verified customer badge and dropdown
  if (user) {
    return (
      <div className="google-user-container" ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="google-user-pill"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="google-user-avatar">
            <UserIcon size={14} />
          </div>
          <span className="google-user-name">{user.name || "Google User"}</span>
          <CheckCircle2 size={13} className="google-verified-icon" />
          <ChevronDown size={13} className={`google-caret ${dropdownOpen ? "open" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="google-user-dropdown" role="menu">
            <div className="dropdown-header">
              <strong>{user.name}</strong>
              <small className="dropdown-user-id">{user.userId}</small>
              {user.email && <span className="dropdown-user-email">{user.email}</span>}
            </div>

            <div className="dropdown-privacy-note">
              <ShieldCheck size={14} className="privacy-icon" />
              <span>
                <strong>Anonymous in Chat:</strong> Your Google name and email are never shown to
                strangers.
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

  // User is not logged in: Display Continue with Google button
  return (
    <div className="google-auth-wrapper">
      {/* Official GIS container if configured */}
      {googleClientId ? (
        <div ref={buttonRef} className="google-gis-host" />
      ) : (
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
          <span>Continue with Google</span>
        </button>
      )}

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

      {/* Development / Staging Test Modal */}
      {testModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setTestModalOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-auth-title"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GoogleIcon size={20} />
                <h3 id="test-auth-title" style={{ margin: 0 }}>Google Authentication</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setTestModalOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", margin: "12px 0 16px" }}>
              {googleClientId
                ? "Sign in with your verified Google account. Your profile name will be captured and synchronized to the administrative Google Sheet."
                : "Development Mode: Google Client ID is not set in environment. You can test the full verification, MySQL registration, and Google Sheets sync flow below:"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Customer Name:
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    marginTop: 4,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Google Account Email:
                <input
                  type="email"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    marginTop: 4,
                  }}
                />
              </label>
            </div>

            <div style={{ background: "var(--subtle)", padding: 12, borderRadius: 8, marginTop: 14, fontSize: 12 }}>
              <ShieldCheck size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: -2 }} />
              <strong>Privacy Protection:</strong> Your verified Google name and email are used exclusively for administrative registration and are <strong>never</strong> shared with strangers in chat.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setTestModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleSimulatedTestLogin}
                disabled={googleLoginMutation.isPending}
              >
                {googleLoginMutation.isPending ? "Signing in..." : "Continue to Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
