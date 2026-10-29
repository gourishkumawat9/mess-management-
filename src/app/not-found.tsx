import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page max-w-lg text-center">
      <p className="mt-16 text-6xl">🍽️</p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Page not found</h1>
      <p className="mt-1 text-zinc-500">This page doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to the canteen
      </Link>
    </main>
  );
}
