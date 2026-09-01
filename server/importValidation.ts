type Row=Record<string,unknown>;
const collections=['locations','sources','targets','datasets','software','plans']as const;
export type ImportPreview={valid:boolean;format:number|null;version:string|null;createdAt:string|null;counts:Record<string,number>;errors:string[];warnings:string[]};

export function analyzeImport(payload:unknown,currentVersion?:string):ImportPreview{
 const errors:string[]=[];const warnings:string[]=[];const counts:Record<string,number>={};
 if(!payload||typeof payload!=='object')return{valid:false,format:null,version:null,createdAt:null,counts,errors:['The file does not contain a JSON object.'],warnings};
 const root=payload as Row;const format=typeof root.format==='number'?root.format:null;const version=typeof root.version==='string'?root.version:null;const createdAt=typeof root.createdAt==='string'?root.createdAt:null;
 if(format!==1)errors.push('Unsupported backup format.');
 if(!root.data||typeof root.data!=='object')errors.push('The data section is missing.');
 const data=(root.data||{})as Row;
 for(const name of collections){const rows=data[name];counts[name]=Array.isArray(rows)?rows.length:0;if(!Array.isArray(rows)){errors.push(`${name} must be an array.`);continue}const ids=new Set<string>();for(const [index,item]of rows.entries()){if(!item||typeof item!=='object'){errors.push(`${name}[${index}] is invalid.`);continue}const row=item as Row;if(typeof row.id!=='string'||!row.id)errors.push(`${name}[${index}] has no valid id.`);else if(ids.has(row.id))errors.push(`${name} contains duplicate id ${row.id}.`);else ids.add(row.id);if(typeof row.name!=='string'||!row.name.trim())errors.push(`${name}[${index}] has no name.`);if(name==='plans'&&!Array.isArray(row.dataset_ids))errors.push(`Plan ${String(row.name||index)} has no dataset list.`)}}
 if(!errors.length)validateReferences(data,errors);
 if(!version)warnings.push('The export does not contain a version number.');else if(currentVersion&&version!==currentVersion)warnings.push(`The export was created with version ${version}; this server runs ${currentVersion}.`);
 if(!createdAt)warnings.push('The export does not contain a creation date.');
 return{valid:errors.length===0,format,version,createdAt,counts,errors,warnings};
}

function validateReferences(data:Row,errors:string[]){
 const ids=(name:string)=>new Set(((data[name]as Row[])||[]).map(row=>row.id as string));const locations=ids('locations'),sources=ids('sources'),targets=ids('targets'),datasets=ids('datasets'),software=ids('software');
 for(const row of(data.locations as Row[]))if(row.parent_id&&!locations.has(row.parent_id as string))errors.push(`Location ${row.name} references a missing parent.`);
 for(const row of(data.sources as Row[]))if(row.location_id&&!locations.has(row.location_id as string))errors.push(`Source ${row.name} references a missing location.`);
 for(const row of(data.targets as Row[]))if(row.location_id&&!locations.has(row.location_id as string))errors.push(`Target ${row.name} references a missing location.`);
 for(const row of(data.datasets as Row[]))if(!sources.has(row.source_id as string))errors.push(`Dataset ${row.name} references a missing source.`);
 for(const row of(data.plans as Row[])){if(!sources.has(row.source_id as string))errors.push(`Plan ${row.name} references a missing source.`);if(!targets.has(row.target_id as string))errors.push(`Plan ${row.name} references a missing target.`);if(row.source_target_id&&!targets.has(row.source_target_id as string))errors.push(`Plan ${row.name} references a missing upstream target.`);if(row.software_id&&!software.has(row.software_id as string))errors.push(`Plan ${row.name} references missing software.`);for(const datasetId of(row.dataset_ids as string[]))if(!datasets.has(datasetId))errors.push(`Plan ${row.name} references a missing dataset.`)}
}
