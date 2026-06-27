'use client';

import { motion } from 'framer-motion';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import Link from 'next/link';
import type { TrafficSign } from '@permis2.0/types';
import { useEffect, useState } from 'react';

interface SignImageProps {
  url?: string;
  code?: string;
  category?: string;
  size?: number;
}

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

function SignImage({ url, code, category = 'danger', size = 120 }: SignImageProps) {
  const fallback = categoryEmojis[category] || '🚸';
  const src = url || (code ? `/images/signs/${code}.svg` : null);
  const [error, setError] = useState(false);

  // Reset error state if the source changes (e.g. switching categories).
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        {fallback}
      </div>
    );
  }

  // Render the SVG via a plain <img>: it loads as an external document through
  // the XML parser, so namespaced (ns0:) SVGs render correctly — unlike
  // injecting markup with dangerouslySetInnerHTML, which parses as HTML.
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden p-2"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setError(true)}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

interface TrafficSignCardProps {
  sign: TrafficSign;
  onClick?: () => void;
}

export function TrafficSignCard({
  sign,
  onClick,
}: TrafficSignCardProps) {
  const categoryColors: Record<string, string> = {
    danger: 'from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10 border-red-300 dark:border-red-700',
    interdiction:
      'from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-300 dark:border-orange-700',
    obligation:
      'from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-300 dark:border-blue-700',
    priorite:
      'from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-300 dark:border-yellow-700',
    indication:
      'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 border-green-300 dark:border-green-700',
    direction:
      'from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-300 dark:border-indigo-700',
    temporaire:
      'from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-300 dark:border-amber-700',
    restriction:
      'from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-300 dark:border-purple-700',
    stationnement:
      'from-slate-100 to-slate-50 dark:from-slate-900/20 dark:to-slate-800/10 border-slate-300 dark:border-slate-700',
  };

  const href = onClick ? '#' : `/traffic-signs/${sign.id}`;

  return (
    <motion.div
      whileHover={{ scale: 1.05, translateY: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={href} onClick={onClick}>
        <Card
          className={`cursor-pointer border-2 ${categoryColors[sign.category] || categoryColors.indication} hover:shadow-lg transition-shadow`}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <SignImage url={sign.image} code={sign.code} category={sign.category} size={96} />
              <div className="text-center">
                <h3 className="font-bold text-gray-800 dark:text-white">{sign.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {sign.meaning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

interface TrafficSignDetailProps {
  sign: TrafficSign;
  relatedSigns?: TrafficSign[];
  questions?: unknown[];
}

export function TrafficSignDetail({
  sign,
  relatedSigns = [],
  questions = [],
}: TrafficSignDetailProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Sign Display */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-3xl mb-2">{sign.name}</CardTitle>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {sign.meaning}
              </p>
              {sign.code && (
                <span className="inline-block mt-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                  {sign.code}
                </span>
              )}
            </div>
            <SignImage url={sign.image} code={sign.code} category={sign.category} size={140} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold mb-2 text-gray-800 dark:text-white">
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{sign.description}</p>
          </div>

          {sign.contexte_usage && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-800 dark:text-white">
                Contexte d'usage
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{sign.contexte_usage}</p>
            </div>
          )}

          {sign.regle_associee && (
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 dark:border-primary/30">
              <h3 className="font-bold mb-2 text-primary dark:text-primary-300">
                Règle à respecter
              </h3>
              <p className="text-sm text-gray-800 dark:text-gray-200">{sign.regle_associee}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Catégorie:</strong> {sign.category}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Related Signs */}
      {relatedSigns && relatedSigns.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white mb-4">
            Signaux connexes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedSigns.map((related) => (
              <TrafficSignCard
                key={related.id}
                sign={related}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related Questions */}
      {questions && questions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white mb-4">
            Questions utilisant ce signal
          </h2>
          <div className="space-y-4">
            {questions.map((question: unknown, idx: number) => {
              const q = question as { id: string; enonce: string; choices: { id: string; text: string }[]; category?: { label?: string } };
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <p className="text-gray-800 dark:text-white mb-3">
                        {q.enonce}
                      </p>
                      <div className="space-y-2">
                        {q.choices?.map((choice) => (
                          <div
                            key={choice.id}
                            className="p-2 rounded bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                          >
                            {choice.text}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded text-sm font-medium">
                          {q.category?.label || 'Category'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface TrafficSignCategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  onClick: () => void;
}

export function TrafficSignCategoryCard({
  id,
  name,
  description,
  icon,
  count,
  onClick,
}: TrafficSignCategoryCardProps) {
  const categoryColors: Record<string, string> = {
    danger: 'from-red-500 to-red-600',
    interdiction: 'from-orange-500 to-orange-600',
    obligation: 'from-blue-500 to-blue-600',
    priorite: 'from-yellow-500 to-yellow-600',
    indication: 'from-green-500 to-green-600',
    direction: 'from-indigo-500 to-indigo-600',
    temporaire: 'from-amber-500 to-amber-600',
    restriction: 'from-purple-500 to-purple-600',
    stationnement: 'from-slate-500 to-slate-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={`bg-gradient-to-br ${categoryColors[id] || categoryColors.indication} text-white border-0 hover:shadow-xl transition-shadow`}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-5xl mb-3">{icon}</div>
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <p className="text-sm opacity-90 mb-3">{description}</p>
            <div className="bg-white/20 rounded-full px-3 py-1 inline-block">
              <span className="text-sm font-bold">{count} signaux</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
