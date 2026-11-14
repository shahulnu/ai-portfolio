// Types for the Code Review Agent. The engine is the Python LangGraph service in the
// langgraph-dev-agents repo; this site shows its results.

export type Reviewer = "correctness" | "security" | "tests";
export type Severity = "high" | "medium" | "low";
export type Verdict = "request_changes" | "comment" | "approve";

export interface DiffLine {
  kind: "add" | "del" | "ctx";
  text: string;
  oldNo: number | null;
  newNo: number | null;
}

export interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted";
  lines: DiffLine[];
}

export interface Finding {
  id: string;
  file: string;
  line: number;
  quote: string;
  severity: Severity;
  category: Reviewer;
  reviewers: Reviewer[];
  title: string;
  explanation: string;
  suggestion: string;
  lineCorrected: boolean;
  citedLine?: number;
}

export interface HeldFinding extends Omit<Finding, "id"> {
  reason: string;
}

export interface ReviewResult {
  caseId: string;
  mode: "live" | "replay";
  engine: "python";
  model: string;
  case: { id: string; title: string; author: string; language: string; description: string; teaser: string };
  files: FileDiff[];
  plan: { reviewer: Reviewer; reason: string }[];
  reviews: { reviewer: Reviewer; notes: string; findingCount: number; usage: { inputTokens: number; outputTokens: number }; ms: number }[];
  findings: Finding[];
  held: HeldFinding[];
  verdict: Verdict;
  verdictReason: string;
  comment: string;
  trace: { node: string; ms: number; detail: string }[];
  usage: { inputTokens: number; outputTokens: number; costUsd: number } | null;
  notice?: string | null;
}
