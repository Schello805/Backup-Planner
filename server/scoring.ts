type Row=Record<string,any>;
import {calculateAvailability,getReachablePlans} from './availability.js';
const weights={low:1,normal:2,high:4};

function ancestors(id:string|null, byId:Map<string,Row>){const result:string[]=[];let current=id;while(current&&byId.has(current)){result.push(current);current=byId.get(current)?.parent_id||null;}return result;}
function siteLocation(id:string, locations:Map<string,Row>){const path=ancestors(id,locations);return path.find(locationId=>locations.get(locationId)?.type==='site')||path.at(-1)||id;}

export function scoreStrategy(data:ReturnType<typeof import('./db.js').listAll>){
  const locations=new Map((data.locations as Row[]).map(x=>[x.id,x]));
  const targets=new Map((data.targets as Row[]).map(x=>[x.id,x]));
  const sourceMap=new Map((data.sources as Row[]).map(x=>[x.id,x]));
  const availability=calculateAvailability(data);
  const details=(data.datasets as Row[]).filter(d=>d.active).map(dataset=>{
    const plans=getReachablePlans(data,dataset.id,availability).filter(p=>targets.get(p.target_id)?.active!==0);
    const copyTargets=new Set(plans.map(p=>p.target_id));
    const backups=plans.filter(p=>p.protection_type==='backup'||p.protection_type==='archive');
    const source=sourceMap.get(dataset.source_id);
    const locationIds=new Set<string>();
    if(source?.location_id)locationIds.add(siteLocation(source.location_id,locations));
    plans.forEach(p=>{const t=targets.get(p.target_id);if(t?.location_id)locationIds.add(siteLocation(t.location_id,locations))});
    const rootLocations=new Set([...locationIds]);
    const storageTypes=new Set(plans.map(p=>targets.get(p.target_id)?.storage_type).filter(Boolean));
    const offPrimary=plans.some(p=>{const t=targets.get(p.target_id);if(!t?.location_id||!source?.location_id)return false;return siteLocation(t.location_id,locations)!==siteLocation(source.location_id,locations)});
    const immutableBackup=backups.some(p=>p.immutable&&(targets.get(p.target_id)?.immutable_capable??true));
    const checks=[
      {key:'realBackup',points:25,ok:backups.length>0},
      {key:'threeCopies',points:20,ok:1+copyTargets.size>=3},
      {key:'twoLocations',points:15,ok:locationIds.size>=2},
      {key:'offsite',points:10,ok:offPrimary||rootLocations.size>=2},
      {key:'twoMedia',points:10,ok:storageTypes.size>=2},
      {key:'immutable',points:10,ok:immutableBackup},
      {key:'encrypted',points:5,ok:backups.some(p=>p.encrypted)},
      {key:'retention',points:5,ok:backups.some(p=>(p.version_count||0)>1||(p.retention_value||0)>0)},
    ];
    const score=checks.reduce((n,c)=>n+(c.ok?c.points:0),0);
    return {id:dataset.id,name:dataset.name,priority:dataset.priority,score,checks,planCount:plans.length};
  });
  const totalWeight=details.reduce((n,d)=>n+(weights[d.priority as keyof typeof weights]||2),0);
  const score=totalWeight?Math.round(details.reduce((n,d)=>n+d.score*(weights[d.priority as keyof typeof weights]||2),0)/totalWeight):0;
  const tone=score>=85?'green':score>=70?'yellow':score>=50?'orange':'red';
  return {score,tone,datasets:details,counts:{plans:(data.plans as Row[]).filter(x=>x.active).length,datasets:details.length,issues:details.reduce((n,d)=>n+d.checks.filter(c=>!c.ok).length,0)}};
}
