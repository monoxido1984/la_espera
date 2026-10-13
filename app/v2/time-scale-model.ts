export type TimeScale = 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years';
export const timeScales: {id:TimeScale;label:string}[] = [{id:'seconds',label:'Segundos'},{id:'minutes',label:'Minutos'},{id:'hours',label:'Horas'},{id:'days',label:'Días'},{id:'months',label:'Meses'},{id:'years',label:'Años'}];
export const DAYS_PER_YEAR = 365.2425;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;
export const SESSION_HOURS = 4, SESSIONS_PER_WEEK = 3;

// Calendar conversions and the explicitly hypothetical session regime are
// separate quantities. CRESI reports duration, not individual session hours.
export function timeMagnitude(months: number, records: number, accumulated: boolean, sessions: boolean, scale: TimeScale) {
  const calendarDays = months * DAYS_PER_MONTH;
  const sessionCount = calendarDays / 7 * SESSIONS_PER_WEEK;
  const hours = sessions ? sessionCount * SESSION_HOURS : calendarDays * 24;
  const multiplier = accumulated ? records : 1;
  const seconds = hours * 3600 * multiplier;
  const divisors: Record<TimeScale,number> = {seconds:1,minutes:60,hours:3600,days:86400,months:DAYS_PER_MONTH*86400,years:DAYS_PER_YEAR*86400};
  const fullDays = hours * multiplier / 24;
  return {value:seconds/divisors[scale],calendarDays:calendarDays*multiplier,sessionCount:sessionCount*multiplier,hours:hours*multiplier,fullDays,fullYears:fullDays/DAYS_PER_YEAR,estimated:sessions || accumulated || scale !== 'months'};
}
