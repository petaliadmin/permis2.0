import type { Metadata } from 'next';
import TrafficSignsClient from './TrafficSignsClient';

export const metadata: Metadata = {
  title: 'Panneaux de signalisation du Sénégal',
  description:
    'Apprenez tous les panneaux de signalisation routière du code sénégalais : danger, interdiction, obligation, indication — avec explications en français et en wolof.',
  alternates: { canonical: '/traffic-signs' },
};

export default function Page() {
  return <TrafficSignsClient />;
}
