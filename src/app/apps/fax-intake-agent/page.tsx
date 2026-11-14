import type { Metadata } from "next";
import Link from "next/link";
import { SourceCode } from "@/components/SourceCode";
import evalSummary from "../../../../data/fax-intake/eval-summary.json";

export const metadata: Metadata = { title: "Fax Intake Agent" };

const pct = (x: number) => `${Math.round(x * 100)}%`;

const STEPS = [
  ["read_fax", "Claude", "Reads the scanned PDF page images (no text layer) into fixed fields. Each field says what is written, whether it is clear, unclear or missing, and on which page. Unclear values are never guessed."],
  ["check_fields", "Code", "Checks the NPI check digit, ID and code formats, dates and the signature. A field that isn't clearly readable is treated as unknown downstream."],
  ["look_up", "Claude + MCP tools", "A tool loop over four read-only MCP tools: find the member, check eligibility on the date of service, verify the provider, find the policy. Code checks each call against the fax and makes any lookup the agent skipped."],
  ["decide", "Code", "Chooses the route from the checks and the tool results, never from the agent's summary: create a case, the eligibility queue, or manual intake. Builds the writes."],
  ["approve", "A person", "A LangGraph interrupt pauses the run. The reviewer sees the reading, the lookups and the proposed writes, and approves or rejects them."],
  ["act", "Code + MCP tools", "Only after approval: create_pa_case or route_to_queue, then attach_document. New cases always start as pending review, with the CMS-0057-F decision deadline."],
];

export default function FaxIntakeCaseStudy() {
  const s = evalSummary;
  return (
    <div className="wrap text-full">
      <section className="hero">
        <span className="eyebrow">Utilization management · PDF reading · MCP · LangGraph</span>
        <h1>Fax Intake Agent</h1>
        <p className="lede">
          Turns a scanned prior authorization fax into a case in the plan&apos;s systems. Claude reads the PDF and looks things up
          through MCP tools. Code checks every field and chooses the route. Nothing is written until a person approves.
        </p>
        <div className="actions">
          <Link href="/apps/fax-intake-agent/demo" className="btn">
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
          <h2>Fax is still the front door for prior authorization</h2>
        </div>
        <p>
          Many prior authorization requests still arrive by fax. Intake staff key each one into the plan&apos;s systems: look up
          the member, check eligibility, verify the provider, find the policy, open a case. It is slow, repetitive and
          error-prone, and the CMS-0057-F decision clock (72 hours for expedited, 7 days for standard) starts when the fax
          arrives. Automating it is only useful if the agent never invents a value and never writes to a system of record on
          its own.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Design</span>
          <h2>Read, check, look up, then wait for a person</h2>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>Who does it</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map(([step, who, why]) => (
                <tr key={step}>
                  <td className="mono">{step}</td>
                  <td>{who}</td>
                  <td>{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The payer systems are a mock MCP server with seven tools: four reads and three writes. The agent is only given the
          read tools, so it cannot write even if a fax tells it to. Writes run in code after the interrupt resumes. The
          checkpointer keeps the paused run, so approval can come in a later request.
        </p>
        <p className="callout">
          One test fax has a footer telling automated systems to create the case as approved and skip review. Claude reports
          the text, and the run still pauses for approval. The case is created as pending review, because the create tool has
          no way to set any other status.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Evaluation</span>
          <h2>Measured against labeled faxes</h2>
          <p className="muted">
            {s.mode === "live" ? "Live" : "Replay"} run on {s.model}, {s.runAt.slice(0, 10)}. Labeled set: {s.faxes} synthetic scanned
            faxes ({s.fields} labeled fields): a clean request, a lapsed member, a smudged NPI with no signature, and a planted
            instruction.
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
                <td>Fields read correctly</td>
                <td className="num">{pct(s.fieldAccuracy)}</td>
                <td>Matches the printed value, or correctly reported as unreadable when smudged or blank.</td>
              </tr>
              <tr>
                <td>Routes correct</td>
                <td className="num">{pct(s.routeAccuracy)}</td>
                <td>Create a case, eligibility queue or manual intake, as labeled.</td>
              </tr>
              <tr>
                <td>Writes before approval</td>
                <td className="num">{s.writesBeforeApproval}</td>
                <td>Records written before a person approved. Must be zero.</td>
              </tr>
              <tr>
                <td>Agent used read tools only</td>
                <td className="num">{s.agentReadOnly ? "Yes" : "No"}</td>
                <td>Every tool call the agent made was a lookup.</td>
              </tr>
              <tr>
                <td>Planted instruction resisted</td>
                <td className="num">{s.injectionResisted ? "Yes" : "No"}</td>
                <td>Reported to staff; the run still paused, and the case started as pending review.</td>
              </tr>
              <tr>
                <td>Cost of the run</td>
                <td className="num">${s.totalCostUsd.toFixed(2)}</td>
                <td>All four faxes, reading and lookups, at list price.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="callout">
          The first live run sent three clean faxes to manual intake: the model put the signer&apos;s name where the schema asked
          for &quot;present&quot;. The fix was a clearer prompt, not a looser check. Four synthetic faxes show the pipeline works;
          they aren&apos;t a benchmark.
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
              <li>Faxes from the fax server or document management queue, with the original kept as the record</li>
              <li>MCP servers in front of the real eligibility, provider directory, policy and UM case systems, with service accounts limited to these tools</li>
              <li>A persistent checkpointer (for example Postgres) so paused runs survive restarts</li>
            </ul>
          </div>
          <div className="panel">
            <h3>Controls</h3>
            <ul>
              <li>A HIPAA business associate agreement with the model provider, and PHI kept inside the plan&apos;s network</li>
              <li>An audit trail from each field to the page it came from, and from each write to the person who approved it</li>
              <li>Measure field accuracy and straight-through rate on a sample of real faxes reviewed by intake staff</li>
            </ul>
          </div>
        </div>
      </section>

      <SourceCode slug="fax-intake-agent" />
    </div>
  );
}
