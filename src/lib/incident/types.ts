// Types for the Incident Debugger. The engine is the Python LangGraph service in the
// langgraph-dev-agents repo; this site shows its results.

export type Specialist = "log_analyst" | "change_investigator" | "code_reader" | "metrics_analyst" | "reproducer";
export type Verdict = "confirmed" | "likely" | "not_caused_by_deploy" | "inconclusive";

export interface Step {
  n: number;
  reasoning: string;
  action: "delegate" | "conclude";
  specialist: Specialist | null;
  task: string;
  by: "orchestrator" | "code";
  ms: number;
}

export interface ReproRun {
  version: string;
  outcome: "passed" | "failed" | "error";
  output: string;
  ms: number;
}

export interface Finding {
  specialist: Specialist;
  task: string;
  summary: string;
  confidence?: string | null;
  calls: { tool: string; args: Record<string, unknown>; result: string }[];
  evidence: { ref: string; detail: string; verified: boolean }[];
  test_code?: string;
  repro?: { ran: boolean; problems: string[]; runs: ReproRun[]; proves: boolean };
}

export interface Investigation {
  incidentId: string;
  mode: "live" | "replay";
  engine: "python";
  model: string;
  incident: { id: string; title: string; teaser: string; opened: string; description: string };
  steps: Step[];
  findings: Finding[];
  report: {
    root_cause: string;
    caused_by_deploy: boolean;
    suspected_commit: string | null;
    suspected_location: string | null;
    evidence: { ref: string; verified: boolean }[];
    ruled_out: string[];
    suggested_fix: string;
    confidence: string;
  };
  verdict: Verdict;
  verdictReason: string;
  delegations: number;
  budget: number;
  usage: { inputTokens: number; outputTokens: number; costUsd: number } | null;
  notice?: string | null;
}
