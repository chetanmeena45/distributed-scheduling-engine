import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:8080/api/v1/schedules";

const RESOURCES = [
  { id: "machinery-vlog-drone-1",  label: "Vlog Drone",   unit: "Aerial Unit #1",   color: "#818CF8" },
  { id: "tractor-harvester-02",    label: "Harvester",    unit: "Tractor Unit #2",   color: "#F59E0B" },
  { id: "precision-sprayer-03",    label: "Sprayer",      unit: "Precision Unit #3", color: "#34D399" },
  { id: "soil-sensor-rig-04",      label: "Sensor Rig",   unit: "Soil Sensor #4",    color: "#F472B6" },
];

const P = {
  bg:        "#0B0D14",
  surface:   "#12141E",
  elevated:  "#1A1D2B",
  border:    "#252840",
  accent:    "#F59E0B",
  success:   "#22C55E",
  error:     "#EF4444",
  textPri:   "#E2E8F0",
  textSec:   "#94A3B8",
  textMuted: "#475569",
};

const MONO = "'ui-monospace','Cascadia Code','Fira Code',monospace";

function isoString(date, time) {
  return `${date}T${time}:00`;
}

function parseHHMM(isoStr) {
  return isoStr.split("T")[1].substring(0, 5);
}

function parseDate(isoStr) {
  return isoStr.split("T")[0];
}

function minuteOfDay(isoStr) {
  const [h, m] = isoStr.split("T")[1].split(":").map(Number);
  return h * 60 + m;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

let _tid = 0;

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const push = useCallback((message, type = "success") => {
    const id = ++_tid;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 4800);
  }, []);

  const dismiss = useCallback(id => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  return res;
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      minWidth: 300, maxWidth: 420,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px",
          borderRadius: 10,
          background: t.type === "success" ? "#0E1F15" : "#1F0E0E",
          border: `1px solid ${t.type === "success" ? "#22C55E44" : "#EF444444"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "slideIn 0.18s ease",
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%",
            background: t.type === "success" ? P.success : P.error,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 10, color: "#fff", fontWeight: 800,
            marginTop: 1,
          }}>
            {t.type === "success" ? "✓" : "✕"}
          </span>
          <span style={{ flex: 1, fontSize: 13, color: P.textPri, lineHeight: 1.45 }}>
            {t.message}
          </span>
          <button onClick={() => dismiss(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: P.textMuted, fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0,
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

function ResourceCard({ resource, isSelected, onClick }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", textAlign: "left",
        padding: "11px 12px", borderRadius: 10,
        background: isSelected ? `${resource.color}16` : hov ? P.elevated : "transparent",
        border: `1px solid ${isSelected ? resource.color + "88" : P.border}`,
        cursor: "pointer", transition: "all 0.14s ease",
        display: "flex", alignItems: "center", gap: 11,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${resource.color}1A`,
        border: `1px solid ${resource.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: resource.color,
          boxShadow: isSelected ? `0 0 8px ${resource.color}88` : "none",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.3,
          color: isSelected ? resource.color : P.textPri,
        }}>
          {resource.label}
        </div>
        <div style={{
          fontSize: 10, color: P.textMuted, marginTop: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: MONO,
        }}>
          {resource.id}
        </div>
      </div>
      {isSelected && (
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: resource.color, flexShrink: 0 }} />
      )}
    </button>
  );
}

function BookingForm({ selectedResourceId, onSubmit }) {
  const [resourceId, setResourceId] = useState(selectedResourceId);
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setResourceId(selectedResourceId), [selectedResourceId]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        resourceId,
        startTime: isoString(date, startTime),
        endTime: isoString(date, endTime),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: "100%", padding: "8px 10px",
    borderRadius: 8, border: `1px solid ${P.border}`,
    background: P.bg, color: P.textPri,
    fontSize: 12, fontFamily: MONO, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.14s",
  };

  const lbl = {
    display: "block", fontSize: 10, fontWeight: 700,
    color: P.textMuted, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 5,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div>
        <label style={lbl}>Resource ID</label>
        <input
          type="text"
          value={resourceId}
          onChange={e => setResourceId(e.target.value)}
          placeholder="e.g. tractor-harvester-02"
          style={inp}
          required
        />
      </div>
      <div>
        <label style={lbl}>Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={inp}
          required
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={lbl}>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} required />
        </div>
        <div>
          <label style={lbl}>End</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} required />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "10px 0", borderRadius: 8, border: "none",
          background: submitting ? P.elevated : P.accent,
          color: submitting ? P.textMuted : "#0B0D14",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.02em",
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "all 0.14s",
        }}
      >
        {submitting ? "Reserving…" : "Reserve Slot"}
      </button>
    </form>
  );
}

function Timeline({ bookings, accentColor }) {
  const tickHours = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = ((nowMin / 1440) * 100).toFixed(3) + "%";

  return (
    <div style={{
      background: P.surface, border: `1px solid ${P.border}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "13px 20px", borderBottom: `1px solid ${P.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: P.textSec, letterSpacing: "0.1em" }}>
            24-HOUR TIMELINE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontFamily: MONO, color: P.textMuted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 8, height: 2, background: P.accent, borderRadius: 1 }} />
            now
          </span>
          <span>{bookings.length} slot{bookings.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <div style={{ padding: "24px 20px 20px" }}>
        <div style={{ position: "relative", height: 56 }}>
          <div style={{
            position: "absolute", top: 8, left: 0, right: 0,
            height: 28, borderRadius: 6,
            background: P.bg, border: `1px solid ${P.border}`,
          }} />

          {bookings.map(b => {
            const sMin = minuteOfDay(b.startTime);
            const eMin = minuteOfDay(b.endTime);
            const w = Math.max(((eMin - sMin) / 1440) * 100, 0.4);
            const l = (sMin / 1440) * 100;
            return (
              <div
                key={b.id}
                title={`${parseHHMM(b.startTime)} – ${parseHHMM(b.endTime)}`}
                style={{
                  position: "absolute", top: 8,
                  left: `${l}%`, width: `${w}%`,
                  height: 28, borderRadius: 4, zIndex: 2,
                  background: `${accentColor}44`,
                  border: `1px solid ${accentColor}CC`,
                  display: "flex", alignItems: "center",
                  paddingLeft: 5, overflow: "hidden", cursor: "default",
                }}
              >
                <span style={{ fontSize: 9, fontFamily: MONO, color: accentColor, whiteSpace: "nowrap" }}>
                  {parseHHMM(b.startTime)}
                </span>
              </div>
            );
          })}

          <div style={{
            position: "absolute", top: 2, left: nowPct,
            width: 1, height: 44,
            background: P.accent,
            zIndex: 3, opacity: 0.85,
          }} />

          {tickHours.map(h => (
            <div key={h} style={{
              position: "absolute", top: 0,
              left: `${(h / 24) * 100}%`,
            }}>
              <div style={{ height: 6, borderLeft: `1px solid ${P.border}` }} />
              <span style={{
                fontSize: 9, fontFamily: MONO, color: P.textMuted,
                marginTop: 1, display: "block",
                transform: "translateX(-50%)", whiteSpace: "nowrap",
                position: "absolute", top: 42,
              }}>
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, accentColor, onCancel }) {
  const [canceling, setCanceling] = useState(false);
  const [hov, setHov] = useState(false);
  const [btnHov, setBtnHov] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    await onCancel(booking.id);
    setCanceling(false);
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px", borderRadius: 10,
        background: hov ? P.elevated : P.surface,
        border: `1px solid ${P.border}`,
        transition: "background 0.12s",
      }}
    >
      <div style={{
        width: 3, alignSelf: "stretch", borderRadius: 2,
        background: accentColor, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: MONO, color: P.textSec }}>
            {booking.resourceId}
          </span>
          <span style={{
            fontSize: 9, padding: "2px 7px", borderRadius: 4,
            background: "#22C55E14", color: P.success,
            border: "1px solid #22C55E30",
            fontFamily: MONO, letterSpacing: "0.06em", fontWeight: 700,
          }}>
            BOOKED
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontFamily: MONO, fontWeight: 600, color: P.textPri }}>
            {parseHHMM(booking.startTime)}
          </span>
          <span style={{ fontSize: 11, color: P.textMuted }}>→</span>
          <span style={{ fontSize: 15, fontFamily: MONO, fontWeight: 600, color: P.textPri }}>
            {parseHHMM(booking.endTime)}
          </span>
          <span style={{ fontSize: 11, fontFamily: MONO, color: P.textMuted, marginLeft: 4 }}>
            {parseDate(booking.startTime)}
          </span>
        </div>
        <div style={{
          fontSize: 10, fontFamily: MONO, color: P.textMuted,
          marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {booking.id}
        </div>
      </div>
      <button
        onClick={handleCancel}
        disabled={canceling}
        onMouseEnter={() => setBtnHov(true)}
        onMouseLeave={() => setBtnHov(false)}
        style={{
          padding: "7px 14px", borderRadius: 7, flexShrink: 0,
          background: canceling ? P.elevated : btnHov ? "#EF444428" : "#EF444414",
          color: canceling ? P.textMuted : P.error,
          border: `1px solid ${canceling ? P.border : "#EF444450"}`,
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          cursor: canceling ? "not-allowed" : "pointer",
          transition: "all 0.12s",
        }}
      >
        {canceling ? "Releasing…" : "Cancel Booking"}
      </button>
    </div>
  );
}

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      background: P.surface, border: `1px solid ${P.border}`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: P.textMuted,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: valueColor || P.textPri }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: P.textMuted, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: "52px 0", textAlign: "center",
      borderRadius: 12, background: P.surface,
      border: `1px solid ${P.border}`,
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 14px", display: "block" }}>
        <rect x="6" y="6" width="28" height="28" rx="4" stroke={P.border} strokeWidth="1.5" />
        <path d="M13 20h14M20 13v14" stroke={P.textMuted} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 14, fontWeight: 600, color: P.textSec, marginBottom: 6 }}>
        No reservations scheduled
      </div>
      <div style={{ fontSize: 12, color: P.textMuted }}>
        Use the booking form to reserve a time slot for this resource.
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 80, borderRadius: 10,
          background: P.surface, border: `1px solid ${P.border}`,
          opacity: 1 - i * 0.2,
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState(RESOURCES[0].id);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connError, setConnError] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const currentResource = RESOURCES.find(r => r.id === selectedId);

  const loadBookings = useCallback(async resourceId => {
    setLoading(true);
    setConnError(false);
    try {
      const res = await apiFetch(`/${resourceId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setConnError(true);
      push(`Failed to load schedule — ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadBookings(selectedId);
  }, [selectedId, loadBookings]);

  const handleBook = async body => {
    try {
      const res = await apiFetch("/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        push(`Conflict — ${err.message || "Time slot unavailable. Concurrent booking detected."}`, "error");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      push(
        `Slot reserved · ${parseHHMM(body.startTime)} – ${parseHHMM(body.endTime)} · ${body.resourceId}`,
        "success",
      );
      if (body.resourceId === selectedId) loadBookings(selectedId);
    } catch (err) {
      push(`Booking failed — ${err.message}`, "error");
    }
  };

  const handleCancel = async id => {
    try {
      const res = await apiFetch(`/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBookings(prev => prev.filter(b => b.id !== id));
      push("Booking released. Slot is now available.", "success");
    } catch (err) {
      push(`Cancel failed — ${err.message}`, "error");
    }
  };

  const color = currentResource?.color || P.accent;

  const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${P.bg}; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.4);
          cursor: pointer;
        }
        input:focus { border-color: ${P.accent} !important; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${P.border}; border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: P.bg, color: P.textPri,
        fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        <ToastStack toasts={toasts} dismiss={dismiss} />

        <header style={{
          height: 54, padding: "0 24px", flexShrink: 0,
          display: "flex", alignItems: "center",
          borderBottom: `1px solid ${P.border}`,
          background: P.surface,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#F59E0B1A", border: "1px solid #F59E0B44",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="7" width="5" height="5" rx="1" fill="#F59E0B" />
                <rect x="9" y="4" width="5.5" height="5" rx="1" fill="#F59E0B" opacity="0.65" />
                <rect x="1.5" y="2" width="5" height="3.5" rx="1" fill="#F59E0B" opacity="0.35" />
                <rect x="9" y="11" width="5.5" height="2.5" rx="1" fill="#F59E0B" opacity="0.35" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: P.textPri }}>
                ScheduleEngine
              </div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: P.textMuted }}>
                Distributed Resource Scheduler
              </div>
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, fontFamily: MONO, color: P.textMuted }}>
              {nowLabel}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: P.success,
                boxShadow: `0 0 6px ${P.success}`,
              }} />
              <span style={{ fontSize: 11, fontFamily: MONO, color: P.success }}>
                LIVE · SYSTEM ONLINE
              </span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <aside style={{
            width: 292, flexShrink: 0,
            borderRight: `1px solid ${P.border}`,
            overflowY: "auto", display: "flex",
            flexDirection: "column", gap: 22, padding: 18,
          }}>
            <section>
              <div style={{
                fontSize: 10, fontWeight: 700, color: P.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
              }}>
                Resources
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {RESOURCES.map(r => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    isSelected={selectedId === r.id}
                    onClick={() => setSelectedId(r.id)}
                  />
                ))}
              </div>
            </section>

            <section style={{ borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: P.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14,
              }}>
                New Booking
              </div>
              <BookingForm selectedResourceId={selectedId} onSubmit={handleBook} />
            </section>
          </aside>

          <main style={{
            flex: 1, overflowY: "auto", padding: 24,
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: P.textPri }}>
                    {currentResource?.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: MONO, padding: "2px 8px",
                    borderRadius: 5, background: P.elevated,
                    color: P.textSec, border: `1px solid ${P.border}`,
                  }}>
                    {selectedId}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: P.textMuted }}>
                  {loading
                    ? "Fetching schedule…"
                    : connError
                    ? "⚠ Connection error — ensure the Spring Boot backend is running on port 8080"
                    : `${bookings.length} active reservation${bookings.length !== 1 ? "s" : ""} · switches auto-refresh`}
                </div>
              </div>

              <button
                onClick={() => loadBookings(selectedId)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 14px", borderRadius: 8,
                  background: "transparent", color: loading ? P.textMuted : P.textSec,
                  border: `1px solid ${P.border}`, fontSize: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "border-color 0.12s",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="13" height="13" viewBox="0 0 13 13" fill="none"
                  style={{
                    opacity: loading ? 0.4 : 1,
                    animation: loading ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M6.5 1L8 2.5L6.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <StatCard
                label="Active Bookings"
                value={loading ? "—" : bookings.length}
                valueColor={color}
                sub={`for ${currentResource?.unit}`}
              />
              <StatCard
                label="Fleet Resources"
                value={RESOURCES.length}
                valueColor={P.textSec}
                sub="registered units"
              />
              <StatCard
                label="Engine Status"
                value="Online"
                valueColor={P.success}
                sub="In-Memory Lock Manager"
              />
            </div>

            <Timeline bookings={bookings} accentColor={color} />

            <section>
              <div style={{
                fontSize: 10, fontWeight: 700, color: P.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
              }}>
                Active Reservations
              </div>

              {loading ? (
                <LoadingState />
              ) : bookings.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bookings.map(b => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      accentColor={color}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}