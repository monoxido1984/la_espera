import rawData from '../../versiones/v1-20261002/app/story-data.generated.json';
import type { StoryData } from '../../versiones/v1-20261002/app/story-model';
import WaitingStory from '../../versiones/v1-20261002/app/waiting-story';
export const metadata = { title: 'La Espera · Versión 1 conservada' };
export default function PreviousWaitingPage() { return <WaitingStory data={rawData as StoryData} />; }
