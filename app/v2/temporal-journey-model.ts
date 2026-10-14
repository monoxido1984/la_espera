import {timeMagnitude} from './time-scale-model';
export type JourneyMetric = 'dialysis' | 'list';
export const INDIVIDUAL_END = .62;
export function journeyState(progress:number,metric:JourneyMetric,months:number,records:number) {
  const p=Math.max(0,Math.min(1,progress));
  const individual=Math.min(1,p/INDIVIDUAL_END);
  const expansion=Math.max(0,(p-INDIVIDUAL_END)/(1-INDIVIDUAL_END));
  const people=1+Math.round((Math.max(1,records)-1)*expansion**1.8);
  const duration=timeMagnitude(months*individual,people,true,metric==='dialysis',metric==='dialysis'?'hours':'days');
  if(metric==='dialysis') {
    // Count whole illustrative sessions; a partial drag cannot create a partial session.
    const sessions=Math.floor(timeMagnitude(months*individual,1,false,true,'hours').sessionCount);
    duration.sessionCount=sessions*people;duration.value=sessions*4*people;
    duration.hours=duration.value;duration.fullDays=duration.hours/24;
  } else {duration.value=Math.round(duration.value/people)*people;duration.fullDays=duration.value;duration.hours=duration.value*24;}
  duration.fullYears=duration.fullDays/365.2425;
  return {individual,expansion,people,duration,collective:expansion>0};
}

// A drawing slot per receptor, not a measured individual trajectory.
export function journeyPosition(index:number,people:number,width:number,height:number,individual:number,expansion:number) {
  const columns=Math.max(1,Math.ceil(Math.sqrt(people*width/height)));
  const rows=Math.ceil(people/columns);
  const col=index%columns,row=Math.floor(index/columns);
  const spread=1-(1-expansion)**3;
  const centerX=width*(.16+.68*individual),centerY=height*.8;
  const x=width*.12+(col+.5)/columns*width*.76;
  const y=height*.7+(row+.5)/rows*height*.24;
  return {x:centerX+(x-centerX)*spread,y:centerY+(y-centerY)*spread};
}

export function cumulativeCalendar(progress:number,metric:JourneyMetric,months:number) {
  const current=journeyState(progress,metric,months,1);
  const complete=journeyState(INDIVIDUAL_END,metric,months,1);
  return {steps:metric==='dialysis'?current.duration.sessionCount:current.duration.value,total:metric==='dialysis'?complete.duration.sessionCount:complete.duration.value};
}
