import { NextResponse } from "next/server";
import { findRecorded, REPLAY_PREFIX } from "@/lib/fax-intake/data";
import { forwardToJava } from "@/lib/shared/engine-proxy";

export const runtime = "nodejs";
export const maxDuration = 180;

// When set (e.g. http://localhost:8091), requests go to the Python LangGraph + MCP service in the
// payer-ai-agents repo, which can run live. Otherwise this route serves recorded runs.
const ENGINE = process.env.FAX_INTAKE_ENGINE_URL;
const PATH = "/api/fax-intake/process";

export async function POST(req: Request) {
  let body: { faxId?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a faxId." }, { status: 400 });
  }
  if (ENGINE) {
    // The proxy helper isn't Java-specific; it forwards to any engine with the same JSON contract.
    return forwardToJava(req, ENGINE, PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  const recorded = body.faxId ? findRecorded(body.faxId) : undefined;
  if (!recorded) return NextResponse.json({ error: `Unknown fax "${body.faxId}".` }, { status: 404 });
  const notice = body.mode === "live" ? "Live runs need the Python service, which isn't connected here, so this is a recorded live run." : null;
  return NextResponse.json({ ...recorded.paused, threadId: `${REPLAY_PREFIX}${recorded.paused.faxId}`, notice });
}

export async function GET(req: Request) {
  if (ENGINE) return forwardToJava(req, ENGINE, PATH, { method: "GET" });
  return NextResponse.json({ liveAvailable: false, engine: "python" });
}
