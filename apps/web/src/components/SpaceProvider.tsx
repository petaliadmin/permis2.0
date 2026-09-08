'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { hostForSpace, type Space } from '@/lib/space';

const SpaceContext = createContext<Space>('www');

/** Seeds the current subdomain space from the server (middleware `x-permis-space`
 *  header) so client components never flash the wrong menu on hydration. */
export function SpaceProvider({
  space,
  children,
}: {
  space: Space;
  children: React.ReactNode;
}) {
  return <SpaceContext.Provider value={space}>{children}</SpaceContext.Provider>;
}

export function useSpace(): Space {
  return useContext(SpaceContext);
}

/**
 * Absolute URL to `path` on another subdomain space. Returns `null` until the
 * component has mounted (the host is only known client-side) — render the link
 * conditionally to avoid a hydration mismatch on the `href`.
 */
export function useSpaceUrl(target: Space, path = '/'): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(`${window.location.protocol}//${hostForSpace(window.location.host, target)}${path}`);
  }, [target, path]);
  return url;
}
