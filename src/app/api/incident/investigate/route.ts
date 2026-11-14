import { NextResponse } from "next/server";
import { findRecorded } from "@/lib/incident/data";
import { forwardToJava } from "@/lib/shared/engine-proxy";

export const runtime = "nodejs";
export const maxDuration = 300;

// When set (e.g. http://localhost:8090), requests go to the Python LangGraph service in the
// langgraph-dev-agents repo, which can run live. Otherwise this route serves recorded runs.
const ENGINE = process.env.INCIDENT_ENGINE_URL;
const PATH = "/api/incident/investigate";

export async function POST(req: Request) {
  let body: { incidentId?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with an incidentId." }, { status: 400 });
  }
  if (ENGINE) {
    // The proxy helper isn't Java-specific; it forwards to any engine with the same JSON contract.
    return forwardToJava(req, ENGINE, PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  const recorded = body.incidentId ? findRecorded(body.incidentId) : undefined;
  if (!recorded) return NextResponse.json({ error: `Unknown incident "${body.incidentId}".` }, { status: 404 });
  const notice = body.mode === "live" ? "Live runs need the Python service, which isn't connected here, so this is a recorded live run." : null;
  return NextResponse.json({ ...recorded, notice });
}

export async function GET(req: Request) {
  if (ENGINE) return forwardToJava(req, ENGINE, PATH, { method: "GET" });
  return NextResponse.json({ liveAvailable: false, engine: "python" });
}
