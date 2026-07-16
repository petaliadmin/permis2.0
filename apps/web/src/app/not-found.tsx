import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-violet-600 mb-2">404</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page introuvable</h2>
        <p className="text-secondary mb-6">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn-violet inline-block">
          Retour aux cours
        </Link>
      </div>
    </div>
  );
}
