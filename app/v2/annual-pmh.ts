import population from './annual-population.generated.json' with {type:'json'};

export function annualPmh(value:number|null,province:string|null,year:number):number|null{
  if(value===null||province===null)return null;
  const denominator=(population.population as Record<string,Record<string,number>>)[String(year)]?.[province];
  return denominator!==undefined&&denominator>0?value/denominator*1_000_000:null;
}

export const annualPopulationSource=population.sourceSha256;
