"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileDiff, Finding, ReviewResult, Severity, Verdict } from "@/lib/code-review/types";

const SEVERITY: Record<Severity, string> = { high: "p-bad", medium: "p-warn", low: "p-mute" };
const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  request_changes: { label: "Request changes", cls: "p-bad" },
  comment: { label: "Comment", cls: "p-warn" },
  approve: { label: "Approve", cls: "p-ok" },
};

type CaseMeta = ReviewResult["case"];

export function CodeReviewDemo({ cases, initialCaseId }: { cases: CaseMeta[]; initialCaseId: string }) {
  const [caseId, setCaseId] = useState(initialCaseId);
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async (id: string, m: "replay" | "live") => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/code-review/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id, mode: m }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the review service. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/code-review/review")
      .then((r) => r.json())
      .then((d) => setLiveAvailable(Boolean(d.liveAvailable)))
      .catch(() => setLiveAvailable(false));
  }, []);

  // Open in a working state: replay the selected pull request as soon as it is picked.
  useEffect(() => {
    setResult(null);
    run(caseId, "replay");
  }, [caseId, run]);

  const shown = result && result.caseId === caseId ? result : null;
  const meta = cases.find((c) => c.id === caseId)!;

  return (
    <div className="wrap demo-page text-full">
      <section className="demo-head">
        <div>
          <span className="eyebrow">Code Review Agent · demo · LangGraph</span>
          <h1 className="demo-title">Pull request review</h1>
        </div>
        <div className="case-tabs" role="tablist" aria-label="Synthetic pull requests">
          {cases.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === caseId} className={c.id === caseId ? "case-tab on" : "case-tab"} onClick={() => setCaseId(c.id)}>
              <span className="mono">{c.id}</span>
              <span>{c.teaser}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="demo-grid">
        {/* Left: the pull request */}
        <section className="demo-col" aria-label="Pull request">
          <div className="panel">
            <div className="row-between">
              <h2 className="h-sm">{meta.title}</h2>
              <span className="mono muted small">
                {meta.id} · {meta.author} · {meta.language}
              </span>
            </div>
            <p className="small">{meta.description}</p>
          </div>
          {shown ? (
            shown.files.map((f) => <DiffView key={f.path} file={f} findings={shown.findings.filter((x) => x.file === f.path)} />)
          ) : (
            <div className="panel muted">{running ? "Loading the diff…" : "Pick a pull request."}</div>
          )}
        </section>

        {/* Right: the review */}
        <section className="demo-col" aria-label="Review" aria-live="polite">
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
                title={liveAvailable ? "Run the graph and call Claude now" : "Live mode needs the Python service and an API key"}
              >
                Live
              </button>
            </div>
            <button className="btn" onClick={() => run(caseId, mode)} disabled={running}>
              {running ? "Reviewing…" : "Review pull request"}
            </button>
            <span className="muted small">
              {liveAvailable ? "Live runs the LangGraph service with Claude Opus 5.5 (about 20–40 s)." : "Replay mode: live reviews are off on this deployment."}
            </span>
          </div>

          {error && <div className="callout bad">{error}</div>}

          {shown && (
            <>
              {shown.notice && <div className="callout">{shown.notice}</div>}
              <div className="panel route route-ok">
                <div className="row-between">
                  <span className="eyebrow">Suggested verdict</span>
                  <span className={`pill ${VERDICT[shown.verdict].cls}`}>{VERDICT[shown.verdict].label}</span>
                </div>
                <p>{shown.verdictReason}</p>
                <div className="stats">
                  {(["high", "medium", "low"] as Severity[]).map((s) => (
                    <span key={s}>
                      <b>{shown.findings.filter((f) => f.severity === s).length}</b>
                      {s}
                    </span>
                  ))}
                  <span>
                    <b>{shown.held.length}</b>held by checks
                  </span>
                </div>
                <p className="muted small">Code sets the verdict from verified findings only. A maintainer makes the merge decision.</p>
              </div>

              <div className="panel">
                <h2 className="h-sm">Reviewers the graph ran</h2>
                <ul className="plain-list small">
                  {shown.plan.map((p) => {
                    const r = shown.reviews.find((x) => x.reviewer === p.reviewer);
                    return (
                      <li key={p.reviewer}>
                        <b>{p.reviewer}</b> <span className="muted">· {p.reason}</span>
                        {r && <div className="muted">{r.notes}</div>}
                      </li>
                    );
                  })}
                  {shown.plan.length === 0 && <li className="muted">No code changed, so no reviewers ran.</li>}
                </ul>
              </div>

              {shown.findings.map((f) => (
                <FindingCard key={f.id} f={f} />
              ))}
              {shown.findings.length === 0 && <div className="panel muted">No verified findings.</div>}

              {shown.held.length > 0 && (
                <div className="panel">
                  <h2 className="h-sm">Held by the quote check</h2>
                  <ul className="plain-list small">
                    {shown.held.map((h, i) => (
                      <li key={i}>
                        <b>{h.title}</b> <span className="muted">({h.category}) · {h.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="panel">
                <summary className="h-sm">Review comment</summary>
                <pre className="doc">{shown.comment}</pre>
              </details>

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
                      {shown.trace.map((t) => (
                        <tr key={t.node}>
                          <td className="mono">{t.node}</td>
                          <td className="muted">{t.detail}</td>
                          <td className="num mono">{t.ms} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted small">
                  The <span className="mono">review:*</span> steps run in parallel through LangGraph&apos;s Send API.
                  {shown.usage && ` Tokens: ${shown.usage.inputTokens.toLocaleString()} in / ${shown.usage.outputTokens.toLocaleString()} out, about $${shown.usage.costUsd.toFixed(3)}.`}
                </p>
              </div>
            </>
          )}
        </section>
      </div>
      <p className="muted small">Synthetic pull requests written for this demo.</p>
    </div>
  );
}

function DiffView({ file, findings }: { file: FileDiff; findings: Finding[] }) {
  const flagged = new Map(findings.map((f) => [f.line, f]));
  return (
    <div className="panel">
      <div className="row-between">
        <span className="mono small">{file.path}</span>
        <span className="pill p-mute">{file.status}</span>
      </div>
      <div className="diff" role="table" aria-label={`Diff of ${file.path}`}>
        {file.lines.map((l, i) => {
          const f = l.kind === "add" && l.newNo ? flagged.get(l.newNo) : undefined;
          return (
            <div key={i} className={`diff-line ${l.kind}${f ? ` flag-${f.severity}` : ""}`} role="row">
              <span className="diff-no" role="cell">
                {l.newNo ?? ""}
              </span>
              <span className="diff-mark" role="cell">
                {l.kind === "add" ? "+" : l.kind === "del" ? "−" : ""}
              </span>
              <code role="cell">{l.text || " "}</code>
              {f && (
                <span className="diff-flag" role="cell" title={f.title}>
                  {f.id}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <div className="panel finding">
      <div className="row-between">
        <span>
          <b className="mono">{f.id}</b> {f.title}
        </span>
        <span className={`pill ${SEVERITY[f.severity]}`}>{f.severity}</span>
      </div>
      <span className="mono muted small">
        {f.file}:{f.line} · {f.reviewers.join(" + ")}
      </span>
      <p className="small">{f.explanation}</p>
      <p className="small">
        <b>Fix:</b> {f.suggestion}
      </p>
      <div className="evidence small">
        <span className="pill p-ok">✓ quote found on line {f.line}</span>
        <code>{f.quote.trim()}</code>
        {f.lineCorrected && <span className="muted"> The reviewer cited line {f.citedLine}; code corrected it.</span>}
      </div>
    </div>
  );
}
