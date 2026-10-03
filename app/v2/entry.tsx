import rawData from '../story-data.generated.json';
import rawHistory from '../history.generated.json';
import rawTransplants from '../transplant-snapshot.generated.json';
import type { StoryData, TransplantSnapshot } from '../story-model';
import { buildUniverseData } from './universe-model';
import WaitingExperience from './waiting-experience';

export default function WaitingV2Page() {
  const data = buildUniverseData(rawData as StoryData, rawHistory, rawTransplants as TransplantSnapshot);
  return <WaitingExperience data={data} />;
}
