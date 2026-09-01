import{describe,expect,it}from'vitest';
import{dependencyStatus,getDownstreamPlans}from'./planDependencies.js';
import type{Plan}from'./types.js';

const plan=(overrides:Partial<Plan>):Plan=>({id:'plan',name:'Plan',active:1,source_id:'source',source_target_id:null,target_id:'target',dataset_ids:['photos'],protection_type:'backup',schedule_type:'daily',weekdays:[],day_of_month:1,start_time:'03:00',duration_minutes:30,immutable:false,encrypted:false,owner:'',color:'#16a36a',...overrides});

describe('backup plan dependencies',()=>{
 it('recognizes a healthy upstream plan that finishes first',()=>{
  const upstream=plan({id:'upstream',target_id:'qnap4',start_time:'02:00',duration_minutes:30});
  const downstream=plan({id:'downstream',source_target_id:'qnap4',target_id:'usb',start_time:'03:00'});
  expect(dependencyStatus(downstream,[upstream,downstream])).toEqual({upstream,issue:null});
 });

 it('warns about inactive, manual, late, and missing upstream plans',()=>{
  const downstream=plan({id:'downstream',source_target_id:'qnap4',target_id:'usb',start_time:'03:00'});
  expect(dependencyStatus(downstream,[]).issue).toBe('missing');
  expect(dependencyStatus(downstream,[plan({id:'upstream',target_id:'qnap4',active:0})]).issue).toBe('inactive');
  expect(dependencyStatus(downstream,[plan({id:'upstream',target_id:'qnap4',schedule_type:'manual'})]).issue).toBe('manual');
  expect(dependencyStatus(downstream,[plan({id:'upstream',target_id:'qnap4',start_time:'02:50',duration_minutes:30})]).issue).toBe('timing');
 });

 it('lists every downstream plan that uses the produced copy',()=>{
  const upstream=plan({id:'upstream',target_id:'qnap4'});
  const downstream=plan({id:'downstream',source_target_id:'qnap4',target_id:'usb'});
  expect(getDownstreamPlans(upstream,[upstream,downstream]).map(item=>item.id)).toEqual(['downstream']);
 });
});
