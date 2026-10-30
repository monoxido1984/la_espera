export type ProfileSource={cohorts:Record<string,{missingProvinces:string[];lists:{id:string;seniorityByProvince?:{province:string;items:{label:string;value:number}[]}[]}[]}>};
export type ProfileCell={list:string;province:string;sex:string;minor:boolean;band:string;n:number;end:number};
const ranges:Record<string,[number,number]>={'<1mes':[0,1],'1~3meses':[1,3],'3~6meses':[3,6],'6~12meses':[6,12],'1~2años':[12,24],'2~3años':[24,36],'3~7años':[36,84],'7~10años':[84,120],'>10años':[120,240]};
export function profileCells(source:ProfileSource){
 const cells:ProfileCell[]=[];let end=0;
 for(const age of ['menor18','18mas'])for(const sex of ['FEMENINO','MASCULINO']){
  const cohort=source.cohorts[`${age}|${sex}`];
  if(!cohort)continue;
  for(const list of cohort.lists.filter(l=>l.id!=='TOTAL'))for(const row of list.seniorityByProvince??[]){
   if(cohort.missingProvinces.includes(row.province))continue;
   for(const item of row.items)if(item.value>0&&ranges[item.label]){
    end+=item.value;cells.push({list:list.id,province:row.province,sex,minor:age==='menor18',band:item.label,n:item.value,end});
   }
  }
 }
 return cells;
}
export function simulatedProfile(cells:ProfileCell[],point:number){
 if(!cells.length)return null;
 let state=(Math.imul(point+1,2654435761)>>>0)||1;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
 const target=random()*cells[cells.length-1].end;
 const cell=cells.find(c=>target<c.end)!;
 const [low,rawHigh]=ranges[cell.band],high=Math.min(rawHigh,cell.minor?17*12:240);
 const months=Math.max(cell.band==='>10años'?121:0,Math.floor(low+random()*(high-low)));
 const minimumAge=Math.max(cell.minor?0:18,Math.ceil(months/12));
 const age=minimumAge+Math.floor(random()*((cell.minor?17:85)-minimumAge+1));
 return {...cell,months,age};
}
