// Recorded runs exported from the Python service (langgraph-dev-agents: scripts/export_site.py).
// Replay serves these, so the demo works on a deployment without the Python service.
import inc201 from "../../../data/incident/results/INC-201.json";
import inc202 from "../../../data/incident/results/INC-202.json";
import inc203 from "../../../data/incident/results/INC-203.json";
import type { Investigation } from "./types";

export const RECORDED = [inc201, inc202, inc203] as unknown as Investigation[];
export const INCIDENTS = RECORDED.map((r) => r.incident);
export const findRecorded = (id: string) => RECORDED.find((r) => r.incidentId === id);
