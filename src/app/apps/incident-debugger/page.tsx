import type { Metadata } from "next";
import Link from "next/link";
import { SourceCode } from "@/components/SourceCode";
import evalSummary from "../../../../data/incident/eval-summary.json";

export const metadata: Metadata = { title: "Incident Debugger" };

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

const ROLES = [
  ["Orchestrator", "Claude", "Reads the case file, forms a hypothesis, and each turn either delegates one task or concludes. LangGraph routes its choice with Command(goto)."],
  ["Log analyst", "Claude + read tools", "Error summary before and after the deploy, log search, support and status notes."],
  ["Metrics analyst", "Claude + read tools", "When each metric changed, relative to the deploy."],
  ["Change investigator", "Claude + read tools", "The commits in the deploy and their diffs."],
  ["Code reader", "Claude + read tools", "Source of both versions, with exact lines."],
  ["Reproducer", "Claude writes, code runs", "Writes one pytest test. Code checks it, then runs it on both versions in a subprocess with a timeout."],
  ["Budget, evidence, verdict", "Code", "At most 8 delegations. Every cited log line, commit, file:line, metric and note must exist. The verdict comes from the proof and the verified evidence."],
];

export default function IncidentCaseStudy() {
  const s = evalSummary;
  return (
    <div className="wrap text-full">
      <section className="hero">
        <span className="eyebrow">Developer tools · Multi-agent · LangGraph · Python</span>
        <h1>Incident Debugger</h1>
        <p className="lede">
          A lead agent investigates a production incident by delegating to specialists: logs, metrics, recent changes, source
          code and reproduction. It changes course as evidence comes in. Code accepts a root cause as confirmed only when a test
          fails on the deployed version and passes on the version before it.
        </p>
        <div className="actions">
          <Link href="/apps/incident-debugger/demo" className="btn">
            Run the demo
          </Link>
          <a href="#code" className="btn ghost">
            View the code
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Problem</span>
          <h2>Finding the cause is slower than fixing it</h2>
        </div>
        <p>
          During an incident, the on-call engineer jumps between dashboards, logs, the deploy history and the code, often under
          pressure and often chasing the wrong lead. The most recent deploy gets blamed by default, even when the problem started
          before it. An AI assistant only helps if its conclusion comes with evidence that can be checked and, ideally, a test
          that proves it.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Design</span>
          <h2>An orchestrator that delegates, and code that checks</h2>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Agent or step</th>
                <th>Who</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map(([who, by, what]) => (
                <tr key={who}>
                  <td>{who}</td>
                  <td>{by}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Each specialist is its own LangGraph subgraph with its own tools and tool loop, and reports through a fixed schema.
          Findings go into a shared case file, with any citation that doesn&apos;t exist removed before the orchestrator sees
          it. Unlike the Code Review Agent, where code fixes the plan up front, here the order and number of steps depend on
          what each specialist finds.
        </p>
        <p className="callout">
          The synthetic deploy has a red herring: a commit that changed the log format at the same moment. In the payment
          incident, the timeouts started 18 minutes before the deploy. The orchestrator checked timing first and concluded the
          deploy wasn&apos;t the cause after one delegation.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Evaluation</span>
          <h2>Measured against labeled incidents</h2>
          <p className="muted">
            {s.mode === "live" ? "Live" : "Replay"} run on {s.model}, {s.runAt.slice(0, 10)}. Labeled set: {s.incidents} synthetic
            incidents: a crash on one code path, wrong totals with no errors at all, and a vendor outage that looks like the deploy.
          </p>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Result</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Root cause correct</td>
                <td className="num">{pct(s.rootCauseAccuracy)}</td>
                <td>Right commit and faulty line, or correctly &quot;not caused by the deploy&quot;.</td>
              </tr>
              <tr>
                <td>Verdict correct</td>
                <td className="num">{pct(s.verdictAccuracy)}</td>
                <td>Confirmed by a test, or not caused by the deploy, as labeled.</td>
              </tr>
              <tr>
                <td>Evidence verified</td>
                <td className="num">{pct(s.evidenceVerifiedRate)}</td>
                <td>Cited log lines, commits, code lines, metrics and notes that exist.</td>
              </tr>
              <tr>
                <td>Red herrings blamed</td>
                <td className="num">{s.redHerringsBlamed}</td>
                <td>The log-format commit, or the deploy when it wasn&apos;t the cause.</td>
              </tr>
              <tr>
                <td>Delegations per incident</td>
                <td className="num">{s.avgDelegations}</td>
                <td>Average specialist calls, out of a budget of 8.</td>
              </tr>
              <tr>
                <td>Cost of the run</td>
                <td className="num">${s.totalCostUsd.toFixed(2)}</td>
                <td>All agents across all incidents, at list price.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="callout">
          The first live run concluded the wrong-totals incident right after the proof, before anyone had cited the faulty line,
          so the report described the location in words. Adding a rule to the orchestrator&apos;s prompt fixed it: pin the
          exact line before concluding. Three synthetic incidents show the pipeline works; they aren&apos;t a benchmark.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Path to production</span>
          <h2>What changes in a real deployment</h2>
        </div>
        <div className="grid g2">
          <div className="panel">
            <h3>Integration</h3>
            <ul>
              <li>Specialist tools backed by the real log store, metrics system, deploy history and repository, read-only</li>
              <li>Triggered from the paging alert, posting the timeline and report to the incident channel</li>
              <li>Reproduction in an isolated container per run, with no network and no secrets</li>
            </ul>
          </div>
          <div className="panel">
            <h3>Quality</h3>
            <ul>
              <li>Labeled set built from past postmortems: the real cause, and the leads that were wrong</li>
              <li>Track time to a confirmed cause, and how often engineers agree with the report</li>
              <li>Agents never roll back or change anything; an engineer decides</li>
            </ul>
          </div>
        </div>
      </section>

      <SourceCode slug="incident-debugger" />
    </div>
  );
}
