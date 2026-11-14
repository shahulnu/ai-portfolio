// Recorded runs exported from the Python service (payer-ai-agents: scripts/export_site.py): each fax's
// run paused for approval, and the same run after approval. Replay serves these, so the demo works
// on a deployment without the Python service.
import fax001 from "../../../data/fax-intake/results/FAX-001.json";
import fax002 from "../../../data/fax-intake/results/FAX-002.json";
import fax003 from "../../../data/fax-intake/results/FAX-003.json";
import fax004 from "../../../data/fax-intake/results/FAX-004.json";
import type { IntakeResult } from "./types";

type Recorded = { paused: IntakeResult; approved: IntakeResult };

export const RECORDED = [fax001, fax002, fax003, fax004] as unknown as Recorded[];
export const FAXES = RECORDED.map((r) => r.paused.fax);
export const findRecorded = (id: string) => RECORDED.find((r) => r.paused.faxId === id);

/** Replay thread ids are "replay:<fax id>"; live ones come from the Python service. */
export const REPLAY_PREFIX = "replay:";
