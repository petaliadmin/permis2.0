import type { Metadata } from 'next';
import { Suspense } from 'react';
import EcolesClient from './EcolesClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Trouver une auto-école au Sénégal',
  description:
    'Comparez les auto-écoles partenaires par ville, catégorie de permis et prix, localisez-les sur la carte, et pré-inscrivez-vous en ligne.',
  path: '/ecoles',
});

export default function Page() {
  return (
    <Suspense>
      <EcolesClient />
    </Suspense>
  );
}
