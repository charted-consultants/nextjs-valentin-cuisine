"use client"

import { useState, useEffect, useCallback } from "react"
import { s } from "@/components/admin/AdminUI"

type Signup = {
  id: number
  name: string
  email: string
  location: string | null
  wantsToTry: string | null
  optIn: boolean
  createdAt: string
}

type Campaign = {
  id: number
  subject: string
  body: string
  recipientCount: number
  sentAt: string
}

type Tab = "subscribers" | "sent"

type ComposeForm = {
  subject: string
  htmlBody: string
}

function emptyCompose(): ComposeForm {
  return { subject: "", htmlBody: "" }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export default function EmailPage() {
  const [tab, setTab] = useState<Tab>("subscribers")
  const [subscribers, setSubscribers] = useState<Signup[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState<ComposeForm>(emptyCompose())
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string>("")
  const [sendError, setSendError] = useState<string>("")

  const loadSubscribers = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/email/subscribers")
    if (res.ok) setSubscribers(await res.json())
    setLoading(false)
  }, [])

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/email/campaigns")
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSubscribers()
    loadCampaigns()
  }, [loadSubscribers, loadCampaigns])

  function openCompose() {
    setForm(emptyCompose())
    setSendResult("")
    setSendError("")
    setComposing(true)
  }

  async function handleSend() {
    if (!form.subject.trim() || !form.htmlBody.trim()) {
      setSendError("Subject and body are required.")
      return
    }
    setSending(true)
    setSendError("")
    setSendResult("")
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error ?? "Failed to send.")
      } else {
        setSendResult(`Sent to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}.${data.failed ? ` ${data.failed} failed.` : ""}`)
        await loadCampaigns()
        await loadSubscribers()
      }
    } catch {
      setSendError("Network error. Please try again.")
    }
    setSending(false)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    fontSize: "14px",
    fontWeight: active ? 700 : 400,
    color: active ? "#1a1a1a" : "#7A7060",
    background: active ? "#fff" : "transparent",
    border: "1px solid",
    borderColor: active ? "#e8e3dc" : "transparent",
    borderBottom: active ? "1px solid #fff" : "1px solid #e8e3dc",
    borderRadius: "6px 6px 0 0",
    cursor: "pointer",
    marginBottom: "-1px",
    position: "relative",
    fontFamily: "'Nunito', sans-serif",
  })

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={s.heading as React.CSSProperties}>Email</h1>
        <button style={s.btnGold as React.CSSProperties} onClick={openCompose}>
          Send email
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #e8e3dc", marginBottom: "0" }}>
        <button style={tabStyle(tab === "subscribers")} onClick={() => setTab("subscribers")}>
          Subscribers {subscribers.length > 0 && `(${subscribers.length})`}
        </button>
        <button style={tabStyle(tab === "sent")} onClick={() => setTab("sent")}>
          Sent {campaigns.length > 0 && `(${campaigns.length})`}
        </button>
      </div>

      {/* Tab content */}
      <div style={{ ...s.card as React.CSSProperties, borderTopLeftRadius: 0, marginTop: "0" }}>
        {loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#7A7060" }}>Loading...</div>
        )}

        {!loading && tab === "subscribers" && (
          subscribers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#7A7060" }}>
              No subscribers yet. People who fill in the waiting list form will appear here.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={s.tableHead as React.CSSProperties}>
                <tr>
                  <th style={s.th as React.CSSProperties}>Name</th>
                  <th style={s.th as React.CSSProperties}>Email</th>
                  <th style={s.th as React.CSSProperties}>Location</th>
                  <th style={s.th as React.CSSProperties}>Wants to try</th>
                  <th style={s.th as React.CSSProperties}>Updates</th>
                  <th style={s.th as React.CSSProperties}>Signed up</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => (
                  <tr key={sub.id}>
                    <td style={s.td as React.CSSProperties}><strong>{sub.name}</strong></td>
                    <td style={{ ...(s.td as React.CSSProperties), fontSize: "13px" }}>
                      <a href={`mailto:${sub.email}`} style={{ color: "#1E3A1E", textDecoration: "none" }}>{sub.email}</a>
                    </td>
                    <td style={{ ...(s.td as React.CSSProperties), color: "#7A7060", fontSize: "13px" }}>{sub.location || "—"}</td>
                    <td style={{ ...(s.td as React.CSSProperties), color: "#7A7060", fontSize: "13px" }}>{sub.wantsToTry || "—"}</td>
                    <td style={{ ...(s.td as React.CSSProperties), fontSize: "13px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
                        background: sub.optIn ? "#DCFCE7" : "#F3F4F6",
                        color: sub.optIn ? "#166534" : "#6B7280",
                      }}>
                        {sub.optIn ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ ...(s.td as React.CSSProperties), color: "#7A7060", fontSize: "13px" }}>{formatDate(sub.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {!loading && tab === "sent" && (
          campaigns.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#7A7060" }}>
              No campaigns sent yet. Use the Send email button to send your first email.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={s.tableHead as React.CSSProperties}>
                <tr>
                  <th style={s.th as React.CSSProperties}>Subject</th>
                  <th style={s.th as React.CSSProperties}>Recipients</th>
                  <th style={s.th as React.CSSProperties}>Sent</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td style={s.td as React.CSSProperties}><strong>{c.subject}</strong></td>
                    <td style={{ ...(s.td as React.CSSProperties), color: "#7A7060", fontSize: "13px" }}>{c.recipientCount}</td>
                    <td style={{ ...(s.td as React.CSSProperties), color: "#7A7060", fontSize: "13px" }}>{formatDate(c.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Compose modal */}
      {composing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#F8F5EE", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "6px" }}>
              Send email to all subscribers
            </h2>
            <p style={{ fontSize: "13px", color: "#7A7060", marginBottom: "20px", marginTop: 0 }}>
              This will send to all {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""} on the waiting list.
            </p>

            {sendError && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" }}>
                {sendError}
              </div>
            )}

            {sendResult && (
              <div style={{ background: "#F0FDF4", color: "#166534", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" }}>
                {sendResult}
              </div>
            )}

            <div style={s.row as React.CSSProperties}>
              <label style={s.label as React.CSSProperties}>Subject</label>
              <input
                style={s.input as React.CSSProperties}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Kimchi is ready for collection"
              />
            </div>

            <div style={s.row as React.CSSProperties}>
              <label style={s.label as React.CSSProperties}>
                Body (HTML supported)
              </label>
              <textarea
                style={{ ...(s.textarea as React.CSSProperties), minHeight: "200px" }}
                value={form.htmlBody}
                onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                placeholder="Write your message here. You can use HTML for formatting."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => { setComposing(false); setSendResult(""); setSendError("") }}
                style={s.btnGhost as React.CSSProperties}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !!sendResult}
                style={{ ...(s.btnPrimary as React.CSSProperties), opacity: (sending || !!sendResult) ? 0.6 : 1 }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
