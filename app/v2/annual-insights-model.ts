export function changeFromBaseline(rows:{year:number;value:number|null}[],year:number,referenceYears:number[]){
 const observed=(y:number)=>rows.find(row=>row.year===y)?.value;
 const current=observed(year),reference=referenceYears.map(observed);
 if(current==null||!Number.isFinite(current)||reference.some(n=>n==null||!Number.isFinite(n))||!reference.length)return null;
 const referenceMean=reference.reduce<number>((sum,n)=>sum+n!,0)/reference.length;
 return referenceMean>0?{current,referenceMean,percentReduction:(referenceMean-current)/referenceMean*100}:null;
}
