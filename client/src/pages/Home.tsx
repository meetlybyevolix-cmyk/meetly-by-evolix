import { trpc } from "@/lib/trpc";
import VideoCall from "@/components/VideoCall";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  Shuffle,
  Sparkles,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";

type Mode = "home" | "consent" | "preferences" | "searching" | "chat";
type MediaMode = "text" | "video";
type Message = { id: string; text: string; sentAt: number; fromMe: boolean };
type WireEvent =
  | {
      type: "state";
      state: "idle" | "searching" | "chat";
      messages?: Message[];
      mediaMode?: MediaMode;
    }
  | { type: "message"; message: Message }
  | { type: "notice"; message: string }
  | { type: "video-status"; readyCount: number; active: boolean }
  | { type: "video-start"; offerer: boolean }
  | { type: "video-signal"; signal: unknown }
  | { type: "video-stopped"; message: string }
  | { type: "video-error"; message: string };

const interests = [
  "Music",
  "Gaming",
  "Movies",
  "Technology",
  "Travel",
  "Business",
  "Language learning",
  "Sports",
  "Art & design",
  "General conversation",
] as const;
const languages = [
  "Any",
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Portuguese",
  "Arabic",
  "Japanese",
  "Other",
] as const;
type Interest = (typeof interests)[number];
type Language = (typeof languages)[number];
const reportReasons = [
  "Harassment or bullying",
  "Sexual or explicit content",
  "Suspected minor",
  "Threats or violent behavior",
  "Spam or scams",
  "Hate or abusive language",
  "Impersonation",
  "Other safety concern",
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label="Meetly home"
    >
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span>
        meetly<span className="brand-period">.</span>
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>Text chat and opt-in video conversations; no profiles.</span>
      <nav aria-label="Site information">
        <Link href="/safety">Safety</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/guidelines">Guidelines</Link>
      </nav>
    </footer>
  );
}

function LogoLine() {
  return (
    <div className="brand-note">
      <span className="brand-note-icon">
        <ShieldCheck size={16} />
      </span>
      <span>
        18+ only <span className="note-separator">·</span> no profiles
      </span>
    </div>
  );
}

function MediaModePicker({
  value,
  onChange,
}: {
  value: MediaMode;
  onChange: (value: MediaMode) => void;
}) {
  return (
    <fieldset className="media-mode-picker">
      <legend>Chat mode</legend>
      <div className="media-mode-options">
        <button
          type="button"
          aria-pressed={value === "text"}
          className={`media-mode-option ${value === "text" ? "selected" : ""}`}
          onClick={() => onChange("text")}
        >
          <MessageCircle size={16} />
          <span>
            <strong>Text only</strong>
            <small>Simple text chat</small>
          </span>
        </button>
        <button
          type="button"
          aria-pressed={value === "video"}
          className={`media-mode-option ${value === "video" ? "selected" : ""}`}
          onClick={() => onChange("video")}
        >
          <Video size={16} />
          <span>
            <strong>Video chat</strong>
            <small>Both people opt in first</small>
          </span>
        </button>
      </div>
      {value === "video" && (
        <p className="media-mode-warning">
          Direct WebRTC uses Google STUN, not a privacy relay. Your chat partner
          and the STUN provider may learn your network IP, and some networks may
          not connect. Camera and microphone remain local until both people opt
          in. No call media is recorded or stored; another participant could
          capture their screen. Age is self-attested and staffed media
          moderation is not available. Choose text if you do not accept these
          risks.
        </p>
      )}
    </fieldset>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("home");
  const [mediaMode, setMediaMode] = useState<MediaMode>("text");
  const [sessionToken, setSessionToken] = useState("");
  const [liveSocket, setLiveSocket] = useState<WebSocket | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [language, setLanguage] = useState<Language>("Any");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    (typeof reportReasons)[number] | ""
  >("");
  const [reportDescription, setReportDescription] = useState("");
  const [includeExcerpt, setIncludeExcerpt] = useState(false);
  const [leaveAfterReport, setLeaveAfterReport] = useState(true);
  const [reportComplete, setReportComplete] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportDialogRef = useRef<HTMLElement>(null);
  const reportTriggerRef = useRef<HTMLButtonElement>(null);

  const createSession = trpc.chat.session.create.useMutation();
  const search = trpc.chat.search.useMutation();
  const sendMessage = trpc.chat.send.useMutation();
  const next = trpc.chat.next.useMutation();
  const end = trpc.chat.end.useMutation();
  const block = trpc.chat.block.useMutation();
  const report = trpc.chat.report.useMutation();

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("meetly-session");
      if (token) {
        setSessionToken(token);
        const consent = sessionStorage.getItem("meetly-consent");
        if (consent === "confirmed") setAdultConfirmed(true);
      }
    } catch {
      /* This browser will need session storage for an anonymous session. */
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const connect = () => {
      if (stopped) return;
      const url = new URL("/api/chat/live", window.location.href);
      url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(url.toString());
      socketRef.current = socket;
      setLiveSocket(socket);
      socket.onopen = () => {
        attempts = 0;
        socket.send(JSON.stringify({ type: "auth", token: sessionToken }));
      };
      socket.onmessage = event => {
        try {
          const update = JSON.parse(String(event.data)) as WireEvent;
          if (update.type === "message") {
            setMessages(current =>
              current.some(item => item.id === update.message.id)
                ? current
                : [...current, update.message]
            );
          } else if (update.type === "notice") {
            setNotice(update.message);
          } else if (update.type === "state") {
            if (update.mediaMode) setMediaMode(update.mediaMode);
            if (update.state === "chat") {
              setMode("chat");
              setMessages(update.messages ?? []);
              setNotice("");
              setReportComplete(false);
            } else if (update.state === "searching") {
              setMode("searching");
              setMessages([]);
            } else {
              setMessages([]);
              setMode(current => (current === "chat" ? "home" : current));
            }
          }
        } catch {
          setNotice("We couldn’t read a chat update. Please try again.");
        }
      };
      socket.onclose = event => {
        if (socketRef.current === socket) {
          socketRef.current = null;
          setLiveSocket(null);
        }
        if (stopped) return;
        if (event.code === 4401) {
          setNotice("Your temporary session expired. Start again to continue.");
          setSessionToken("");
          try {
            sessionStorage.removeItem("meetly-session");
          } catch {
            /* no-op */
          }
          setMode("home");
          return;
        }
        attempts += 1;
        retryTimer = setTimeout(connect, Math.min(1000 * attempts, 5000));
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [sessionToken]);

  useEffect(() => {
    if (mode !== "chat") return;
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
    inputRef.current?.focus();
  }, [messages, mode]);

  useEffect(() => {
    if (!reportOpen) return;
    const dialog = reportDialogRef.current;
    const returnFocus = reportTriggerRef.current;
    const focusable = () =>
      dialog?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])"
      ) ?? [];
    dialog?.querySelector<HTMLElement>("#report-reason")?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setReportOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(focusable());
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocus?.focus();
    };
  }, [reportOpen]);

  const startSearching = async (randomOnly = false) => {
    setNotice("");
    setMessages([]);
    if (randomOnly) {
      setSelectedInterests([]);
      setLanguage("Any");
    }
    try {
      let token = sessionToken;
      if (!token) {
        const result = await createSession.mutateAsync({
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: {
            interests: randomOnly ? [] : selectedInterests,
            language: randomOnly ? "Any" : language,
            mediaMode,
          },
        });
        token = result.token;
        setSessionToken(token);
        try {
          sessionStorage.setItem("meetly-session", token);
          sessionStorage.setItem("meetly-consent", "confirmed");
        } catch {
          throw new Error(
            "This browser blocked temporary session storage. Allow session storage and try again."
          );
        }
      }
      setMode("searching");
      await search.mutateAsync({
        preferences: {
          interests: randomOnly ? [] : selectedInterests,
          language: randomOnly ? "Any" : language,
          mediaMode,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /session has expired/i.test(error.message)
      ) {
        setSessionToken("");
        try {
          sessionStorage.removeItem("meetly-session");
        } catch {
          /* no-op */
        }
      }
      setMode("preferences");
      setNotice(
        error instanceof Error
          ? error.message
          : "We couldn’t start a search. Please try again."
      );
    }
  };

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests(current =>
      current.includes(interest)
        ? current.filter(item => item !== interest)
        : current.length < 5
          ? [...current, interest]
          : current
    );
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setNotice("");
    try {
      await sendMessage.mutateAsync({ text });
      setDraft("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your message wasn’t sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleComposerKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleNext = async () => {
    setMessages([]);
    setNotice("");
    setMode("searching");
    try {
      await next.mutateAsync();
    } catch (error) {
      setMode("home");
      setNotice(
        error instanceof Error
          ? error.message
          : "We couldn’t find another conversation."
      );
    }
  };

  const handleEnd = async () => {
    setMode("home");
    setMessages([]);
    setNotice("");
    try {
      await end.mutateAsync();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Your chat has ended locally."
      );
    }
  };

  const handleBlock = async () => {
    setMode("home");
    setMessages([]);
    setNotice("This person is blocked for this temporary session.");
    try {
      await block.mutateAsync();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "We couldn’t complete the block. The chat has ended."
      );
    }
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!reportReason) return;
    try {
      await report.mutateAsync({
        reason: reportReason,
        description: reportDescription.trim(),
        selectedExcerpt: includeExcerpt
          ? messages
              .slice(-6)
              .map(
                message =>
                  `${message.fromMe ? "You" : "Stranger"}: ${message.text}`
              )
              .join("\n")
              .slice(0, 1000)
          : undefined,
        leaveAfter: leaveAfterReport,
      });
      setReportOpen(false);
      setReportComplete(true);
      setReportDescription("");
      setIncludeExcerpt(false);
      if (leaveAfterReport) {
        setMessages([]);
        setMode("home");
        setNotice("Report received. The conversation has ended.");
      } else {
        setNotice("Report received. Thank you for letting us know.");
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The report couldn’t be submitted. Please try again."
      );
    }
  };

  const sessionWorking = createSession.isPending || search.isPending;
  const canStart =
    adultConfirmed && termsAccepted && privacyAccepted && !sessionWorking;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-right">
          <span className="text-mode-pill">
            <span className="live-dot" />
            Text · opt-in video
          </span>
          <Link href="/safety" className="top-link">
            <CircleHelp size={16} />
            Safety first
          </Link>
        </div>
      </header>

      {mode === "home" && (
        <main className="landing-main">
          {notice && (
            <div className="home-notice" role="status">
              {notice}
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="hero-layout">
            <section className="hero-copy">
              <LogoLine />
              <h1>
                One small hello
                <br />
                <em>can go anywhere.</em>
              </h1>
              <p className="hero-description">
                Meet someone new, one conversation at a time. No profiles or
                contact details—just a chance to talk. Choose simple text or
                opt-in video chat.
              </p>
              <button
                className="button button-primary button-large"
                onClick={() => {
                  setMode("preferences");
                  setNotice("");
                }}
              >
                Start chatting <ArrowRight size={18} />
              </button>
              <button
                className="random-start-link"
                onClick={() => {
                  setMode("consent");
                  setNotice("");
                }}
              >
                No preferences—just a random chat <ArrowRight size={14} />
              </button>
              <div className="hero-trust">
                <span>
                  <Check size={15} />
                  Adults 18+
                </span>
                <span>
                  <Check size={15} />
                  No sign-up
                </span>
                <span>
                  <Check size={15} />
                  Leave any time
                </span>
              </div>
            </section>
            <aside className="hero-aside" aria-label="How Meetly works">
              <div className="aside-topline">
                <span className="aside-eyebrow">
                  <Sparkles size={14} />A fresh perspective
                </span>
                <span className="aside-number">01 / 03</span>
              </div>
              <div className="conversation-illustration" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="orbit-star star-a">✳</span>
                <span className="orbit-star star-b">✦</span>
                <div className="person-card person-card-a">
                  <span className="person-avatar avatar-sun">
                    <UserRound size={19} />
                  </span>
                  <span>
                    <b>Someone new</b>
                    <small>Somewhere in the world</small>
                  </span>
                  <span className="tiny-online" />
                </div>
                <div className="chat-bubble bubble-left">
                  What’s a song you never skip?
                </div>
                <div className="chat-bubble bubble-right">
                  The one that reminds me of summer.
                </div>
                <div className="connecting-line">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="aside-caption">
                <span className="caption-icon">
                  <MessageCircle size={17} />
                </span>
                <span>
                  <strong>A conversation, not a profile.</strong>
                  <small>
                    Text needs no profile; video is shared only when you opt in.
                  </small>
                </span>
                <ChevronRight size={17} className="caption-chevron" />
              </div>
            </aside>
          </div>
          <section className="privacy-ribbon">
            <div className="ribbon-icon">
              <LockKeyhole size={18} />
            </div>
            <div>
              <strong>
                Text chat needs no profile; video shares your live camera.
              </strong>
              <p>
                Opt-in video may reveal your face, voice and network IP to the
                matched person and STUN provider. Ordinary text messages aren’t
                saved as chat history.
              </p>
            </div>
            <Link href="/privacy">
              How privacy works <ArrowRight size={15} />
            </Link>
          </section>
          <section className="steps-row" aria-label="How it works">
            <div>
              <span className="step-num">01</span>
              <div>
                <b>Choose your vibe</b>
                <p>Add a few interests—or skip them.</p>
              </div>
            </div>
            <div>
              <span className="step-num">02</span>
              <div>
                <b>Meet someone new</b>
                <p>We’ll look for a one-to-one chat.</p>
              </div>
            </div>
            <div>
              <span className="step-num">03</span>
              <div>
                <b>Stay in control</b>
                <p>Next, leave, or report at any time.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {mode === "consent" && (
        <main className="flow-main">
          <button
            className="back-button"
            onClick={() => {
              setMode("home");
              setNotice("");
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flow-card quick-start-card">
            <span className="flow-kicker">
              <Shuffle size={15} />
              Random match · no filters
            </span>
            <h1>
              Just a conversation.
              <br />
              <em>No preferences.</em>
            </h1>
            <p className="flow-intro">
              We’ll look for an available adult in the mode you choose. You can
              leave or report at any time.
            </p>
            <MediaModePicker value={mediaMode} onChange={setMediaMode} />
            <div className="consent-box">
              <div className="consent-heading">
                <ShieldCheck size={17} />
                <span>Before we connect</span>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={adultConfirmed}
                  onChange={event => setAdultConfirmed(event.target.checked)}
                />
                <span>
                  I confirm I’m 18 or older.{" "}
                  <span className="muted-inline">
                    This is an adults-only service.
                  </span>
                </span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={event => setTermsAccepted(event.target.checked)}
                />
                <span>
                  I agree to the <Link href="/terms">Terms</Link>.
                </span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={event => setPrivacyAccepted(event.target.checked)}
                />
                <span>
                  I’ve read the <Link href="/privacy">Privacy Notice</Link>.
                </span>
              </label>
              <p className="age-caveat">
                Age confirmation is self-attested, not formal age verification.
                Don’t share passwords, financial details, or private information
                with strangers.
              </p>
            </div>
            {notice && (
              <div className="inline-alert" role="alert">
                {notice}
              </div>
            )}
            <button
              className="button button-primary button-large full-width"
              disabled={!canStart}
              onClick={() => startSearching(true)}
            >
              {sessionWorking ? (
                <>
                  <span className="spinner" />
                  Starting securely…
                </>
              ) : (
                <>
                  Find a random {mediaMode === "video" ? "video match" : "chat"}{" "}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="under-button-note">
              <LockKeyhole size={13} />
              No email, phone number, interests or location needed.
            </p>
          </div>
        </main>
      )}

      {mode === "preferences" && (
        <main className="flow-main">
          <button
            className="back-button"
            onClick={() => {
              setMode("home");
              setNotice("");
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flow-card preferences-card">
            <span className="flow-kicker">
              <Shuffle size={15} />A little setup, then hello
            </span>
            <h1>
              What would you like
              <br />
              <em>to talk about?</em>
            </h1>
            <p className="flow-intro">
              Interests can help us find common ground. Leave everything blank
              for a broader random match.
            </p>
            <fieldset className="interest-fieldset">
              <legend>
                Pick up to five interests <span>Optional</span>
              </legend>
              <div className="interest-list">
                {interests.map(interest => (
                  <button
                    type="button"
                    key={interest}
                    aria-pressed={selectedInterests.includes(interest)}
                    className={`interest-chip ${selectedInterests.includes(interest) ? "selected" : ""}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check size={13} />
                    )}
                    {interest}
                  </button>
                ))}
              </div>
              <p className="field-helper">
                Your interests are used for this temporary session, not added to
                a profile.
              </p>
            </fieldset>
            <label className="select-label" htmlFor="language">
              Conversation language <span>Optional</span>
            </label>
            <select
              id="language"
              value={language}
              onChange={event => setLanguage(event.target.value as Language)}
              className="language-select"
            >
              {languages.map(item => (
                <option key={item} value={item}>
                  {item === "Any" ? "Any language" : item}
                </option>
              ))}
            </select>
            <MediaModePicker value={mediaMode} onChange={setMediaMode} />
            <div className="consent-box">
              <div className="consent-heading">
                <ShieldCheck size={17} />
                <span>Before we connect</span>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={adultConfirmed}
                  onChange={event => setAdultConfirmed(event.target.checked)}
                />
                <span>
                  I confirm I’m 18 or older.{" "}
                  <span className="muted-inline">
                    This is an adults-only service.
                  </span>
                </span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={event => setTermsAccepted(event.target.checked)}
                />
                <span>
                  I agree to the <Link href="/terms">Terms</Link>.
                </span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={event => setPrivacyAccepted(event.target.checked)}
                />
                <span>
                  I’ve read the <Link href="/privacy">Privacy Notice</Link>.
                </span>
              </label>
              <p className="age-caveat">
                Age confirmation is self-attested, not formal age verification.
                Don’t share passwords, financial details, or private information
                with strangers.
              </p>
            </div>
            {notice && (
              <div className="inline-alert" role="alert">
                {notice}
              </div>
            )}
            <button
              className="button button-primary button-large full-width"
              disabled={!canStart}
              onClick={() => startSearching(false)}
            >
              {sessionWorking ? (
                <>
                  <span className="spinner" />
                  Starting securely…
                </>
              ) : (
                <>
                  Find someone to{" "}
                  {mediaMode === "video" ? "video chat with" : "chat with"}{" "}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="under-button-note">
              <LockKeyhole size={13} />
              No email or phone number. You can leave whenever you like.
            </p>
          </div>
        </main>
      )}

      {mode === "searching" && (
        <main className="search-main">
          <div className="search-card">
            <div className="search-orbit">
              <span />
              <span />
              <span />
              <div className="search-center">
                <Shuffle size={23} />
              </div>
            </div>
            <span className="flow-kicker">
              Your next conversation is out there
            </span>
            <h1>
              Finding someone
              <br />
              <em>
                {mediaMode === "video"
                  ? "to video chat with…"
                  : "to talk with…"}
              </em>
            </h1>
            <p>
              We’re looking for an available adult who chose the same chat mode.
            </p>
            {mediaMode === "video" && (
              <small className="honest-wait">
                Video is direct, not relayed; your network IP may be visible to
                your chat partner and the STUN provider.
              </small>
            )}
            {selectedInterests.length > 0 && (
              <div className="search-tags">
                {selectedInterests.map(item => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
            <button className="button button-secondary" onClick={handleEnd}>
              <X size={16} />
              Cancel search
            </button>
            <small className="honest-wait">
              There may not be someone available right now. We won’t make up a
              wait time.
            </small>
          </div>
        </main>
      )}

      {mode === "chat" && (
        <main className="chat-main">
          <div className="chat-toolbar">
            <div className="connection-state">
              <span className="live-dot" />
              Connected with someone new
              <span className="text-only-tag">
                {mediaMode === "video" ? "Video option" : "Text"}
              </span>
            </div>
            <div className="chat-toolbar-actions">
              <button
                className="toolbar-button danger-quiet"
                onClick={handleBlock}
              >
                <Ban size={15} />
                Block
              </button>
              <button
                ref={reportTriggerRef}
                className="toolbar-button"
                onClick={() => {
                  setReportReason("");
                  setReportDescription("");
                  setIncludeExcerpt(false);
                  setReportOpen(true);
                  setNotice("");
                }}
              >
                <Flag size={15} />
                Report
              </button>
            </div>
          </div>
          <div className="chat-layout">
            <section
              className="conversation-panel"
              aria-label="Text conversation"
            >
              <div className="conversation-header">
                <div className="stranger-avatar">
                  <UserRound size={21} />
                </div>
                <div>
                  <strong>Someone new</strong>
                  <span>Connected just now · no profile</span>
                </div>
                <span className="conversation-shield">
                  <ShieldCheck size={17} />
                  <span>One-to-one room</span>
                </span>
              </div>
              {mediaMode === "video" && <VideoCall socket={liveSocket} />}
              <div
                className="messages-list"
                ref={messageListRef}
                aria-live="polite"
                aria-label="Messages"
              >
                <div className="chat-date-divider">
                  <span>Conversation started</span>
                </div>
                {messages.length === 0 && (
                  <div className="first-message-hint">
                    <span className="hint-star">✳</span>
                    <p>
                      You’re both here. A simple “hi” is a lovely place to
                      start.
                    </p>
                  </div>
                )}
                {messages.map(message => (
                  <div
                    className={`message-row ${message.fromMe ? "mine" : "theirs"}`}
                    key={message.id}
                  >
                    <div className="message-bubble">
                      {message.text}
                      <time>
                        {new Intl.DateTimeFormat(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(message.sentAt)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
              {notice && (
                <div className="chat-notice" role="status">
                  {notice}
                  <button
                    aria-label="Dismiss message"
                    onClick={() => setNotice("")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <form className="composer" onSubmit={submitMessage}>
                <label className="sr-only" htmlFor="message">
                  Type a message
                </label>
                <input
                  ref={inputRef}
                  id="message"
                  value={draft}
                  onChange={event => setDraft(event.target.value.slice(0, 500))}
                  onKeyDown={handleComposerKey}
                  placeholder="Write a little hello…"
                  maxLength={500}
                  autoComplete="off"
                />
                <span className="character-count">{draft.length}/500</span>
                <button
                  className="send-button"
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                >
                  <Send size={17} />
                </button>
              </form>
              <div className="composer-note">
                <LockKeyhole size={12} />
                Messages are temporary. Links, email addresses and phone numbers
                are blocked.
              </div>
            </section>
            <aside className="chat-side-panel">
              <div className="side-panel-icon">
                <HeartHandshake size={21} />
              </div>
              <h2>
                Keep it kind.
                <br />
                <em>Keep it yours.</em>
              </h2>
              <p>
                Never share passwords, financial details or private information.
                You can end this chat without explaining why.
              </p>
              <div className="side-safety-links">
                <Link href="/guidelines">
                  Community guidelines <ArrowRight size={14} />
                </Link>
                <Link href="/safety">
                  Safety & privacy <ArrowRight size={14} />
                </Link>
              </div>
              <div className="side-report-note">
                <Flag size={15} />
                <span>
                  Something feels wrong? Report it, and choose whether to
                  include a short excerpt.
                </span>
              </div>
            </aside>
          </div>
          <div className="chat-bottom-actions">
            <div className="chat-session-note">
              <Radio size={15} />
              One-to-one {mediaMode === "video"
                ? "video option"
                : "text chat"}{" "}
              <span>·</span> nothing to log out of
            </div>
            <div>
              <button className="button button-secondary" onClick={handleEnd}>
                End chat
              </button>
              <button className="button button-primary" onClick={handleNext}>
                Next person <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </main>
      )}

      {mode !== "chat" && <Footer />}
      {mode === "chat" && (
        <div className="chat-footer">
          <Brand compact />
          <span>Temporary conversation · no account</span>
          <Link href="/privacy">Privacy details</Link>
        </div>
      )}

      {reportOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setReportOpen(false);
          }}
        >
          <section
            ref={reportDialogRef}
            tabIndex={-1}
            className="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            <div className="report-dialog-top">
              <span className="report-icon">
                <Flag size={18} />
              </span>
              <button
                className="icon-button"
                aria-label="Close report"
                onClick={() => setReportOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <h2 id="report-title">Tell us what happened.</h2>
            <p className="report-intro">
              Your report is stored for safety review. Human review coverage is
              not configured in this prototype. It includes your selected reason
              and optional note; chat text is included only if you choose an
              excerpt below.
            </p>
            <form onSubmit={submitReport}>
              <label className="select-label" htmlFor="report-reason">
                Reason <span>Required</span>
              </label>
              <select
                id="report-reason"
                required
                value={reportReason}
                onChange={event =>
                  setReportReason(event.target.value as typeof reportReason)
                }
              >
                <option value="" disabled>
                  Choose a reason
                </option>
                {reportReasons.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <label className="select-label" htmlFor="report-description">
                Anything else we should know? <span>Optional</span>
              </label>
              <textarea
                id="report-description"
                value={reportDescription}
                onChange={event =>
                  setReportDescription(event.target.value.slice(0, 1000))
                }
                maxLength={1000}
                rows={3}
                placeholder="Share only what’s needed for review."
              />
              <label className="check-row report-checkbox">
                <input
                  type="checkbox"
                  checked={includeExcerpt}
                  onChange={event => setIncludeExcerpt(event.target.checked)}
                />
                <span>
                  Include the last few messages as context{" "}
                  <span className="muted-inline">(up to 1,000 characters)</span>
                </span>
              </label>
              {includeExcerpt && (
                <div className="excerpt-preview">
                  {messages
                    .slice(-6)
                    .map(
                      message =>
                        `${message.fromMe ? "You" : "Stranger"}: ${message.text}`
                    )
                    .join("\n") || "No messages to include yet."}
                </div>
              )}
              <label className="check-row report-checkbox">
                <input
                  type="checkbox"
                  checked={leaveAfterReport}
                  onChange={event => setLeaveAfterReport(event.target.checked)}
                />
                <span>Leave this chat after I report</span>
              </label>
              {report.error && (
                <div className="inline-alert" role="alert">
                  {report.error.message}
                </div>
              )}
              <div className="report-retention">
                <LockKeyhole size={14} />
                <span>
                  This information is kept as a safety report, not added to
                  general chat history. Report review coverage is not
                  guaranteed.
                </span>
              </div>
              <div className="report-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setReportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={!reportReason || report.isPending}
                >
                  {report.isPending ? (
                    <>
                      <span className="spinner" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Submit report <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
