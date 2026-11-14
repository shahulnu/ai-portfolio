import type { Metadata } from "next";
import { INCIDENTS } from "@/lib/incident/data";
import { IncidentDemo } from "./IncidentDemo";

export const metadata: Metadata = { title: "Incident Debugger demo" };

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ incident?: string }> }) {
  const { incident } = await searchParams;
  const initial = INCIDENTS.some((i) => i.id === incident) ? incident! : INCIDENTS[0].id;
  return <IncidentDemo incidents={INCIDENTS} initialId={initial} />;
}
