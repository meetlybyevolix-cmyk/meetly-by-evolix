import React, { useState } from "react";
import { LegalLayout } from "./LegalLayout";
import { getApiUrl } from "@/lib/api";
import { AlertCircle, CheckCircle2, Copy, FileText, Loader2, Search, Send, ShieldCheck } from "lucide-react";

export default function DataRights() {
  const [requestType, setRequestType] = useState<
    "access_summary" | "erasure" | "correction" | "consent_withdrawal" | "inquiry"
  >("access_summary");
  const [contactEmail, setContactEmail] = useState("");
  const [sessionHash, setSessionHash] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Status check state
  const [checkCode, setCheckCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl("/api/privacy/data-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          contactEmail,
          sessionIdentifierHash: sessionHash || undefined,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details?.[0] || "Failed to submit request");
      }

      setSubmittedCode(data.requestCode);
      setDetails("");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError("");
    setStatusResult(null);
    if (!checkCode.trim()) return;

    setChecking(true);
    try {
      const res = await fetch(getApiUrl(`/api/privacy/data-request/${encodeURIComponent(checkCode.trim())}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request code not found");
      }
      setStatusResult(data);
    } catch (err: any) {
      setStatusError(err.message || "Failed to locate request");
    } finally {
      setChecking(false);
    }
  };

  return (
    <LegalLayout
      title="Privacy & Data Subject Rights Portal"
      subtitle="Exercise your rights under the Digital Personal Data Protection Act, 2023 (DPDP) and international data privacy regulations without needing an account."
      badge="Data Principal Rights (DPDP Act, 2023)"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 10px 0" }}>
            How Data Rights Work on an Anonymous Platform
          </h2>
          <p>
            Because Meetly does not maintain permanent user accounts, phone numbers, or passwords, exercising your data rights is designed to preserve your privacy:
          </p>
          <ul>
            <li><strong>Data Minimization Notice:</strong> Ordinary chat messages are held only in temporary RAM and automatically purged when a chat ends. We have zero chat history to access, export, or delete.</li>
            <li><strong>Technical Records:</strong> We process temporary session hashes, abuse report records, and statutory CERT-In system logs (kept for 180 days).</li>
            <li><strong>No Disproportionate Verification:</strong> We will never ask you to upload government photo IDs (like Aadhaar or passports) merely to exercise your rights on an anonymous platform. We authenticate requests using contact email confirmations or session hashes.</li>
          </ul>
        </section>

        {/* Submission & Tracking Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", marginTop: "20px" }}>
          {/* Form Card */}
          <div style={{ background: "var(--mint)", border: "1px solid var(--line)", padding: "24px", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)" }}>
              <FileText size={18} /> Submit a Data Rights Request
            </h3>

            {submittedCode ? (
              <div style={{ background: "var(--card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--teal)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)", fontWeight: 700, marginBottom: "8px" }}>
                  <CheckCircle2 size={20} /> Request Successfully Registered!
                </div>
                <p style={{ fontSize: "13px", margin: "0 0 12px 0" }}>
                  Your request has been officially recorded under the <em>DPDP Act, 2023</em>. Please save your reference tracking code:
                </p>
                <div style={{ background: "var(--mint)", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", fontSize: "16px", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{submittedCode}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(submittedCode)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--teal)" }}
                    title="Copy code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "12px 0 0 0" }}>
                  Our Privacy Officer will review your request and reply to your contact email.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedCode(null)}
                  style={{ marginTop: "14px", padding: "6px 12px", fontSize: "12px", background: "none", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer" }}
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Request Type *
                  </label>
                  <select
                    value={requestType}
                    onChange={e => setRequestType(e.target.value as any)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--card)" }}
                  >
                    <option value="access_summary">Right to Access Summary of Personal Data</option>
                    <option value="erasure">Right to Erasure / Deletion</option>
                    <option value="correction">Right to Correction of Inaccurate Data</option>
                    <option value="consent_withdrawal">Withdrawal of Optional Consent</option>
                    <option value="inquiry">General Privacy Inquiry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Your Contact Email * (for receiving reply)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--card)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Session Token or Report Reference (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Session Hash or Report ID"
                    value={sessionHash}
                    onChange={e => setSessionHash(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--card)" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    If you are inquiring about a specific chat session or abuse report.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Request Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please specify your request or question in detail..."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--card)", resize: "vertical" }}
                  />
                </div>

                {errorMsg && (
                  <div style={{ color: "var(--coral)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={15} /> {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: "var(--teal)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? "Submitting..." : "Submit Data Request"}
                </button>
              </form>
            )}
          </div>

          {/* Status Check Card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "24px", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <Search size={18} /> Track Existing Request Status
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>
              Enter the reference code you received upon submitting your data request to check its review status.
            </p>

            <form onSubmit={handleCheckStatus} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                required
                placeholder="DSR-YYYYMMDD-XXXX"
                value={checkCode}
                onChange={e => setCheckCode(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", fontFamily: "monospace" }}
              />
              <button
                type="submit"
                disabled={checking}
                style={{ padding: "8px 16px", borderRadius: "6px", background: "var(--ink)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {checking ? <Loader2 size={15} className="animate-spin" /> : "Check"}
              </button>
            </form>

            {statusError && (
              <div style={{ color: "var(--coral)", fontSize: "13px", marginBottom: "12px" }}>
                {statusError}
              </div>
            )}

            {statusResult && (
              <div style={{ background: "var(--paper)", padding: "14px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}>
                <div><strong>Code:</strong> <code>{statusResult.requestCode}</code></div>
                <div><strong>Status:</strong> <span style={{ textTransform: "capitalize", fontWeight: 600, color: "var(--teal)" }}>{statusResult.status}</span></div>
                <div><strong>Submitted:</strong> {new Date(statusResult.createdAt).toLocaleDateString()}</div>
                {statusResult.resolvedAt && (
                  <div><strong>Processed:</strong> {new Date(statusResult.resolvedAt).toLocaleDateString()}</div>
                )}
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--line)" }}>
                  <strong>Response Summary:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "var(--ink)" }}>{statusResult.summary}</p>
                </div>
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)", fontSize: "12px", color: "var(--muted)" }}>
              <strong>Direct Email Inquiries:</strong> You may also contact our Data Protection Officer at <code>privacy@meetly.evolix.studio</code>.
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}

