import type { Metadata } from "next";
import { AgentPatterns } from "@/components/AgentPatterns";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { FLOW_STEPS } from "@/lib/architecture";

export const metadata: Metadata = { title: "Reference architecture" };

export default function ArchitecturePage() {
  return (
    <div className="wrap">
      <section className="section text-full">
        <div className="section-head">
          <span className="eyebrow">Reference architecture</span>
          <h1>One platform behind every app</h1>
          <p className="muted">
            Each application is a thin workflow on a shared platform. The platform owns the hard parts once: identity, PHI
            handling, retrieval, evaluation and observability.
          </p>
        </div>
        <ArchitectureDiagram />
        <p className="muted small">
          Highlighted boxes are the controls that make AI output safe to act on in a health plan. Teal arrows carry requests,
          orange arrows carry results back, the dotted arrow is logging, and the numbers follow one request.
        </p>
      </section>

      <section className="section text-full">
        <div className="section-head">
          <span className="eyebrow">Request flow</span>
          <h2>One request, end to end</h2>
        </div>
        <ol className="flow-steps">
          {FLOW_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Decisions</span>
          <h2>Trade-offs I made, and why</h2>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Decision</th>
                <th>Choice</th>
                <th>Reasoning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Agent or workflow</td>
                <td>Fixed workflows by default; agents where the path varies</td>
                <td>
                  Payer processes are well defined and audited, and a fixed sequence is easier to test, explain to compliance
                  and debug. Benefits questions and fax lookups vary case by case, so those use tool-using agents in LangGraph,
                  with read-only tools and code checking the result.
                </td>
              </tr>
              <tr>
                <td>Who decides</td>
                <td>Code routes, people decide</td>
                <td>The model produces findings. Routing thresholds sit in code where they can be reviewed and versioned.</td>
              </tr>
              <tr>
                <td>Trusting citations</td>
                <td>Verbatim match check</td>
                <td>A cheap deterministic check catches paraphrased or invented evidence before a reviewer sees it.</td>
              </tr>
              <tr>
                <td>RAG vs. fine-tuning</td>
                <td>Retrieval</td>
                <td>Medical policies change every quarter. Retrieval picks up a new version the day it&apos;s published.</td>
              </tr>
              <tr>
                <td>Hosting</td>
                <td>AWS, Claude on Bedrock</td>
                <td>Most large payers already run on AWS under a BAA, so no new vendor review is needed.</td>
              </tr>
              <tr>
                <td>Tool access</td>
                <td>MCP servers, read-only for agents</td>
                <td>
                  The systems team owns and secures each MCP server once, and any agent or client can use it. Agents get only
                  lookup tools; write tools are called by code.
                </td>
              </tr>
              <tr>
                <td>Writes to systems of record</td>
                <td>Human approval as a graph interrupt</td>
                <td>
                  The run pauses before any write and resumes only on a person&apos;s approval. The pause is part of the workflow
                  state, so a client can&apos;t skip it, and the audit log records who approved.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section text-full">
        <div className="section-head">
          <span className="eyebrow">Agent patterns</span>
          <h2>Two multi-agent designs, with code in charge of both</h2>
        </div>
        <p>
          The developer tools demos use the two common ways to split work across agents. In both, agents only read; code checks
          what they return and makes the final call.
        </p>
        <AgentPatterns />
      </section>
    </div>
  );
}
