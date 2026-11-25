import Link from "next/link";

// Two small static diagrams comparing the multi-agent patterns in the Developer tools demos.
// They use the same .arch-* classes as the platform diagram, so they follow the light/dark theme.

type B = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  hl?: boolean;
};

function Box({ x, y, w, h, label, sub, hl }: B) {
  const ty = y + h / 2 + (sub ? -3 : 5);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className={hl ? "arch-box arch-key" : "arch-box"}
      />
      <text x={x + w / 2} y={ty} textAnchor="middle" className="arch-label">
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={ty + 16}
          textAnchor="middle"
          className="arch-sub"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Markers({ id }: { id: string }) {
  return (
    <defs>
      {(["req", "ret"] as const).map((k) => (
        <marker
          key={k}
          id={`${id}-${k}`}
          viewBox="0 0 8 8"
          refX="8"
          refY="4"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" className={`arch-ah-${k}`} />
        </marker>
      ))}
    </defs>
  );
}

function Line({
  d,
  kind,
  arrow,
  id,
}: {
  d: string;
  kind: "req" | "ret";
  arrow?: boolean;
  id: string;
}) {
  return (
    <path
      d={d}
      className={`arch-line arch-${kind}`}
      markerEnd={arrow ? `url(#${id}-${kind})` : undefined}
    />
  );
}

function FanOut() {
  const id = "ap-fan";
  return (
    <svg
      viewBox="0 0 560 290"
      className="ap-svg"
      role="img"
      aria-labelledby={`${id}-t`}
    >
      <title id={`${id}-t`}>
        Fixed fan-out: code parses and plans, three reviewers run in parallel,
        code verifies and decides.
      </title>
      <Markers id={id} />
      <Box x={8} y={120} w={100} h={50} label="Parse diff" sub="code" />
      <Box x={136} y={120} w={100} h={50} label="Plan" sub="code" hl />
      <Box x={282} y={30} w={110} h={50} label="Correctness" sub="Claude" />
      <Box x={282} y={120} w={110} h={50} label="Security" sub="Claude" />
      <Box x={282} y={210} w={110} h={50} label="Tests" sub="Claude" />
      <Box x={442} y={80} w={110} h={50} label="Verify" sub="code" hl />
      <Box x={442} y={165} w={110} h={50} label="Decide" sub="code" hl />
      <Line id={id} d="M108,145 H136" kind="req" arrow />
      <Line id={id} d="M236,145 H252 V55 H282" kind="req" arrow />
      <Line id={id} d="M252,145 H282" kind="req" arrow />
      <Line id={id} d="M252,145 V235 H282" kind="req" arrow />
      <Line id={id} d="M392,55 H412 V105" kind="ret" />
      <Line id={id} d="M392,145 H412 V105" kind="ret" />
      <Line id={id} d="M392,235 H412 V105" kind="ret" />
      <Line id={id} d="M412,105 H442" kind="ret" arrow />
      <Line id={id} d="M497,130 V165" kind="req" arrow />
      <text x={8} y={282} className="arch-sub">
        Planned once by code; reviewers run in parallel (Send) and report once.
      </text>
    </svg>
  );
}

function Orchestrator() {
  const id = "ap-orch";
  const xs = [8, 110, 212, 314, 416];
  const names: [string, string][] = [
    ["Logs", "read tools"],
    ["Metrics", "read tools"],
    ["Changes", "read tools"],
    ["Code", "read tools"],
    ["Reproducer", "writes a test"],
  ];
  return (
    <svg
      viewBox="0 0 560 290"
      className="ap-svg"
      role="img"
      aria-labelledby={`${id}-t`}
    >
      <title id={`${id}-t`}>
        Dynamic orchestration: an orchestrator delegates to five specialists one
        at a time, reads the case file of verified evidence, and concludes; code
        runs the proof and sets the verdict.
      </title>
      <Markers id={id} />
      <Box
        x={196}
        y={16}
        w={150}
        h={54}
        label="Orchestrator"
        sub="picks the next step"
        hl
      />
      <Box
        x={8}
        y={16}
        w={140}
        h={54}
        label="Report + verdict"
        sub="code: proof required"
        hl
      />
      <Line id={id} d="M196,43 H148" kind="req" arrow />
      <text x={172} y={36} textAnchor="middle" className="arch-sub">
        done
      </text>
      <Line id={id} d="M271,70 V92" kind="req" />
      <Line id={id} d="M54,92 H462" kind="req" />
      {xs.map((x, i) => (
        <g key={x}>
          <Line id={id} d={`M${x + 46},92 V122`} kind="req" arrow />
          <Box
            x={x}
            y={122}
            w={92}
            h={50}
            label={names[i][0]}
            sub={names[i][1]}
            hl={i === 4}
          />
          <Line id={id} d={`M${x + 46},172 V186`} kind="ret" />
        </g>
      ))}
      <Line id={id} d="M54,186 H462" kind="ret" />
      <Line id={id} d="M271,186 V214" kind="ret" arrow />
      <Box
        x={161}
        y={214}
        w={220}
        h={46}
        label="Case file"
        sub="verified evidence only"
        hl
      />
      <Line id={id} d="M381,237 H540 V43 H346" kind="ret" arrow />
      <text x={8} y={282} className="arch-sub">
        One specialist at a time; the path depends on what each one finds.
      </text>
    </svg>
  );
}

export function AgentPatterns() {
  return (
    <div className="grid">
      <div className="panel ap-row">
        <div className="arch-wrap ap-wrap">
          <FanOut />
        </div>
        <div className="ap-text">
          <h3>Fixed fan-out</h3>
          <p className="small">
            Use when the work is known up front. Code decides which reviewers
            run, and they all run once, at the same time.
          </p>
          <Link href="/apps/code-review-agent" className="small">
            Code Review Agent →
          </Link>
        </div>
      </div>
      <div className="panel ap-row">
        <div className="arch-wrap ap-wrap">
          <Orchestrator />
        </div>
        <div className="ap-text">
          <h3>Dynamic orchestration</h3>
          <p className="small">
            Use when each step depends on the last finding. A lead agent
            delegates, reads the evidence and changes course; code caps the
            budget, checks every citation and sets the verdict.
          </p>
          <Link href="/apps/incident-debugger" className="small">
            Incident Debugger →
          </Link>
        </div>
      </div>
    </div>
  );
}
