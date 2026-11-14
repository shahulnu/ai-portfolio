import { NextResponse } from "next/server";
import { findRecorded } from "@/lib/code-review/data";
import { forwardToJava } from "@/lib/shared/engine-proxy";

export const runtime = "nodejs";
export const maxDuration = 180;

// When set (e.g. http://localhost:8090), requests go to the Python LangGraph service in the
// langgraph-dev-agents repo, which can run live reviews. Otherwise this route serves the recorded
// runs exported from that service, so replay works without it.
const ENGINE = process.env.CODE_REVIEW_ENGINE_URL;
const PATH = "/api/code-review/review";

export async function POST(req: Request) {
  let body: { caseId?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a caseId." }, { status: 400 });
  }
  if (ENGINE) {
    // The proxy helper isn't Java-specific; it forwards to any engine with the same JSON contract.
    return forwardToJava(req, ENGINE, PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  const recorded = body.caseId ? findRecorded(body.caseId) : undefined;
  if (!recorded) return NextResponse.json({ error: `Unknown pull request "${body.caseId}".` }, { status: 404 });
  const notice = body.mode === "live" ? "Live reviews need the Python service, which isn't connected here, so this is a recorded live run." : null;
  return NextResponse.json({ ...recorded, notice });
}

export async function GET(req: Request) {
  if (ENGINE) return forwardToJava(req, ENGINE, PATH, { method: "GET" });
  return NextResponse.json({ liveAvailable: false, engine: "python" });
}
