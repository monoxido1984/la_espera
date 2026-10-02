import rawData from './story-data.generated.json';
import type { StoryData } from './story-model';
import WaitingStory from './waiting-story';

export default function Home() {
  return <WaitingStory data={rawData as StoryData} />;
}
