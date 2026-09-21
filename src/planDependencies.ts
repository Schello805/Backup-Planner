import type {Plan} from './types';

export type DependencyIssue='missing'|'inactive'|'manual'|'timing';
export type DependencyStatus={upstream:Plan|null;issue:DependencyIssue|null};

import{DAY_MINUTES,planEndMinutes,planStartMinutes}from'./scheduleTime';
const overlaps=(a:Plan,b:Plan)=>a.dataset_ids.some(id=>b.dataset_ids.includes(id));

export function getUpstreamPlans(plan:Plan,plans:Plan[]):Plan[]{
 if(!plan.source_target_id)return [];
 return plans.filter(candidate=>candidate.id!==plan.id&&!candidate.deleted_at&&candidate.target_id===plan.source_target_id&&overlaps(candidate,plan));
}

export function getUpstreamPlan(plan:Plan,plans:Plan[]):Plan|null{
 return getUpstreamPlans(plan,plans)[0]||null;
}

export function getDownstreamPlans(plan:Plan,plans:Plan[]):Plan[]{
 return plans.filter(candidate=>candidate.id!==plan.id&&!candidate.deleted_at&&candidate.source_target_id===plan.target_id&&overlaps(candidate,plan));
}

export function dependencyStatus(plan:Plan,plans:Plan[]):DependencyStatus{
 if(!plan.source_target_id)return{upstream:null,issue:null};
 const upstreams=getUpstreamPlans(plan,plans);
 if(!upstreams.length)return{upstream:null,issue:'missing'};
 const active=upstreams.filter(upstream=>upstream.active);
 if(!active.length)return{upstream:upstreams[0],issue:'inactive'};
 if(plan.schedule_type==='manual')return{upstream:active[0],issue:null};
 const scheduled=active.find(upstream=>upstream.schedule_type!=='manual'&&scheduleCovers(upstream,plan)&&finishesBefore(upstream,plan));
 if(scheduled)return{upstream:scheduled,issue:null};
 if(active.some(upstream=>upstream.schedule_type==='manual'))return{upstream:active.find(upstream=>upstream.schedule_type==='manual')||active[0],issue:'manual'};
 return{upstream:active[0],issue:'timing'};
}

function scheduleCovers(upstream:Plan,downstream:Plan){
 if(upstream.schedule_type==='daily')return true;
 if(upstream.schedule_type!==downstream.schedule_type)return false;
 if(upstream.schedule_type==='weekly')return downstream.weekdays.every(day=>upstream.weekdays.includes(day)||(upstream.weekdays.includes((day+6)%7)&&planEndMinutes(upstream)>DAY_MINUTES));
 if(upstream.schedule_type==='monthly')return upstream.day_of_month===downstream.day_of_month;
 return false;
}

function finishesBefore(upstream:Plan,downstream:Plan){
 const downstreamStart=planStartMinutes(downstream);
 if(upstream.schedule_type==='monthly')return planEndMinutes(upstream)<=downstreamStart;
 if(downstream.schedule_type==='daily')return planEndMinutes(upstream)<=downstreamStart;
 const days=downstream.schedule_type==='weekly'?downstream.weekdays:[0,1,2,3,4,5,6];
 return days.every(day=>{
  const candidates=Array.from({length:8},(_,offset)=>offset).filter(offset=>{
   const upstreamDay=(day-offset+7)%7;
   return upstream.schedule_type==='daily'||(upstream.schedule_type==='weekly'&&upstream.weekdays.includes(upstreamDay));
  });
  const offset=candidates[0];
  if(offset===undefined)return false;
    return planEndMinutes(upstream)<=downstreamStart+offset*DAY_MINUTES;
 });
}
