"use client";

import { useCallback, useEffect, useState } from "react";
import type { Finding, Investigation, Specialist, Verdict } from "@/lib/incident/types";

type Meta = Investigation["incident"];

const SPECIALIST: Record<Specialist, string> = {
  log_analyst: "Log analyst",
  metrics_analyst: "Metrics analyst",
  change_investigator: "Change investigator",
  code_reader: "Code reader",
  reproducer: "Reproducer",
};

const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed by a test", cls: "p-ok" },
  likely: { label: "Likely, not proven", cls: "p-warn" },
  not_caused_by_deploy: { label: "Not caused by the deploy", cls: "p-acc" },
  inconclusive: { label: "Inconclusive", cls: "p-mute" },
};

const OUTCOME = { passed: "p-ok", failed: "p-bad", error: "p-warn" } as const;

export function IncidentDemo({ incidents, initialId }: { incidents: Meta[]; initialId: string }) {
  const [id, setId] = useState(initialId);
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [result, setResult] = useState<Investigation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async (incidentId: string, m: "replay" | "live") => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/incident/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, mode: m }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the investigation service. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/incident/investigate")
      .then((r) => r.json())
      .then((d) => setLiveAvailable(Boolean(d.liveAvailable)))
      .catch(() => setLiveAvailable(false));
  }, []);

  // Open in a working state: replay the selected incident as soon as it is picked.
  useEffect(() => {
    setResult(null);
    run(id, "replay");
  }, [id, run]);

  const shown = result && result.incidentId === id ? result : null;
  const meta = incidents.find((i) => i.id === id)!;
  const repro = shown?.findings.filter((f) => f.repro).at(-1);

  return (
    <div className="wrap demo-page text-full">
      <section className="demo-head">
        <div>
          <span className="eyebrow">Incident Debugger · demo · LangGraph orchestrator</span>
          <h1 className="demo-title">Production incident investigation</h1>
        </div>
        <div className="case-tabs" role="tablist" aria-label="Synthetic incidents">
          {incidents.map((i) => (
            <button key={i.id} role="tab" aria-selected={i.id === id} className={i.id === id ? "case-tab on" : "case-tab"} onClick={() => setId(i.id)}>
              <span className="mono">{i.id}</span>
              <span>{i.teaser}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="demo-grid">
        <section className="demo-col" aria-label="Investigation timeline">
          <div className="panel">
            <div className="row-between">
              <h2 className="h-sm">{meta.title}</h2>
              <span className="mono muted small">opened {meta.opened.slice(11, 16)} UTC</span>
            </div>
            <p className="small">{meta.description}</p>
          </div>

          {!shown && !error && <div className="panel muted">{running ? "Investigating…" : "Pick an incident."}</div>}
          {shown?.steps.map((s) => {
            const f = s.action === "delegate" ? shown.findings[shown.steps.slice(0, s.n).filter((x) => x.action === "delegate").length - 1] : undefined;
            return <StepCard key={s.n} step={s} finding={f} />;
          })}
        </section>

        <section className="demo-col" aria-label="Conclusion" aria-live="polite">
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
                title={liveAvailable ? "Run the agents with Claude now" : "Live mode needs the Python service and an API key"}
              >
                Live
              </button>
            </div>
            <button className="btn" onClick={() => run(id, mode)} disabled={running}>
              {running ? "Investigating…" : "Investigate"}
            </button>
            <span className="muted small">
              {liveAvailable ? "Live runs the orchestrator and specialists on Claude Opus 5.5 (about 1–2 minutes)." : "Replay mode: live runs are off on this deployment. Replays still run the tests."}
            </span>
          </div>

          {error && <div className="callout bad">{error}</div>}

          {shown && (
            <>
              {shown.notice && <div className="callout">{shown.notice}</div>}
              <div className="panel route route-ok">
                <div className="row-between">
                  <span className="eyebrow">Verdict set by code</span>
                  <span className={`pill ${VERDICT[shown.verdict].cls}`}>{VERDICT[shown.verdict].label}</span>
                </div>
                <p className="small">{shown.verdictReason}</p>
                <div className="stats">
                  <span>
                    <b>{shown.delegations}</b>of {shown.budget} delegations
                  </span>
                  <span>
                    <b>
                      {shown.findings.flatMap((f) => f.evidence).filter((e) => e.verified).length}/{shown.findings.flatMap((f) => f.evidence).length}
                    </b>
                    evidence verified
                  </span>
                  <span>
                    <b>{shown.findings.reduce((n, f) => n + f.calls.length, 0)}</b>tool calls
                  </span>
                </div>
              </div>

              <div className="panel">
                <h2 className="h-sm">Report for the on-call engineer</h2>
                <p className="small">{shown.report.root_cause}</p>
                <dl className="kv small">
                  <dt>Caused by the deploy</dt>
                  <dd>{shown.report.caused_by_deploy ? "Yes" : "No"}</dd>
                  <dt>Commit</dt>
                  <dd className="mono">{shown.report.suspected_commit ?? "—"}</dd>
                  <dt>Location</dt>
                  <dd className="mono">{shown.report.suspected_location ?? "—"}</dd>
                  <dt>Suggested fix</dt>
                  <dd>{shown.report.suggested_fix}</dd>
                </dl>
                {shown.report.ruled_out.length > 0 && (
                  <>
                    <h3 className="h-sm">Ruled out</h3>
                    <ul className="small">
                      {shown.report.ruled_out.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="muted small">Agents only read. The fix is a suggestion for an engineer to make.</p>
              </div>

              {repro?.repro && (
                <div className="panel">
                  <div className="row-between">
                    <h2 className="h-sm">Proof: the test on both versions</h2>
                    <span className={`pill ${repro.repro.proves ? "p-ok" : "p-mute"}`}>{repro.repro.proves ? "Proves the regression" : "Doesn't prove a regression"}</span>
                  </div>
                  <p className="small">{repro.summary}</p>
                  {repro.repro.ran ? (
                    <div className="tablewrap">
                      <table>
                        <tbody>
                          {repro.repro.runs.map((r) => (
                            <tr key={r.version}>
                              <td className="mono">{r.version}</td>
                              <td>
                                <span className={`pill ${OUTCOME[r.outcome]}`}>{r.outcome}</span>
                              </td>
                              <td className="mono small muted">{r.output.split("\n").filter((l) => /FAILED|passed|failed|Error/.test(l)).slice(-1)[0] ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="small t-bad">Not run: {repro.repro.problems.join("; ")}</p>
                  )}
                  <details>
                    <summary className="small">Test written by the reproducer</summary>
                    <pre className="doc">{repro.test_code}</pre>
                  </details>
                  <p className="muted small">The test is checked before it runs (allowed imports only; no files, network or eval) and runs in a subprocess with a timeout.</p>
                </div>
              )}

              <div className="panel">
                <div className="row-between">
                  <h2 className="h-sm">Run</h2>
                  <span className={`pill ${shown.mode === "live" ? "p-ok" : "p-mute"}`}>
                    {shown.mode === "live" ? `Live · ${shown.model}` : "Replay of a recorded live run"} · Python engine
                  </span>
                </div>
                <p className="muted small">
                  Replays re-run every tool call and the reproduction test; only the model&apos;s choices are recorded.
                  {shown.usage && ` Tokens: ${shown.usage.inputTokens.toLocaleString()} in / ${shown.usage.outputTokens.toLocaleString()} out, about $${shown.usage.costUsd.toFixed(2)}.`}
                </p>
              </div>
            </>
          )}
        </section>
      </div>
      <p className="muted small">A synthetic checkout service, commit history, logs and metrics written for this demo.</p>
    </div>
  );
}

function StepCard({ step, finding }: { step: { n: number; reasoning: string; action: string; specialist: Specialist | null; task: string; by: string }; finding?: Finding }) {
  return (
    <div className="panel step">
      <div className="row-between">
        <span className="small">
          <b className="mono">Step {step.n}</b> · {step.by === "code" ? "Budget rule" : "Orchestrator"}
        </span>
        {step.action === "delegate" && step.specialist ? <span className="pill p-acc">→ {SPECIALIST[step.specialist]}</span> : <span className="pill p-ok">Conclude</span>}
      </div>
      <p className="small muted">{step.reasoning}</p>
      {step.task && (
        <p className="small">
          <b>Task:</b> {step.task}
        </p>
      )}
      {finding && (
        <div className="step-finding">
          <p className="small">{finding.summary}</p>
          {finding.evidence.length > 0 && (
            <ul className="plain-list small">
              {finding.evidence.map((e, i) => (
                <li key={i}>
                  <span className={`pill ${e.verified ? "p-ok" : "p-bad"}`}>{e.verified ? "✓" : "✕"}</span> <span className="mono">{e.ref}</span>{" "}
                  <span className="muted">{e.detail}</span>
                </li>
              ))}
            </ul>
          )}
          <details>
            <summary className="small muted">{finding.calls.length} tool call(s)</summary>
            <ul className="plain-list small">
              {finding.calls.map((c, i) => (
                <li key={i}>
                  <span className="mono">{c.tool}</span>
                  <span className="muted"> {Object.values(c.args).map(String).join(", ").slice(0, 80)}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
