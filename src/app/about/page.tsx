import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

// Career history from the resume (public/resume.pdf). Employers are named; clients
// are described by industry until the owner has checked Cognizant's rules on naming them.
const CAREER = [
  {
    years: "2020–now",
    role: "Solutions Architect",
    org: "Cognizant",
    place: "Mississauga, Canada · Remote",
    highlights:
      "Solutions architect for a U.S. health plan's member, provider, employer and broker portals, serving more than 2 million users. Led digital transformation and cloud migration to a platform of 400+ microservices on Azure, and designed and delivered an Azure OpenAI solution that reads employer group documents and processes the actions in them. Leads a 40-person team across India, Canada and the United States.",
  },
  {
    years: "2018–2020",
    role: "Software Architect",
    org: "Cognizant",
    place: "Herndon, VA, United States",
    highlights:
      "Architected a digital platform for a U.S. mortgage finance client's next-generation bond offerings, automating bond offer processing and reporting.",
  },
  {
    years: "2012–2018",
    role: "Lead Developer",
    org: "Cognizant",
    place: "Chennai, India · United States",
    highlights: "Led the development team for the same health plan's member, provider, employer and broker portals.",
  },
  {
    years: "2010–2012",
    role: "Software Engineer",
    org: "Royal Bank of Scotland",
    place: "Chennai, India",
    highlights:
      "Designed and developed Online Client Services, a self-service portal where corporate clients view accounts, contracts, transactions and balances and raise service requests.",
  },
  {
    years: "2006–2010",
    role: "Associate Consultant",
    org: "Capgemini",
    place: "Pune, India · Oslo, Norway",
    highlights:
      "Developed a regulatory reporting system for a global investment bank, then a next-generation credit bureau system on-site in Oslo for a Norwegian credit information company.",
  },
];

const CREDENTIALS = [
  { name: "Post Graduate Program in Artificial Intelligence and Machine Learning", from: "Purdue University Online" },
  { name: "Bachelor of Technology, Computer Science and Engineering", from: "Calicut University" },
  { name: "Claude Certified Architect – Foundations", from: "Anthropic" },
  { name: "Microsoft Certified: Azure Fundamentals", from: "Microsoft" },
  { name: "Generative AI Overview for Project Managers", from: "Project Management Institute" },
];

export default function AboutPage() {
  return (
    <div className="wrap">
      <section className="section text-full">
        <div className="section-head">
          <span className="eyebrow">About</span>
          <h1>{SITE.fullName}</h1>
          <p className="muted">
            {SITE.title} · {SITE.location}
          </p>
        </div>
        <p>
          I have spent {SITE.yearsExperience} years designing and building software, at Capgemini, Royal Bank of Scotland
          and, since 2012, Cognizant. I have worked as an architect since 2018. Today I am the solutions architect for a
          U.S. health plan&apos;s market-facing portfolio portals – member, provider, employer and broker portals – which
          serve more than 2 million users on a platform of 400+ microservices on Azure. I focus on bringing generative AI into those systems in
          ways that compliance, clinical and operations teams can sign off on, starting with an Azure OpenAI solution
          that reads employer group documents and processes the actions in them. I build generative AI applications with
          Spring AI, LangChain and LangGraph, and I stay hands-on from requirements through production.
        </p>
        <div className="actions">
          <a href={SITE.resumeUrl} className="btn">
            Download resume (PDF)
          </a>
          <a href={SITE.linkedin} className="btn ghost">
            LinkedIn
          </a>
        </div>
      </section>

      <section className="section text-full">
        <div className="section-head">
          <span className="eyebrow">Domain coverage</span>
          <h2>Where I have worked</h2>
        </div>
        <div className="grid two-by-two">
          <div className="panel">
            <h3>Health plan portals on Azure</h3>
            <p className="muted">
              Member, provider, employer and broker portals for a U.S. health plan, serving more than 2 million users.
              Digital transformation and cloud migration to an event-driven platform of 400+ microservices.
            </p>
          </div>
          <div className="panel">
            <h3>Healthcare EDI and prior authorization</h3>
            <p className="muted">X12 EDI transactions, including the 278 prior authorization submission flow.</p>
          </div>
          <div className="panel">
            <h3>Interoperability</h3>
            <p className="muted">FHIR R4 APIs for Patient Access, Provider Directory and Payer-to-Payer exchange.</p>
          </div>
          <div className="panel">
            <h3>Generative AI and document processing</h3>
            <p className="muted">
              An Azure OpenAI solution that reads employer group documents and processes the actions in them. OCR and
              intelligent document processing, with Spring AI, LangChain and LangGraph.
            </p>
          </div>
          <div className="panel span-all">
            <h3>Financial services</h3>
            <p className="muted">
              A bond offering platform for a U.S. mortgage finance client, a client services portal for corporate banking,
              regulatory reporting for a global investment bank, and a credit bureau system in Oslo.
            </p>
          </div>
        </div>
        <p className="muted">
          The demos on this site go further into payer operations (prior authorization review, claims and appeals, risk
          adjustment and payment integrity) using public standards and synthetic data.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Career</span>
          <h2>Timeline</h2>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Years</th>
                <th>Role</th>
                <th>Highlights</th>
              </tr>
            </thead>
            <tbody>
              {CAREER.map((c) => (
                <tr key={`${c.years}-${c.role}`}>
                  <td className="mono nowrap">{c.years}</td>
                  <td>
                    <b>{c.role}</b>
                    <br />
                    {c.org}
                    <br />
                    <span className="muted small">{c.place}</span>
                  </td>
                  <td>{c.highlights}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Credentials</span>
          <h2>Education &amp; certifications</h2>
        </div>
        <div className="tablewrap">
          <table>
            <tbody>
              {CREDENTIALS.map((c) => (
                <tr key={c.name}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td className="muted">{c.from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
