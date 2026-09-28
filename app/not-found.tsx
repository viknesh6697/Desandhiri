import Link from "next/link";

export default function NotFound() {
  return (
    <main className="missing">
      <p className="eyebrow">Desandhiri</p>
      <h1>That journey is not on the shelf.</h1>
      <p>The offline demos are Kashmir, Kerala, and Rajasthan.</p>
      <Link href="/">Back to the planner</Link>
    </main>
  );
}
