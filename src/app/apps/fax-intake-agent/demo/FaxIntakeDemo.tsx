"use client";

import { useCallback, useEffect, useState } from "react";
import type { FieldKey, IntakeResult, Route, ToolCall } from "@/lib/fax-intake/types";

type FaxMeta = IntakeResult["fax"];

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "member_name", label: "Member name" },
  { key: "member_id", label: "Member ID" },
  { key: "member_dob", label: "Date of birth" },
  { key: "provider_name", label: "Provider" },
  { key: "provider_npi", label: "NPI" },
  { key: "service_code", label: "Service code" },
  { key: "diagnosis_codes", label: "Diagnosis codes" },
  { key: "date_of_service", label: "Date of service" },
  { key: "urgency", label: "Urgency" },
  { key: "signature", label: "Signature" },
];

const ROUTE: Record<Route, { label: string; cls: string }> = {
  create_case: { label: "Create prior auth case", cls: "p-ok" },
  eligibility_review: { label: "Eligibility review queue", cls: "p-warn" },
  manual_intake: { label: "Manual intake queue", cls: "p-bad" },
};

const LEGIBILITY = { clear: "p-ok", unclear: "p-warn", missing: "p-bad" } as const;

function summarize(result: Record<string, unknown>): string {
  if ("eligible" in result) return `${result.eligible ? "Eligible" : "Not eligible"}: ${result.reason}`;
  if (result.found === false) return "Not found";
  if ("caseId" in result) return `Case ${result.caseId}, ${String(result.status).replace("_", " ")}, decision due ${String(result.decisionDueBy).slice(0, 16).replace("T", " ")} UTC`;
  if ("itemId" in result) return `Queue item ${result.itemId} (${result.queue})`;
  if ("attachmentId" in result) return `Attached ${result.document} as ${result.attachmentId}`;
  if ("name" in result && "dob" in result) return `${result.name}, born ${result.dob}`;
  if ("practice" in result) return `${result.name}, ${result.practice}, ${result.network === "in" ? "in network" : "out of network"}`;
  if ("title" in result) return `${result.id}: ${result.title}`;
  return JSON.stringify(result).slice(0, 120);
}

export function FaxIntakeDemo({ faxes, initialFaxId }: { faxes: FaxMeta[]; initialFaxId: string }) {
  const [faxId, setFaxId] = useState(initialFaxId);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "run" | "approve">(null);

  const post = useCallback(async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
    return data as IntakeResult;
  }, []);

  const run = useCallback(
    async (id: string, m: "replay" | "live") => {
      setBusy("run");
      setError(null);
      try {
        setResult(await post("/api/fax-intake/process", { faxId: id, mode: m }));
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : "Couldn't reach the intake service.");
      } finally {
        setBusy(null);
      }
    },
    [post],
  );

  const decide = async (approved: boolean) => {
    if (!result?.threadId) return;
    setBusy("approve");
    setError(null);
    try {
      setResult(await post("/api/fax-intake/approve", { threadId: result.threadId, approved, reviewer: "demo reviewer" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't record the decision.");
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    fetch("/api/fax-intake/process")
      .then((r) => r.json())
      .then((d) => setLiveAvailable(Boolean(d.liveAvailable)))
      .catch(() => setLiveAvailable(false));
  }, []);

  // Open in a working state: replay the selected fax as soon as it is picked.
  useEffect(() => {
    setResult(null);
    setPage(1);
    run(faxId, "replay");
  }, [faxId, run]);

  const shown = result && result.faxId === faxId ? result : null;
  const meta = faxes.find((f) => f.id === faxId)!;
  const issueFor = (k: string) => shown?.issues.filter((i) => i.field === k) ?? [];

  return (
    <div className="wrap demo-page text-full">
      <section className="demo-head">
        <div>
          <span className="eyebrow">Fax Intake Agent · demo · LangGraph + MCP</span>
          <h1 className="demo-title">Prior authorization fax intake</h1>
        </div>
        <div className="case-tabs" role="tablist" aria-label="Synthetic faxes">
          {faxes.map((f) => (
            <button key={f.id} role="tab" aria-selected={f.id === faxId} className={f.id === faxId ? "case-tab on" : "case-tab"} onClick={() => setFaxId(f.id)}>
              <span className="mono">{f.id}</span>
              <span>{f.teaser}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="demo-grid">
        <section className="demo-col" aria-label="Scanned fax">
          <div className="panel">
            <div className="row-between">
              <h2 className="h-sm">{meta.title}</h2>
              <div className="seg" role="radiogroup" aria-label="Page">
                {[1, 2].map((p) => (
                  <button key={p} role="radio" aria-checked={page === p} className={page === p ? "on" : ""} onClick={() => setPage(p)}>
                    Page {p}
                  </button>
                ))}
              </div>
            </div>
            <span className="mono muted small">
              From {meta.sender} · {meta.fromFax} · received {meta.receivedAt.slice(0, 16).replace("T", " ")} UTC · image-only PDF
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="fax-page" src={`/fax-intake/${faxId}-p${page}.png`} alt={`Scanned page ${page} of ${meta.title}`} width={850} height={1100} />
          </div>
        </section>

        <section className="demo-col" aria-label="Intake" aria-live="polite">
          <div className="panel run-bar">
            <div className="seg" role="radiogroup" aria-label="Mode">
              <button role="radio" aria-checked={mode === "replay"} className={mode === "replay" ? "on" : ""} onClick={() => setMode("replay")}>
                Replay
              </button>
              <button
                role="radio"
                aria-checked={mode === "live"}
                className={mode === "live" ? "on" : ""}
                onClick={() => setMode("live")}
                disabled={!liveAvailable}
                title={liveAvailable ? "Read the fax with Claude now" : "Live mode needs the Python service and an API key"}
              >
                Live
              </button>
            </div>
            <button className="btn" onClick={() => run(faxId, mode)} disabled={busy !== null}>
              {busy === "run" ? "Reading the fax…" : "Process fax"}
            </button>
            <span className="muted small">
              {liveAvailable ? "Live reads the PDF with Claude Opus 5.5 and calls the MCP tools (about 30–60 s)." : "Replay mode: live runs are off on this deployment."}
            </span>
          </div>

          {error && <div className="callout bad">{error}</div>}
          {!shown && !error && <div className="panel muted">{busy ? "Reading the fax…" : "Pick a fax."}</div>}

          {shown && (
            <>
              {shown.notice && <div className="callout">{shown.notice}</div>}

              <div className="panel">
                <h2 className="h-sm">Read from the fax</h2>
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FIELDS.map(({ key, label }) => {
                        const rv = shown.extraction[key];
                        const issues = issueFor(key);
                        return (
                          <tr key={key}>
                            <td>{label}</td>
                            <td>
                              <span className="mono">{rv.value ?? "—"}</span>
                              {rv.legibility !== "clear" && (
                                <div className="small muted">
                                  <span className={`pill ${LEGIBILITY[rv.legibility]}`}>{rv.legibility}</span> {rv.as_written ? `reads as "${rv.as_written}"` : "nothing written"}
                                </div>
                              )}
                            </td>
                            <td className="small">
                              {issues.length === 0 ? <span className="pill p-ok">✓</span> : issues.map((i, n) => <div key={n} className={i.blocking ? "t-bad" : "muted"}>{i.message}</div>)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="small">{shown.extraction.clinical_summary}</p>
                {shown.extraction.instructions_to_automation.length > 0 && (
                  <div className="callout bad small">
                    <b>Text on the fax addressed to automated systems (ignored, shown for review):</b> “{shown.extraction.instructions_to_automation.join(" ")}”
                  </div>
                )}
              </div>

              <div className="panel">
                <h2 className="h-sm">Lookups through MCP tools</h2>
                <ToolTable calls={shown.lookups} />
                <p className="small">{shown.agentSummary}</p>
                <p className="muted small">The agent only sees the four read tools. Code checks every call against the fax and makes any lookup the agent skipped.</p>
              </div>

              <div className="panel route route-ok">
                <div className="row-between">
                  <span className="eyebrow">Route chosen by code</span>
                  <span className={`pill ${ROUTE[shown.route].cls}`}>{ROUTE[shown.route].label}</span>
                </div>
                <p className="small">{shown.routeReason}</p>
                {shown.issues.filter((i) => !FIELDS.some((f) => f.key === i.field)).map((i, n) => (
                  <p key={n} className={`small ${i.blocking ? "t-bad" : "muted"}`}>
                    {i.message}
                  </p>
                ))}
                <h3 className="h-sm">Proposed writes</h3>
                <ol className="small">
                  {shown.actions.map((a, n) => (
                    <li key={n}>
                      <span className="mono">{a.tool}</span> <span className="muted">{actionSummary(a.args)}</span>
                    </li>
                  ))}
                </ol>
                {shown.status === "awaiting_approval" ? (
                  <div className="actions">
                    <button className="btn" onClick={() => decide(true)} disabled={busy !== null}>
                      {busy === "approve" ? "Writing…" : "Approve and write"}
                    </button>
                    <button className="btn ghost" onClick={() => decide(false)} disabled={busy !== null}>
                      Reject
                    </button>
                    <span className="muted small">The graph is paused. Nothing has been written.</span>
                  </div>
                ) : (
                  <p className="small">
                    <span className={`pill ${shown.decision?.approved ? "p-ok" : "p-mute"}`}>{shown.decision?.approved ? "Approved" : "Rejected"}</span>{" "}
                    {shown.decision?.approved ? `${shown.results.length} write(s) made.` : "Nothing was written."}
                  </p>
                )}
              </div>

              {shown.results.length > 0 && (
                <div className="panel">
                  <h2 className="h-sm">Written after approval</h2>
                  <ToolTable calls={shown.results} />
                  <p className="muted small">New cases always start as pending review. Only clinical staff decide them.</p>
                </div>
              )}

              <div className="panel">
                <div className="row-between">
                  <h2 className="h-sm">Graph trace</h2>
                  <span className={`pill ${shown.mode === "live" ? "p-ok" : "p-mute"}`}>
                    {shown.mode === "live" ? `Live · ${shown.model}` : "Replay of a recorded live run"} · Python engine
                  </span>
                </div>
                <div className="tablewrap">
                  <table>
                    <tbody>
                      {shown.trace.map((t, n) => (
                        <tr key={n}>
                          <td className="mono">{t.node}</td>
                          <td className="muted">{t.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {shown.usage && (
                  <p className="muted small">
                    Tokens: {shown.usage.inputTokens.toLocaleString()} in / {shown.usage.outputTokens.toLocaleString()} out, about ${shown.usage.costUsd.toFixed(3)}.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
      <p className="muted small">Synthetic faxes, members, providers and policies. The payer systems are a mock MCP server.</p>
    </div>
  );
}

function actionSummary(args: Record<string, unknown>): string {
  if ("queue" in args) return `→ ${args.queue}: ${String(args.reason).slice(0, 140)}${String(args.reason).length > 140 ? "…" : ""}`;
  if ("member_id" in args) return `member ${args.member_id}, ${args.service_code}, ${args.urgency}, policy ${args.policy_id}`;
  if ("record_id" in args) return `attach ${args.source_fax_id}.pdf to the new record`;
  return "";
}

function ToolTable({ calls }: { calls: ToolCall[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Result</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c, n) => (
            <tr key={n}>
              <td>
                <span className="mono">{c.tool}</span>
                <div className="mono muted small">{Object.values(c.args).map(String).join(", ").slice(0, 60)}</div>
              </td>
              <td className="small">
                {summarize(c.result)}
                {c.matchesFax === false && <div className="t-bad">Not a value on the fax; ignored.</div>}
              </td>
              <td>
                <span className={`pill ${c.by === "agent" ? "p-acc" : "p-mute"}`}>{c.by}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
