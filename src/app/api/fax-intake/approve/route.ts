import { NextResponse } from "next/server";
import { findRecorded, REPLAY_PREFIX } from "@/lib/fax-intake/data";
import { forwardToJava } from "@/lib/shared/engine-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

const ENGINE = process.env.FAX_INTAKE_ENGINE_URL;

/** Resumes a run paused for approval. Replay runs resolve to the recorded outcome. */
export async function POST(req: Request) {
  let body: { threadId?: string; approved?: boolean; reviewer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a threadId and approved." }, { status: 400 });
  }
  const threadId = body.threadId ?? "";
  if (!threadId.startsWith(REPLAY_PREFIX)) {
    if (!ENGINE) return NextResponse.json({ error: "This run isn't available here. Run the fax again." }, { status: 404 });
    return forwardToJava(req, ENGINE, "/api/fax-intake/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  const recorded = findRecorded(threadId.slice(REPLAY_PREFIX.length));
  if (!recorded) return NextResponse.json({ error: "Unknown run." }, { status: 404 });
  const decision = { approved: Boolean(body.approved), reviewer: body.reviewer ?? "demo reviewer", at: new Date().toISOString() };
  if (decision.approved) return NextResponse.json({ ...recorded.approved, decision, threadId });
  // A rejection writes nothing.
  return NextResponse.json({
    ...recorded.paused,
    threadId,
    status: "completed",
    decision,
    results: [],
    trace: [
      ...recorded.paused.trace,
      { node: "approve", ms: 0, detail: `Rejected by ${decision.reviewer}` },
      { node: "act", ms: 0, detail: "Nothing written: the reviewer rejected the proposed actions" },
    ],
  });
}
