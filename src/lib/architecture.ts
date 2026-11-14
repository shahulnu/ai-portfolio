// Plain data shared by the server-rendered Architecture page and the client-side diagram.

export const FLOW_STEPS = [
  "A request arrives from a portal, the reviewer workbench, a faxed PDF, or as an X12 278 / FHIR PAS transaction.",
  "The gateway authenticates the caller (SSO) and applies rate limits.",
  "Identifiers are redacted and documents are screened for prompt injection before any model sees them.",
  "The workflow, or a LangGraph agent where the path varies, pulls the policy, records and system data it needs through read-only tools and MCP servers.",
  "The workflow calls Claude for reasoning over text and documents, or a classic ML model for scoring.",
  "Model findings come back as structured output with verbatim quotes or field readings.",
  "Code verifies every quote and field against the source and applies the routing rules.",
  "The case lands in the human review queue: a person approves any write, and a nurse or physician makes every coverage decision.",
  "Every step is written to the audit log and traced for quality, latency and cost.",
];
