// Recorded runs exported from the Python service (langgraph-dev-agents: scripts/export_site.py).
// Replay mode serves these, so the demo works on a deployment without the Python service.
import pr101 from "../../../data/code-review/results/PR-101.json";
import pr102 from "../../../data/code-review/results/PR-102.json";
import pr103 from "../../../data/code-review/results/PR-103.json";
import type { ReviewResult } from "./types";

export const RECORDED = [pr101, pr102, pr103] as unknown as ReviewResult[];
export const CASES = RECORDED.map((r) => r.case);
export const findRecorded = (id: string) => RECORDED.find((r) => r.caseId === id);
