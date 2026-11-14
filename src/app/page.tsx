import Link from "next/link";
import { AppCard } from "@/components/AppCard";
import { APP_GROUPS, APPS, SITE } from "@/lib/site";

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero hero-full">
        <span className="eyebrow">{SITE.title}</span>
        <h1>
          I design AI systems that teams can <em>actually put into production.</em>
        </h1>
        <p className="lede">
          {SITE.yearsExperience} years building and architecting software, most recently for a U.S. healthcare payer. This site shows
          working AI applications for core health plan workflows and for engineering teams, each with the evaluation,
          citations, human review and data handling that production needs.
        </p>
        <div className="stats">
          <span>
            <b>{SITE.yearsExperience} yrs</b>software &amp; architecture
          </span>
          <span>
            <b>{APPS.length}</b>working AI applications
          </span>
          <span>
            <b>FHIR · X12 · CMS</b>standards I build on
          </span>
        </div>
        <div className="actions">
          <Link href="/apps/prior-auth-copilot/demo" className="btn">
            Try the Prior Auth Copilot
          </Link>
          <Link href="/apps" className="btn ghost">
            See all apps
          </Link>
        </div>
      </section>

      {APP_GROUPS.map((g) => (
        <section className="section" key={g.id}>
          <div className="section-head">
            <span className="eyebrow">{g.eyebrow}</span>
            <h2>{g.title}</h2>
          </div>
          <div className="grid g3">
            {APPS.filter((a) => a.group === g.id).map((a) => (
              <AppCard key={a.slug} app={a} />
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">How they are built</span>
          <h2>Different problems, same safeguards</h2>
        </div>
        <div className="grid g3">
          <div className="panel">
            <h3>Model output is checked in code</h3>
            <p className="muted">
              Every quote, field reading and citation is checked against its source before anyone sees it. Routes and verdicts
              are set by code, not the prompt.
            </p>
          </div>
          <div className="panel">
            <h3>People make the decisions</h3>
            <p className="muted">
              The AI recommends and routes. It never issues a denial, agents only get read tools, and nothing is written to a
              system of record until a person approves.
            </p>
          </div>
          <div className="panel">
            <h3>Measured against labeled cases</h3>
            <p className="muted">
              Each app ships with a labeled test set and an eval script, so accuracy claims come with a number and a method.
              When a check fails, the prompt is fixed, never the check.
            </p>
          </div>
        </div>
        <p>
          <Link href="/architecture">Read the reference architecture →</Link>
        </p>
      </section>
    </div>
  );
}
