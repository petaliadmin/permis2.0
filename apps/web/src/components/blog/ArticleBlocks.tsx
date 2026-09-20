import Link from 'next/link';
import type { ContentBlock } from '@/content/blog';
import { IconArrowRight, IconExternalLink } from '@tabler/icons-react';

const CALLOUT_STYLES: Record<string, { bg: string; title: string; text: string }> = {
  info: { bg: 'bg-primary-50', title: 'text-primary-700', text: 'text-primary-900' },
  success: { bg: 'bg-success-50', title: 'text-success-700', text: 'text-success-700' },
  warning: { bg: 'bg-amber-50', title: 'text-amber-700', text: 'text-amber-900' },
};

export function ArticleBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-secondary sm:text-base">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="pt-2 font-display text-xl font-bold text-foreground">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="font-display text-base font-bold text-foreground">
                {block.text}
              </h3>
            );
          case 'p':
            return <p key={i}>{block.text}</p>;
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case 'callout': {
            const style = CALLOUT_STYLES[block.tone];
            return (
              <div key={i} className={`rounded-2xl ${style.bg} p-4`}>
                <p className={`font-display text-sm font-bold ${style.title}`}>{block.title}</p>
                <p className={`mt-1.5 text-sm leading-relaxed ${style.text}`}>{block.text}</p>
              </div>
            );
          }
          case 'links':
            return (
              <div key={i} className="flex flex-wrap gap-2">
                {block.items.map((link) =>
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
                    >
                      {link.label}
                      <IconExternalLink size="1em" className="text-[11px]" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
                    >
                      {link.label}
                      <IconArrowRight size="1em" className="text-[11px]" aria-hidden="true" />
                    </Link>
                  )
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
