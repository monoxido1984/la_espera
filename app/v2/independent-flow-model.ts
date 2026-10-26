export type Item={id:string;label:string;value:number;color:string};
export function flowBands(items:Item[]){
  const total=items.reduce((sum,item)=>sum+item.value,0);
  let cursor=65;
  return items.map(item=>{const height=total?item.value/total*170:0;const y=cursor;cursor+=height;return {...item,y,height,percent:total?item.value/total*100:0};});
}
