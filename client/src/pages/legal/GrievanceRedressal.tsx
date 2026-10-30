import React, { useState } from "react";
import { LegalLayout } from "./LegalLayout";
import { AlertCircle, CheckCircle2, Clock, Copy, Loader2, Mail, MapPin, Search, Send, ShieldAlert, UserCheck } from "lucide-react";

export default function GrievanceRedressal() {
  const [complainantName, setComplainantName] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [category, setCategory] = useState<
    "content_removal" | "privacy_complaint" | "safety_concern" | "user_conduct" | "other"
  >("content_removal");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState("");
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
      const res = await fetch("/api/grievance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainantName,
          complainantEmail,
          category,
          subject,
          details,
          evidence: evidence || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details?.[0] || "Failed to submit grievance");
      }

      setSubmittedCode(data.ticketCode);
      setDetails("");
      setEvidence("");
      setSubject("");
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
      const res = await fetch(`/api/grievance/status/${encodeURIComponent(checkCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Grievance ticket not found");
      }
      setStatusResult(data);
    } catch (err: any) {
      setStatusError(err.message || "Failed to locate grievance ticket");
    } finally {
      setChecking(false);
    }
  };

  return (
    <LegalLayout
      title="Grievance Redressal Mechanism & Abuse Reporting"
      subtitle="Statutory grievance redressal under Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021."
      badge="Intermediary Compliance · Rule 3(2) IT Rules"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        {/* Designated Officer Info Box */}
        <section style={{ background: "var(--mint)", border: "1px solid var(--teal)", borderRadius: "10px", padding: "20px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--teal)", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserCheck size={18} /> Designated Grievance Officer Details
          </h2>
          <p style={{ fontSize: "13px", margin: "0 0 12px 0", color: "var(--ink)" }}>
            In accordance with Rule 3(2)(a) of the <em>Information Technology Rules, 2021</em>, the contact information of our designated Grievance Officer is published below:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Designation:</span>
              <strong>Grievance Officer, Meetly</strong>
            </div>
            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Officer Name:</span>
              <strong>[Grievance Officer Name Pending Formal Appointment]</strong>
            </div>
            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Official Email:</span>
              <a href="mailto:grievance@meetly.evolix.studio" style={{ color: "var(--teal)", fontWeight: 600 }}>
                grievance@meetly.evolix.studio
              </a>
            </div>
            <div>
              <span style={{ color: "var(--muted)", display: "block" }}>Physical Address for Grievances:</span>
              <span>[Physical Operational Address in India Pending Formal Verification by Operator]</span>
            </div>
          </div>
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(23,110,104,0.15)", fontSize: "12px", color: "var(--muted)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={14} className="text-teal" /> Statutory Acknowledgment: <strong>Within 24 Hours</strong>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={14} className="text-teal" /> Standard Resolution: <strong>Within 15 Days</strong>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--coral)" }}>
              <Clock size={14} /> Non-Consensual Imagery / CSAM: <strong>Within 24 Hours</strong>
            </span>
          </div>
        </section>

        {/* Portal Forms */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", marginTop: "20px" }}>
          {/* Submission Form */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "24px", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <ShieldAlert size={18} className="text-coral" /> File an Official Grievance
            </h3>

            {submittedCode ? (
              <div style={{ background: "var(--mint)", padding: "20px", borderRadius: "8px", border: "1px solid var(--teal)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)", fontWeight: 700, marginBottom: "8px" }}>
                  <CheckCircle2 size={20} /> Grievance Registered Successfully!
                </div>
                <p style={{ fontSize: "13px", margin: "0 0 12px 0" }}>
                  Your grievance ticket has been generated. Under Rule 3(2) of the IT Rules, 2021, an acknowledgment has been recorded. Save your ticket reference code:
                </p>
                <div style={{ background: "var(--card)", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", fontSize: "16px", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  The Grievance Officer will review your submission and communicate resolution to your email address within statutory time limits.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedCode(null)}
                  style={{ marginTop: "14px", padding: "6px 12px", fontSize: "12px", background: "none", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer" }}
                >
                  File Another Grievance
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Complainant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full legal name"
                    value={complainantName}
                    onChange={e => setComplainantName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Official Contact Email * (for statutory communications)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="complainant@example.com"
                    value={complainantEmail}
                    onChange={e => setComplainantEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Grievance Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  >
                    <option value="content_removal">Takedown Request: Non-Consensual Sexual Imagery or CSAM (24h Priority)</option>
                    <option value="safety_concern">Severe Safety Threat, Extortion, or Harassment</option>
                    <option value="privacy_complaint">Privacy Violation, Unauthorized Doxxing, or Impersonation</option>
                    <option value="user_conduct">Unlawful User Conduct or Terms Violation</option>
                    <option value="other">Other Statutory Complaint</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of grievance"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Factual Details & Chronology *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please provide exact details, date/time of occurrence, and description of the violation..."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Supporting Identifiers / Evidence (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Session token, report ID, network details, or URLs if applicable..."
                    value={evidence}
                    onChange={e => setEvidence(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", resize: "vertical" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    Do NOT upload or paste illegal media. Describe the material factually.
                  </span>
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
                    background: "var(--coral)",
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
                  {submitting ? "Registering..." : "Submit Formal Grievance"}
                </button>
              </form>
            )}
          </div>

          {/* Status Check Card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "24px", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <Search size={18} /> Track Existing Grievance Status
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>
              Under Rule 3(2), complainants can track the progress of their filed grievance using their unique ticket reference code.
            </p>

            <form onSubmit={handleCheckStatus} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                required
                placeholder="GRV-YYYYMMDD-XXXX"
                value={checkCode}
                onChange={e => setCheckCode(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", fontFamily: "monospace" }}
              />
              <button
                type="submit"
                disabled={checking}
                style={{ padding: "8px 16px", borderRadius: "6px", background: "var(--ink)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {checking ? <Loader2 size={15} className="animate-spin" /> : "Track"}
              </button>
            </form>

            {statusError && (
              <div style={{ color: "var(--coral)", fontSize: "13px", marginBottom: "12px" }}>
                {statusError}
              </div>
            )}

            {statusResult && (
              <div style={{ background: "var(--mint)", padding: "14px", borderRadius: "8px", border: "1px solid var(--teal)", fontSize: "13px" }}>
                <div><strong>Ticket Code:</strong> <code>{statusResult.ticketCode}</code></div>
                <div><strong>Category:</strong> {statusResult.category}</div>
                <div><strong>Status:</strong> <span style={{ textTransform: "capitalize", fontWeight: 700, color: "var(--teal)" }}>{statusResult.status}</span></div>
                <div><strong>Acknowledged:</strong> {new Date(statusResult.acknowledgedAt).toLocaleString()}</div>
                {statusResult.resolvedAt && (
                  <div><strong>Resolved:</strong> {new Date(statusResult.resolvedAt).toLocaleString()}</div>
                )}
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(23,110,104,0.2)" }}>
                  <strong>Officer Resolution Note:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "var(--ink)" }}>{statusResult.resolutionSummary}</p>
                </div>
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)", fontSize: "12px", color: "var(--muted)" }}>
              <strong>Appeals & Escalation:</strong> If you are not satisfied with the resolution provided by our Grievance Officer, you may appeal to the Grievance Appellate Committee (GAC) established under Rule 3A of the <em>Information Technology Rules, 2021</em> at <code>gac.gov.in</code>.
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}

