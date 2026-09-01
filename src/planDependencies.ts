import type {Plan} from './types';

export type DependencyIssue='missing'|'inactive'|'manual'|'timing';
export type DependencyStatus={upstream:Plan|null;issue:DependencyIssue|null};

const minutes=(time:string)=>{const[hours,mins]=time.split(':').map(Number);return hours*60+mins};
const overlaps=(a:Plan,b:Plan)=>a.dataset_ids.some(id=>b.dataset_ids.includes(id));

export function getUpstreamPlan(plan:Plan,plans:Plan[]):Plan|null{
 if(!plan.source_target_id)return null;
 return plans.find(candidate=>candidate.id!==plan.id&&!candidate.deleted_at&&candidate.target_id===plan.source_target_id&&overlaps(candidate,plan))||null;
}

export function getDownstreamPlans(plan:Plan,plans:Plan[]):Plan[]{
 return plans.filter(candidate=>candidate.id!==plan.id&&!candidate.deleted_at&&candidate.source_target_id===plan.target_id&&overlaps(candidate,plan));
}

export function dependencyStatus(plan:Plan,plans:Plan[]):DependencyStatus{
 if(!plan.source_target_id)return{upstream:null,issue:null};
 const upstream=getUpstreamPlan(plan,plans);
 if(!upstream)return{upstream:null,issue:'missing'};
 if(!upstream.active)return{upstream,issue:'inactive'};
 if(upstream.schedule_type==='manual')return{upstream,issue:'manual'};
 if(plan.schedule_type==='manual')return{upstream,issue:null};
 if(!scheduleCovers(upstream,plan)||minutes(upstream.start_time)+upstream.duration_minutes>minutes(plan.start_time))return{upstream,issue:'timing'};
 return{upstream,issue:null};
}

function scheduleCovers(upstream:Plan,downstream:Plan){
 if(upstream.schedule_type==='daily')return true;
 if(upstream.schedule_type!==downstream.schedule_type)return false;
 if(upstream.schedule_type==='weekly')return downstream.weekdays.every(day=>upstream.weekdays.includes(day));
 if(upstream.schedule_type==='monthly')return upstream.day_of_month===downstream.day_of_month;
 return false;
}
