'use client';

type SignCategory = 'Danger' | 'Interdiction' | 'Obligation' | 'Priorité' | 'Indication' | 'Direction' | 'Temporaire' | 'Restriction' | 'Stationnement';

interface TrafficSignSVGProps {
  code?: string;
  category?: SignCategory;
  className?: string;
  size?: number;
  fallbackEmoji?: string;
}

export const TrafficSignSVG: React.FC<TrafficSignSVGProps> = ({
  code,
  category = 'Danger',
  className = '',
  size = 120,
  fallbackEmoji,
}) => {
  const src = code ? `/images/signs/${code}.svg` : null;

  const categoryEmojis: Record<string, string> = {
    danger: '⚠️',
    interdiction: '🚫',
    obligation: '🔵',
    priorite: '✨',
    indication: 'ℹ️',
    direction: '➡️',
    temporaire: '🚧',
    restriction: '📏',
    stationnement: '🅿️',
  };

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        {fallbackEmoji || categoryEmojis[category.toLowerCase()] || '🚸'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Panneau ${code}`}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 8, background: '#fff' }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.outerHTML = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:#fff;color:#111827;">${fallbackEmoji || categoryEmojis[category.toLowerCase()] || '🚸'}</div>`;
      }}
    />
  );
};

export default TrafficSignSVG;
