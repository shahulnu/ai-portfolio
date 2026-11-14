import type { Metadata } from "next";
import { FAXES } from "@/lib/fax-intake/data";
import { FaxIntakeDemo } from "./FaxIntakeDemo";

export const metadata: Metadata = { title: "Fax Intake Agent demo" };

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ fax?: string }> }) {
  const { fax } = await searchParams;
  const initial = FAXES.some((f) => f.id === fax) ? fax! : FAXES[0].id;
  return <FaxIntakeDemo faxes={FAXES} initialFaxId={initial} />;
}
