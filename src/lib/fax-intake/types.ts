// Types for the Fax Intake Agent. The engine is the Python LangGraph + MCP service in the
// payer-ai-agents repo; this site shows its results.

export interface ReadValue {
  value: string | null;
  as_written: string;
  page: number | null;
  legibility: "clear" | "unclear" | "missing";
}

export type FieldKey =
  | "member_name"
  | "member_id"
  | "member_dob"
  | "provider_name"
  | "provider_npi"
  | "service_code"
  | "service_description"
  | "diagnosis_codes"
  | "date_of_service"
  | "urgency"
  | "signature";

export type Extraction = Record<FieldKey, ReadValue> & {
  clinical_summary: string;
  instructions_to_automation: string[];
};

export interface Issue {
  field: string;
  message: string;
  blocking: boolean;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  by: "agent" | "code";
  matchesFax?: boolean;
  ms: number;
}

export type Route = "create_case" | "eligibility_review" | "manual_intake";

export interface IntakeResult {
  faxId: string;
  threadId?: string;
  status: "awaiting_approval" | "completed";
  mode: "live" | "replay";
  engine: "python";
  model: string;
  fax: { id: string; title: string; teaser: string; receivedAt: string; fromFax: string; sender: string };
  extraction: Extraction;
  issues: Issue[];
  lookups: ToolCall[];
  agentSummary: string;
  route: Route;
  routeReason: string;
  actions: { tool: string; args: Record<string, unknown> }[];
  decision: { approved: boolean; reviewer: string; at: string | null } | null;
  results: ToolCall[];
  trace: { node: string; ms: number; detail: string }[];
  usage: { inputTokens: number; outputTokens: number; costUsd: number } | null;
  notice?: string | null;
}
