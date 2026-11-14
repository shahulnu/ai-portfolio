// Personal details and the app catalog. Edit this file to make the site yours.

export const SITE = {
  name: "Shahul Ummarali",
  fullName: "Shahul Hameed Ummarali",
  title: "Solutions & AI Systems Architect",
  domain: "shahulnu.dev",
  location: "Mississauga, ON, Canada",
  email: "shahulhameed.nu@gmail.com",
  linkedin: "https://www.linkedin.com/in/shahulnu",
  github: "https://github.com/shahulnu",
  resumeUrl: "/resume.pdf",
  yearsExperience: "20+",
  repos: {
    site: "https://github.com/shahulnu/ai-portfolio",
    services: "https://github.com/shahulnu/healthcare-payer-ai-services",
    devAgents: "https://github.com/shahulnu/langgraph-dev-agents",
  },
};

/** Where each healthcare demo's code lives in the site and Java services repos, by app slug. */
export const CODE_PATHS: Record<string, { engine: string; java: string }> = {
  "prior-auth-copilot": { engine: "pa", java: "pa-engine-java" },
  "denial-appeals-assistant": { engine: "appeals", java: "appeals-engine-java" },
  "benefits-navigator": { engine: "benefits", java: "benefits-engine-java" },
  "payment-integrity-radar": { engine: "pi", java: "pi-engine-java" },
  "hcc-evidence-finder": { engine: "hcc", java: "hcc-engine-java" },
};

/** Developer tools demos whose engine is the Python LangGraph service, by app slug. */
export const PYTHON_CODE_PATHS: Record<string, { package: string; data: string; api: string }> = {
  "code-review-agent": { package: "app/code_review", data: "data/code-review", api: "code-review" },
};

export interface AppEntry {
  slug: string;
  name: string;
  area: string;
  technique: string;
  blurb: string;
  status: "live" | "planned";
  group: "payer" | "developer";
}

export const APP_GROUPS: { id: AppEntry["group"]; eyebrow: string; title: string }[] = [
  { id: "payer", eyebrow: "Healthcare payer", title: "One app for each core payer workflow" },
  { id: "developer", eyebrow: "Developer tools", title: "Agents for engineering teams" },
];

export const APPS: AppEntry[] = [
  {
    slug: "prior-auth-copilot",
    name: "Prior Auth Copilot",
    area: "Utilization management",
    technique: "LLM criteria review with verified citations",
    blurb: "Checks a prior authorization request against the coverage policy, one criterion at a time, and cites the evidence for a nurse reviewer.",
    status: "live",
    group: "payer",
  },
  {
    slug: "denial-appeals-assistant",
    name: "Denial & Appeals Assistant",
    area: "Claims",
    technique: "Evidence-checked analysis and drafting",
    blurb: "Explains each denied line from its CARC/RARC codes, decides whether to appeal or correct it, and drafts the appeal from verified evidence.",
    status: "live",
    group: "payer",
  },
  {
    slug: "benefits-navigator",
    name: "Benefits Navigator",
    area: "Member services",
    technique: "Tool-using agent with checked answers",
    blurb: "Answers coverage questions from the member's own plan documents, gets cost estimates from a calculator tool, and checks every citation and dollar figure.",
    status: "live",
    group: "payer",
  },
  {
    slug: "payment-integrity-radar",
    name: "Payment Integrity Radar",
    area: "Fraud, waste & abuse",
    technique: "Robust peer statistics with checked LLM briefs",
    blurb: "Finds providers whose billing stands out from risk-adjusted specialty peers, then writes a neutral, fact-checked brief for investigators.",
    status: "live",
    group: "payer",
  },
  {
    slug: "hcc-evidence-finder",
    name: "HCC Evidence Finder",
    area: "Risk adjustment",
    technique: "MEAT evidence review with code-owned HCC rules",
    blurb: "Compares charts with submitted codes in both directions: missed conditions with MEAT evidence, and unsupported codes to review before a RADV audit.",
    status: "live",
    group: "payer",
  },
  {
    slug: "code-review-agent",
    name: "Code Review Agent",
    area: "Code review",
    technique: "LangGraph parallel reviewers with verified findings",
    blurb: "Reviews a pull request with parallel correctness, security and test reviewers in LangGraph, keeps only findings whose quoted code is in the diff, and suggests a verdict.",
    status: "live",
    group: "developer",
  },
];
