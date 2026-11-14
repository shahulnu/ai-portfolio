import type { Metadata } from "next";
import { CASES } from "@/lib/code-review/data";
import { CodeReviewDemo } from "./CodeReviewDemo";

export const metadata: Metadata = { title: "Code Review Agent demo" };

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ pr?: string }> }) {
  const { pr } = await searchParams;
  const initial = CASES.some((c) => c.id === pr) ? pr! : CASES[0].id;
  return <CodeReviewDemo cases={CASES} initialCaseId={initial} />;
}
