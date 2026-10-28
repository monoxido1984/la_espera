export function historyTime(row:{median?:number|null;average:number|null}){
  if(row.median!=null)return {value:row.median,kind:'median' as const};
  return {value:row.average,kind:'mean' as const};
}
