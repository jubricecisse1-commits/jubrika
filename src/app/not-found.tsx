import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl font-black text-jubrika-or mb-4">404</div>
        <div className="text-2xl font-black text-white mb-2">Page introuvable</div>
        <p className="text-gray-500 mb-8">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-jubrika-or text-black font-bold px-6 py-3 rounded-xl hover:bg-jubrika-or-clair transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
