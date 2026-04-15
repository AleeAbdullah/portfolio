import Link from "next/link";

export default function Custom404() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 text-center text-gray-100">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-3 text-gray-400">Page not found.</p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-white/20 px-5 py-2 text-sm text-gray-100 transition hover:border-white/35"
      >
        Back to Home
      </Link>
    </main>
  );
}
