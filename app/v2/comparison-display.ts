export function roundedDifference(a:number|null,b:number|null,digits:number):number|null{
  if(a===null||b===null)return null;
  const formatter=new Intl.NumberFormat('en-US',{useGrouping:false,minimumFractionDigits:digits,maximumFractionDigits:digits});
  const scale=10**digits;
  const units=(value:number)=>Math.round(Number(formatter.format(value))*scale);
  return (units(b)-units(a))/scale;
}
