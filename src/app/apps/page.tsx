import type { Metadata } from "next";
import { AppCard } from "@/components/AppCard";
import { APP_GROUPS, APPS } from "@/lib/site";

export const metadata: Metadata = { title: "Apps" };

export default function AppsPage() {
  return (
    <div className="wrap">
      <section className="section">
        <div className="section-head text-full">
          <span className="eyebrow">Applications</span>
          <h1>AI apps</h1>
          <p className="muted">
            Each app targets one real workflow, runs on synthetic data, and has a case study covering the problem,
            architecture, evaluation and the path to production.
          </p>
        </div>
      </section>
      {APP_GROUPS.map((g) => (
        <section className="section" key={g.id}>
          <div className="section-head">
            <span className="eyebrow">{g.eyebrow}</span>
            <h2>{g.title}</h2>
          </div>
          <div className="grid g2">
            {APPS.filter((a) => a.group === g.id).map((a) => (
              <AppCard key={a.slug} app={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
