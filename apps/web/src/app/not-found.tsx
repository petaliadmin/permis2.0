import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-green-600 mb-2">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h2>
        <p className="text-gray-600 mb-6">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors inline-block"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
