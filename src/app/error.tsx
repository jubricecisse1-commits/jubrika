"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl font-black text-white mb-2">Une erreur s&apos;est produite</div>
        <p className="text-gray-500 mb-6 text-sm">{error.message}</p>
        <button
          onClick={reset}
          className="bg-jubrika-or text-black font-bold px-6 py-3 rounded-xl hover:bg-jubrika-or-clair transition-all"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
