import { notFound } from "next/navigation";
import PlannerApp from "@/components/PlannerApp";
import { getDemo } from "@/lib/demo-trips";

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getDemo(slug)) notFound();
  return <PlannerApp initialDemo={slug} />;
}
