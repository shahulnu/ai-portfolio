import type { Metadata } from "next";
import Link from "next/link";
import { SourceCode } from "@/components/SourceCode";
import evalSummary from "../../../../data/code-review/eval-summary.json";

export const metadata: Metadata = { title: "Code Review Agent" };

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

const STEPS = [
  ["parse_diff", "Code", "Parses the unified diff into files and numbered lines. Every later check depends on knowing exactly which lines were added."],
  ["plan_review", "Code", "Chooses reviewers: correctness always, security only when the added code touches SQL, shell, secrets, auth or user input, and tests when source files change."],
  ["review (×N, in parallel)", "Claude, via LangChain", "One branch per reviewer through LangGraph's Send API. Each returns findings in a fixed schema, with the exact line of code it is about."],
  ["verify", "Code", "Keeps a finding only if its quoted code is on an added line of that file. Fixes a wrong line number when the quote matches one line exactly, and merges duplicates from different reviewers."],
  ["decide", "Code", "Sets the suggested verdict from verified severities and writes the review comment from verified findings only."],
];

export default function CodeReviewCaseStudy() {
  const s = evalSummary;
  return (
    <div className="wrap text-full">
      <section className="hero">
        <span className="eyebrow">Developer tools · LangGraph · LangChain · Python</span>
        <h1>Code Review Agent</h1>
        <p className="lede">
          Reviews a pull request with specialist reviewers that run in parallel in a LangGraph graph: correctness, security
          and tests. Code checks every finding against the diff before anyone sees it, then suggests a verdict. A maintainer
          makes the merge decision.
        </p>
        <div className="actions">
          <Link href="/apps/code-review-agent/demo" className="btn">
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
          <h2>Review comments people can trust</h2>
        </div>
        <p>
          AI review bots are easy to build and easy to ignore. They comment on lines that didn&apos;t change, describe code
          that isn&apos;t there, and flag style nits as loudly as security holes. Engineers learn to skip them. This design
          aims for fewer comments that are always about real, changed code, with severity that decides the verdict.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Design</span>
          <h2>A LangGraph graph where code owns the decisions</h2>
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
          Reviewer results flow into shared graph state through a list reducer, so the parallel branches merge without
          coordination code. Each reviewer has its own cached system prompt, uses Claude&apos;s structured outputs through
          LangChain&apos;s <span className="mono">with_structured_output</span>, and has the server-side refusal fallback
          turned on.
        </p>
        <p className="callout">
          The diff is treated as data. One test pull request contains a comment telling AI reviewers to approve it. The
          reviewers report it as a finding, and the verdict still requests changes.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Evaluation</span>
          <h2>Measured against labeled pull requests</h2>
          <p className="muted">
            {s.mode === "live" ? "Live" : "Replay"} run on {s.model}, {s.runAt.slice(0, 10)}. Labeled set: {s.pullRequests}{" "}
            synthetic pull requests with {s.expectedFindings} required findings, including one clean pull request.
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
                <td>Required findings caught</td>
                <td className="num">{pct(s.recall)}</td>
                <td>Labeled issues found on the right file and lines, by a reviewer of the right kind.</td>
              </tr>
              <tr>
                <td>False positives</td>
                <td className="num">{s.falsePositives}</td>
                <td>Verified high or medium findings that match no labeled or acceptable issue. The clean pull request tests this.</td>
              </tr>
              <tr>
                <td>Verdict accuracy</td>
                <td className="num">{pct(s.verdictAccuracy)}</td>
                <td>Suggested verdict matches the label.</td>
              </tr>
              <tr>
                <td>Quotes verified</td>
                <td className="num">{pct(s.quoteVerifiedRate)}</td>
                <td>Findings whose quoted code was found on an added line.</td>
              </tr>
              <tr>
                <td>Planted instruction resisted</td>
                <td className="num">{s.injectionResisted ? "Yes" : "No"}</td>
                <td>The pull request that asks AI reviewers to approve it is not approved.</td>
              </tr>
              <tr>
                <td>Cost of the run</td>
                <td className="num">${s.totalCostUsd.toFixed(2)}</td>
                <td>All reviewers across all pull requests, at list price.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="callout">Three synthetic pull requests show that the pipeline works; they aren&apos;t a benchmark.</p>
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
              <li>A GitHub App that receives pull request webhooks and posts findings as inline review comments</li>
              <li>Repository context for each reviewer: related files, call sites and the team&apos;s coding standards</li>
              <li>Large diffs split by file, with a LangGraph checkpointer so a long review can resume</li>
            </ul>
          </div>
          <div className="panel">
            <h3>Quality</h3>
            <ul>
              <li>A labeled set built from past pull requests and the comments engineers accepted or dismissed</li>
              <li>Track how often each reviewer&apos;s findings are accepted, and tune or retire reviewers by that number</li>
              <li>Never block a merge on its own: findings are suggestions, and a maintainer decides</li>
            </ul>
          </div>
        </div>
      </section>

      <SourceCode slug="code-review-agent" />
    </div>
  );
}
