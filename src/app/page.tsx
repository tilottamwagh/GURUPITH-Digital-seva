"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  whatsapp_mobile: string;
  profile_name: string | null;
  message_type: string;
  message_text: string | null;
  message_timestamp: string | null;
};
type DashboardData = { configured: boolean; messages?: Message[]; error?: string };
type DateRange = { from: string; to: string };

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const messageDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function localDateTime(day: string, end = false) {
  return `${day}T${end ? "23:59" : "00:00"}`;
}
function dateLabel(range: DateRange) {
  if (!range.from && !range.to) return "All time";
  if (range.from && range.to) return `${shortDate.format(new Date(range.from))} – ${shortDate.format(new Date(range.to))}`;
  return range.from ? `From ${shortDate.format(new Date(range.from))}` : `Until ${shortDate.format(new Date(range.to))}`;
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if (name === "refresh") return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/></svg>;
  if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === "message") return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  if (name === "inbox") return <svg {...common}><path d="M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/></svg>;
  if (name === "close") return <svg {...common}><path d="m18 6-12 12M6 6l12 12"/></svg>;
  return null;
}

function CalendarPicker({ value, onApply, onClose }: { value: DateRange; onApply: (range: DateRange) => void; onClose: () => void }) {
  const today = dayKey(new Date());
  const [month, setMonth] = useState(() => {
    const initial = value.from || today;
    const date = new Date(`${initial}T12:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [draft, setDraft] = useState(value);
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(month);
  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);
  const choosePreset = (days: number | null) => {
    if (days === null) { setDraft({ from: "", to: "" }); return; }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setDraft({ from: dayKey(start), to: dayKey(end) });
  };
  const chooseDay = (day: number) => {
    const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day));
    if (!draft.from || draft.to || key < draft.from) setDraft({ from: key, to: "" });
    else setDraft({ ...draft, to: key });
  };
  const isSelected = (key: string) => key === draft.from || key === draft.to;
  const isBetween = (key: string) => !!draft.from && !!draft.to && key > draft.from && key < draft.to;

  return <>
    <button className="popover-scrim" aria-label="Close date picker" onClick={onClose} />
    <section className="calendar-popover" aria-label="Choose date range">
      <div className="calendar-top"><div><span className="eyebrow">DATE RANGE</span><strong>{dateLabel(draft)}</strong></div><button className="icon-button subtle" aria-label="Close calendar" onClick={onClose}><Icon name="close" size={16}/></button></div>
      <div className="range-presets">{[["Today", 1], ["7 days", 7], ["30 days", 30], ["All time", null]].map(([label, days]) => <button key={String(label)} onClick={() => choosePreset(days as number | null)}>{label}</button>)}</div>
      <div className="calendar-heading"><button className="icon-button subtle" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><strong>{monthName}</strong><button className="icon-button subtle" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
      <div className="calendar-grid">{weekDays.map((day) => <span className="weekday" key={day}>{day}</span>)}{cells.map((day, index) => {
        if (!day) return <span className="calendar-blank" key={`blank-${index}`}/>;
        const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day));
        return <button key={key} className={`calendar-day${isSelected(key) ? " selected" : ""}${isBetween(key) ? " between" : ""}${key === today ? " today" : ""}`} onClick={() => chooseDay(day)}>{day}</button>;
      })}</div>
      <div className="calendar-footer"><span>{draft.from && !draft.to ? "Select an end date" : "Times are shown in your local timezone"}</span><button className="button-primary small" onClick={() => { onApply({ from: draft.from ? localDateTime(draft.from) : "", to: draft.to ? localDateTime(draft.to, true) : "" }); onClose(); }}>Apply range</button></div>
    </section>
  </>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({ configured: false });
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => typeof window !== "undefined" && (window.localStorage.getItem("gurupith-theme") === "dark" || (!window.localStorage.getItem("gurupith-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)));
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState("");
  const inFlight = useRef(false);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setRefreshError("");
    try {
      const params = new URLSearchParams();
      if (range.from) params.set("from", new Date(range.from).toISOString());
      if (range.to) params.set("to", new Date(range.to).toISOString());
      const response = await fetch(`/api/analytics?${params.toString()}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      const result: DashboardData = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Could not refresh messages.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => {
    document.documentElement.dataset.theme = darkTheme ? "dark" : "light";
  }, [darkTheme]);
  const toggleTheme = () => {
    const next = !darkTheme;
    setDarkTheme(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("gurupith-theme", next ? "dark" : "light");
  };
  useEffect(() => {
    const initial = window.setTimeout(() => void loadRef.current(), 0);
    const interval = window.setInterval(() => void loadRef.current(), 10_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);

  const messages = useMemo(() => data.messages ?? [], [data.messages]);
  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) => `${message.profile_name ?? ""} ${message.whatsapp_mobile} ${message.message_text ?? ""} ${message.message_type}`.toLocaleLowerCase().includes(normalized));
  }, [messages, query]);
  const users = new Set(messages.map((message) => message.whatsapp_mobile)).size;
  const today = lastUpdated ? dayKey(lastUpdated) : "";
  const todayCount = messages.filter((message) => message.message_timestamp && dayKey(new Date(message.message_timestamp)) === today).length;
  const activeSince = lastUpdated ? lastUpdated.getTime() - 30 * 86400000 : 0;
  const activeCount = new Set(messages.filter((message) => message.message_timestamp && new Date(message.message_timestamp).getTime() >= activeSince).map((message) => message.whatsapp_mobile)).size;

  if (loading && !data.configured && !refreshError) return <main className="setup"><section><div className="setup-mark"><img src="/gurupith-logo.png" alt=""/></div><span className="eyebrow">GURUPITH ANALYTICS</span><h1>Preparing your workspace</h1><p>Connecting securely to your WhatsApp data…</p><div className="loading-line"/></section></main>;
  if (!data.configured && !refreshError) return <main className="setup"><section><div className="setup-mark"><img src="/gurupith-logo.png" alt=""/></div><span className="eyebrow">GURUPITH ANALYTICS</span><h1>Connect your data</h1><p>Add Supabase settings to <code>.env.local</code>, then restart the development server.</p></section></main>;

  return <main className="dashboard-shell">
    <aside className="sidebar">
      <div className="side-brand"><img src="/gurupith-logo.png" alt="Gurupith logo"/><div><strong>GURUPITH</strong><span>Digital seva</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <a className="nav-link active" href="#overview"><span className="nav-icon"><Icon name="message" size={17}/></span><span>Overview</span><span className="nav-current"/></a>
      <div className="sidebar-bottom"><div className="side-status"><span className={`status-dot${refreshError ? " is-offline" : ""}`}/><div><strong>{refreshError ? "Connection issue" : "System operational"}</strong><span>{refreshError ? "Check your connection" : "WhatsApp sync active"}</span></div></div><div className="profile-mini"><div className="profile-avatar">G</div><div><strong>Gurupith Admin</strong><span>Analytics workspace</span></div><span className="profile-more">···</span></div></div>
    </aside>

    <div className="main-column" id="overview">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14}/><strong>Overview</strong></div><div className="topbar-right"><span className="secure-label"><span/> Live monitoring</span><span className="topbar-divider"/><button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${darkTheme ? "light" : "dark"} theme`} title={`Switch to ${darkTheme ? "light" : "dark"} theme`}><span aria-hidden="true">{darkTheme ? "☀" : "☾"}</span><span className="theme-toggle-label">{darkTheme ? "Light" : "Dark"}</span></button><button className="refresh-button" onClick={() => void load()} disabled={loading}><Icon name="refresh" size={16}/>{loading ? "Refreshing" : "Refresh"}</button><div className="profile-avatar top-avatar">G</div></div></header>

      <div className="content-wrap">
        <section className="welcome-row"><div><span className="eyebrow">MONITORING CENTER</span><h1>Good day, Gurupith <span className="greeting-mark">✦</span></h1><p>Here’s what’s happening across your WhatsApp conversations.</p></div><div className="updated-chip"><Icon name="clock" size={15}/><span>{lastUpdated ? `Updated ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(lastUpdated)}` : "Waiting for data"}</span><span className={`sync-indicator${loading ? " syncing" : ""}`}/></div></section>

        {refreshError && <div className="error-banner" role="alert"><span className="error-symbol">!</span><span><strong>Data could not be refreshed</strong><small>{refreshError}</small></span><button onClick={() => void load()}>Try again</button></div>}

        <section className="summary-banner"><div className="summary-art"><img src="/swami-samarth.webp" alt="Shree Swami Samarth"/></div><div className="summary-copy"><span className="devotional">॥ श्री स्वामी समर्थ ॥</span><strong>Messages with purpose, service with care.</strong><span>Stay connected to every devotee reaching out to the Gurupith.</span></div><div className="summary-date"><span>SELECTED PERIOD</span><strong>{dateLabel(range)}</strong></div><div className="banner-glow"/></section>

        <section className="metric-grid" aria-label="Message overview">
          <article className="metric-card"><div className="metric-head"><span className="metric-icon saffron"><Icon name="message"/></span><span className="metric-tag">INBOX</span></div><span className="metric-label">Incoming messages</span><strong className="metric-value">{messages.length.toLocaleString("en-IN")}</strong><span className="metric-foot">{range.from || range.to ? "In selected period" : "Latest 500 received"}</span></article>
          <article className="metric-card"><div className="metric-head"><span className="metric-icon green"><Icon name="users"/></span><span className="metric-tag">COMMUNITY</span></div><span className="metric-label">People reached</span><strong className="metric-value">{users.toLocaleString("en-IN")}</strong><span className="metric-foot">Unique numbers in loaded messages</span></article>
          <article className="metric-card"><div className="metric-head"><span className="metric-icon blue"><Icon name="clock"/></span><span className="metric-tag">TODAY</span></div><span className="metric-label">Messages today</span><strong className="metric-value">{todayCount.toLocaleString("en-IN")}</strong><span className="metric-foot">Based on loaded messages</span></article>
          <article className="metric-card"><div className="metric-head"><span className="metric-icon purple"><Icon name="users"/></span><span className="metric-tag">30 DAY ACTIVITY</span></div><span className="metric-label">Active people</span><strong className="metric-value">{activeCount.toLocaleString("en-IN")}</strong><span className="metric-foot">Active in the last 30 days</span></article>
        </section>

        <section className="messages-panel">
          <div className="panel-heading"><div><span className="eyebrow">CONVERSATION FEED</span><h2>Incoming messages <span className="count-pill">{rows.length}</span></h2><p>Recent messages from your WhatsApp community</p></div><button className={`date-button${calendarOpen ? " is-open" : ""}`} onClick={() => setCalendarOpen((open) => !open)} aria-expanded={calendarOpen}><Icon name="calendar" size={17}/><span>{dateLabel(range)}</span><span className="date-caret">⌄</span></button></div>
          <div className="toolbar"><label className="search-box"><Icon name="search" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone or message…" aria-label="Search messages"/><kbd>⌕</kbd></label><div className="toolbar-meta"><span><i className="feed-dot"/>Live feed</span><span className="toolbar-divider"/><span>Auto-refresh 10s</span></div></div>
          {calendarOpen && <CalendarPicker value={range.from || range.to ? { from: range.from ? dayKey(new Date(range.from)) : "", to: range.to ? dayKey(new Date(range.to)) : "" } : { from: "", to: "" }} onApply={setRange} onClose={() => setCalendarOpen(false)}/>}
          <div className="table-head"><span>CONTACT</span><span>MESSAGE</span><span>TYPE</span><span>RECEIVED</span></div>
          <div className="message-list" aria-live="polite" aria-busy={loading}>
            {rows.length === 0 ? <div className="empty-state"><span className="empty-icon"><Icon name="inbox" size={22}/></span><strong>{loading ? "Refreshing messages…" : query || range.from || range.to ? "No matching messages" : "Your inbox is clear"}</strong><p>{loading ? "New messages will appear here shortly." : query || range.from || range.to ? "Try another search or adjust the selected date range." : "Incoming WhatsApp messages will appear here."}</p></div> : rows.map((message) => <article className="message-row" key={message.id}>
              <div className="contact-cell"><span className="contact-avatar">{(message.profile_name || message.whatsapp_mobile || "?").trim().charAt(0).toUpperCase()}</span><span className="contact-info"><strong>{message.profile_name || "WhatsApp user"}</strong><small>{message.whatsapp_mobile}</small></span></div>
              <div className="message-cell"><p>{message.message_text || "Media or structured message"}</p></div>
              <div className="type-cell"><span className={`type-pill ${message.message_type.toLowerCase()}`}>{message.message_type}</span></div>
              <time className="time-cell">{message.message_timestamp ? messageDate.format(new Date(message.message_timestamp)) : "—"}</time>
            </article>)}
          </div>
          {messages.length === 500 && <div className="list-note">Showing the latest 500 messages. Choose a date range to narrow your results.</div>}
          <div className="panel-footer"><span>Showing <strong>{rows.length}</strong> of <strong>{messages.length}</strong> messages</span><span className="auto-refresh-note"><span className="refresh-ring"/> Updates automatically every 10 seconds</span></div>
        </section>
        <footer className="page-footer"><span>॥ श्री स्वामी समर्थ ॥</span><span>Gurupith WhatsApp Analytics</span></footer>
      </div>
    </div>
  </main>;
}
