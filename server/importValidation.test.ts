import{describe,expect,it}from'vitest';import{analyzeImport}from'./importValidation.js';
const valid={format:1,version:'0.1.13',createdAt:'2026-09-01T10:00:00Z',data:{locations:[{id:'home',name:'Home'}],sources:[{id:'nas',name:'NAS',location_id:'home'}],targets:[{id:'usb',name:'USB',location_id:'home'}],datasets:[{id:'photos',name:'Photos',source_id:'nas'}],software:[],plans:[{id:'copy',name:'Copy',source_id:'nas',target_id:'usb',dataset_ids:['photos']}]}};
describe('import validation',()=>{
 it('accepts a complete export and reports counts',()=>{const result=analyzeImport(valid,'0.1.13');expect(result.valid).toBe(true);expect(result.counts.plans).toBe(1)});
 it('rejects missing references before current data is replaced',()=>{const broken=structuredClone(valid);broken.data.plans[0].target_id='missing';const result=analyzeImport(broken);expect(result.valid).toBe(false);expect(result.errors.join(' ')).toContain('missing target')});
 it('warns when an export comes from another version',()=>{expect(analyzeImport(valid,'0.2.0').warnings[0]).toContain('0.1.13')});
});
