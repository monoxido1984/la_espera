import type { Metadata } from 'next';
import rawData from '../story-data.generated.json';
import type { StoryData } from '../story-model';
import WaitingStory from '../waiting-story';

export const metadata: Metadata = {
  title: '¿Cuánto tarda una segunda oportunidad? — La Espera',
  description: 'Un recorrido interactivo por las listas de espera y donación de órganos en Argentina, con datos públicos CRESI/SINTRA.',
};

export default function WaitingPage() {
  return <WaitingStory data={rawData as StoryData} />;
}
