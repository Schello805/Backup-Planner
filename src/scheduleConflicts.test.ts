import{describe,expect,it}from'vitest';import{findScheduleConflicts}from'./scheduleConflicts.js';import type{Plan}from'./types.js';
const plan=(overrides:Partial<Plan>):Plan=>({id:'one',name:'One',active:1,source_id:'nas',source_target_id:null,target_id:'usb',dataset_ids:['photos'],protection_type:'backup',schedule_type:'weekly',weekdays:[1],day_of_month:1,start_time:'03:00',duration_minutes:60,immutable:false,encrypted:false,owner:'',color:'#16a36a',...overrides});
describe('schedule conflicts',()=>{
 it('finds overlapping jobs on the same target',()=>{const result=findScheduleConflicts([plan({id:'one'}),plan({id:'two',name:'Two',source_id:'server',start_time:'03:30'})]);expect(result).toHaveLength(1);expect(result[0].resources).toContain('target')});
 it('ignores jobs on different weekdays or outside the time range',()=>{expect(findScheduleConflicts([plan({id:'one'}),plan({id:'two',weekdays:[2]})])).toHaveLength(0);expect(findScheduleConflicts([plan({id:'three'}),plan({id:'four',start_time:'04:00'})])).toHaveLength(0)});
});
