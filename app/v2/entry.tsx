import rawData from '../story-data.generated.json';
import rawHistory from '../history.generated.json';
import dialysisPopulation from '../dialysis-population-2025.generated.json';
import type { StoryData } from '../story-model';
import { buildUniverseData } from './universe-model';
import WaitingExperience from './waiting-experience';

export default function WaitingV2Page() {
  const data = buildUniverseData(rawData as StoryData, rawHistory);
  data.dialysisPopulation = dialysisPopulation;
  return <WaitingExperience data={data} />;
}
