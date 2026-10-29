export function numberStoryFacts(total:number,renal:number){
 if(!Number.isInteger(total)||!Number.isInteger(renal)||total<0||renal<0||renal>total)throw new Error('Invalid inscription counts');
 return {total,renal,other:total-renal,renalPercent:total?renal/total*100:0,otherPercent:total?(total-renal)/total*100:0};
}
export function numberStoryStep(progress:number){return Math.min(2,Math.max(0,Math.floor(progress*3)));}
export const numberStepTargets=[.10,.50,.87];
