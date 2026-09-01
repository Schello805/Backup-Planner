/* eslint-disable react-hooks/exhaustive-deps -- plan-name suggestion intentionally reacts only to its derived value */
import{useEffect,useRef,useState}from'react';
import{Activity,Archive,CalendarDays,Check,ChevronDown,ChevronRight,CircleHelp,Database,Download,Edit3,FolderArchive,Github,HardDrive,Info,Languages,LayoutDashboard,MapPin,Moon,Plus,RefreshCw,Search,Server,Settings as SettingsIcon,ShieldCheck,Sun,Trash2,TriangleAlert,X}from'lucide-react';
import{addDays,addMonths,eachDayOfInterval,endOfMonth,format,isSameDay,startOfMonth,startOfWeek}from'date-fns';import{de,enUS}from'date-fns/locale';
import{api}from'./api';import{useCopy,type Lang}from'./i18n';import type{AppData,Entity,Plan}from'./types';
import{getHelp}from'./help';
import{dependencyStatus,getDownstreamPlans}from'./planDependencies';
import{findScheduleConflicts,type ScheduleConflict}from'./scheduleConflicts';

type View='dashboard'|'plans'|'schedule'|'settings';
const blankPlan={name:'',source_id:'',source_target_id:null,target_id:'',software_id:null,dataset_ids:[],protection_type:'backup',schedule_type:'weekly',weekdays:[],day_of_month:1,start_time:'03:00',duration_minutes:30,retention_value:null,retention_unit:'days',version_count:null,immutable:false,encrypted:false,owner:'',color:'#16a36a',notes:'',active:true};
const entityDefaults:Record<string,any>={locations:{name:'',type:'site',parent_id:null,notes:'',active:true},sources:{name:'',location_id:null,device_type:'computer',notes:'',active:true},targets:{name:'',location_id:null,storage_type:'nas',provider:'',color:'#3478f6',immutable_capable:false,encrypted_default:false,notes:'',active:true},datasets:{name:'',source_id:'',priority:'normal',notes:'',active:true},software:{name:'',notes:'',active:true}};
const iconByView={dashboard:LayoutDashboard,plans:Database,schedule:CalendarDays,settings:SettingsIcon};

export default function App(){
 const[lang,setLang]=useState<Lang>(()=>(localStorage.getItem('language')as Lang)||'en');const[theme,setTheme]=useState(()=>localStorage.getItem('theme')||'light');const[view,setView]=useState<View>('dashboard');const[data,setData]=useState<AppData|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[plan,setPlan]=useState<any|null>(null);const[release,setRelease]=useState<any>(null);const[toasts,setToasts]=useState<Array<{id:number;text:string;tone:'success'|'error'}>>([]);const t=useCopy(lang);
 const notify=(text:string,tone:'success'|'error'='success')=>{const id=Date.now()+Math.random();setToasts(current=>[...current.slice(-2),{id,text,tone}]);window.setTimeout(()=>setToasts(current=>current.filter(item=>item.id!==id)),3200)};
 const load=async()=>{try{setError('');setData(await api('/data'))}catch(e:any){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},[theme]);useEffect(()=>{localStorage.setItem('language',lang);document.documentElement.lang=lang},[lang]);useEffect(()=>{load();api('/release').then(setRelease).catch(()=>{})},[]);useEffect(()=>{const listener=()=>notify(lang==='de'?'Systemaktion erfolgreich abgeschlossen':'System action completed');window.addEventListener('backup-planner:system-action',listener);return()=>window.removeEventListener('backup-planner:system-action',listener)},[lang]);
 const savePlan=async()=>{try{const editing=!!plan.id;await api(`/plans${plan.id?'/'+plan.id:''}`,{method:plan.id?'PUT':'POST',body:JSON.stringify({...plan,duration_minutes:Number(plan.duration_minutes),day_of_month:plan.day_of_month?Number(plan.day_of_month):null,version_count:plan.version_count?Number(plan.version_count):null,retention_value:plan.retention_value?Number(plan.retention_value):null})});setPlan(null);await load();notify(editing?t('planUpdated'):t('planCreated'))}catch(e:any){setError(e.message);notify(t('actionFailed'),'error')}};
 const removePlan=async(p:Plan)=>{const affected=data?getDownstreamPlans(p,data.plans):[];const impact=affected.length?(lang==='de'?`\n\nAchtung: ${affected.length} nachgelagerte${affected.length===1?'r Plan hängt':' Pläne hängen'} von dieser Kopie ab: ${affected.map(item=>item.name).join(', ')}.`:`\n\nWarning: ${affected.length} downstream plan${affected.length===1?' depends':'s depend'} on this copy: ${affected.map(item=>item.name).join(', ')}.`):'';if(confirm(`${t('delete')}?${impact}`)){await api(`/plans/${p.id}`,{method:'DELETE'});await load();notify(t('movedToTrash'))}};
 const nav=(next:View)=>{setView(next);if(next==='settings')setPlan(null)};
 if(loading)return <div className="splash">
<img src="/logo.png"/>
<div className="spinner"/>
</div>;
 return <div className="app-shell">
  <aside className="sidebar">
<div className="brand">
<img src="/logo.png"/>
<div>
<strong>Backup Planner</strong>
<small>Plan with confidence</small>
</div>
</div>
<nav>{(['dashboard','plans','schedule','settings']as View[]).map(v=>{const Icon=iconByView[v];return <button key={v} className={view===v?'active':''} onClick={()=>nav(v)}>
<Icon size={19}/>
<span>{t(v)}</span>
</button>})}</nav>
<div className="sidebar-bottom">
<div className="mini-shield">
<ShieldCheck/>
<div>
<b>{data?.analysis.score||0}/100</b>
<span>{t('score')}</span>
</div>
</div>
</div>
</aside>
  <main>
<header>
<button className="mobile-brand" onClick={()=>nav('dashboard')}>
<img src="/logo.png"/>Backup Planner</button>
<div className="header-title">
<span>{t(view)}</span>
<small>{format(new Date(),'EEEE, d MMMM',{locale:lang==='de'?de:enUS})}</small>
</div>
<div className="header-actions">
<button className="lang" onClick={()=>setLang(lang==='en'?'de':'en')} title={t('language')}>{lang==='en'?'🇬🇧 EN':'🇩🇪 DE'}</button>
<button className="icon-button" onClick={()=>setTheme(theme==='light'?'dark':'light')} title={t('theme')}>{theme==='light'?<Moon/>:<Sun/>}</button>{view==='plans'&&<button className="primary" onClick={()=>setPlan({...blankPlan})}>
<Plus/> {t('newPlan')}</button>}</div>
</header>
   {error&&<div className="error">
<TriangleAlert/> {error}<button onClick={()=>setError('')}>
<X/>
</button>
</div>}
   <div className="page">{view==='dashboard'&&data&&<Dashboard data={data} t={t} onStart={()=>nav('settings')} onEdit={(p:Plan)=>setPlan({...p,immutable:!!p.immutable,encrypted:!!p.encrypted,active:!!p.active})}/>} {view==='plans'&&data&&<Plans data={data} t={t} edit={(p:Plan)=>setPlan({...p,immutable:!!p.immutable,encrypted:!!p.encrypted,active:!!p.active})} remove={removePlan}/>} {view==='schedule'&&data&&<Schedule data={data} t={t} lang={lang} edit={(p:Plan)=>setPlan({...p,immutable:!!p.immutable,encrypted:!!p.encrypted,active:!!p.active})}/>} {view==='settings'&&data&&<Settings data={data} t={t} lang={lang} theme={theme} setLang={setLang} setTheme={setTheme} reload={load} release={release} setRelease={setRelease} notify={notify}/>}</div>
   <footer>
<span>Backup Planner · v{data?.meta.version}</span>
<span>·</span>
<a href={`https://github.com/${data?.meta.repo}`} target="_blank">
<Github/> A source-available project by Michael Schellenberger</a>
<span>· Noncommercial use</span>{release?.available&&<a className="update-pill" href={release.url} target="_blank">v{release.latest} · {t('updateAvailable')}</a>}</footer>
  </main>
  <div className="mobile-nav">{(['dashboard','plans','schedule','settings']as View[]).map(v=>{const Icon=iconByView[v];return <button key={v} className={view===v?'active':''} onClick={()=>nav(v)}>
<Icon/>
<span>{t(v)}</span>
</button>})}</div>
  {plan&&data&&<PlanModal lang={lang} value={plan} onOpenSettings={()=>{setPlan(null);nav('settings')}} setValue={setPlan} data={data} t={t} save={savePlan}/>} 
  <div className="toast-stack" aria-live="polite">{toasts.map(item=><div className={`toast ${item.tone}`} key={item.id}>{item.tone==='success'?<Check/>:<TriangleAlert/>}<span>{item.text}</span><button onClick={()=>setToasts(current=>current.filter(x=>x.id!==item.id))}><X/></button></div>)}</div>
 </div>;
}

function Dashboard({data,t,onStart,onEdit}:{data:AppData;t:any;onStart:()=>void;onEdit:(plan:Plan)=>void}){const a=data.analysis;const tone=a.tone;const circumference=2*Math.PI*54;return <>
<section className="hero">
<div>
<span className="eyebrow">
<Activity/> {t('strategy')}</span>
<h1>{a.datasets.length?t(tone==='green'?'well':tone==='yellow'?'updateAvailable':tone==='orange'?'issues':'empty'):t('onboardingTitle')}</h1>
<p>{a.datasets.length?summary(a,t):t('onboardingText')}</p>{!a.datasets.length&&<button className="primary" onClick={onStart}>{t('getStarted')} <ChevronRight/>
</button>}</div>
<div className={`score-ring ${tone}`}>
<svg viewBox="0 0 120 120">
<circle className="track" cx="60" cy="60" r="54"/>
<circle className="value" cx="60" cy="60" r="54" strokeDasharray={circumference} strokeDashoffset={circumference*(1-a.score/100)}/>
</svg>
<div>
<b>{a.score}</b>
<span>/ 100</span>
</div>
</div>
</section>
<section className="stats">
<Stat icon={<ShieldCheck/>} value={`${a.score}/100`} label={t('score')} tone={tone}/>
<Stat icon={<Database/>} value={a.counts.plans} label={t('activePlans')}/>
<Stat icon={<HardDrive/>} value={a.counts.datasets} label={t('datasets')}/>
<Stat icon={<TriangleAlert/>} value={a.counts.issues} label={t('issues')} tone={a.counts.issues?'orange':'green'}/>
</section>
<BackupChains data={data} t={t} edit={onEdit}/>
<DestinationOverview data={data} t={t}/>
<section className="section-card">
<div className="section-head">
<div>
<span className="eyebrow">{t('why')}</span>
<h2>{t('strategy')}</h2>
</div>
</div>{!a.datasets.length?<Empty icon={<ShieldCheck/>} text={t('empty')}/>:<div className="dataset-grid">{a.datasets.sort((x,y)=>({high:3,normal:2,low:1}[y.priority]||0)-({high:3,normal:2,low:1}[x.priority]||0)).map(d=>
<article className="dataset-card" key={d.id}>
<div className="dataset-title">
<div>
<h3>{d.name}</h3>
<span className={`priority ${d.priority}`}>{t(d.priority)}</span>
</div>
<strong className={d.score>=85?'green':d.score>=70?'yellow':d.score>=50?'orange':'red'}>{d.score}</strong>
</div>
<div className="progress">
<i style={{width:d.score+'%'}} className={d.score>=85?'green':d.score>=70?'yellow':d.score>=50?'orange':'red'}/>
</div>
<ul>{d.checks.map(c=>
<li className={c.ok?'ok':'missing'} key={c.key}>
<span>{c.ok?'✓':'!'}</span>{t(c.key==='retention'?'retentionRule':c.key)}<b>+{c.points}</b>
</li>)}</ul>
</article>)}</div>}</section>
</>}
function BackupChains({data,t,edit}:{data:AppData;t:any;edit:(plan:Plan)=>void}){const active=data.plans.filter(p=>p.active&&!p.deleted_at);if(!active.length)return null;const entityName=(items:Entity[],id?:string|null)=>items.find(x=>x.id===id)?.name||'—';const chains=data.datasets.map(dataset=>{const related=active.filter(p=>p.dataset_ids.includes(dataset.id));if(!related.length)return null;const first=related.find(p=>!p.source_target_id)||related[0];const nodes:Array<{id:string;name:string;kind:string;plan:Plan|null}>=[{id:`source:${first.source_id}`,name:entityName(data.sources,first.source_id),kind:'source',plan:null}];let current=first;const used=new Set<string>();while(current&&!used.has(current.id)){used.add(current.id);nodes.push({id:`target:${current.target_id}`,name:entityName(data.targets,current.target_id),kind:current.protection_type,plan:current});current=related.find(p=>p.source_target_id===current.target_id)as Plan}return{dataset,nodes}}).filter(Boolean)as Array<{dataset:Entity;nodes:Array<{id:string;name:string;kind:string;plan:Plan|null}>}>;if(!chains.length)return null;return <section className="section-card chain-overview"><div className="section-head"><div><span className="eyebrow">{t('protectionPaths')}</span><h2>{t('whereDataTravels')}</h2></div><div className="chain-legend"><span className="backup">{t('backup')}</span><span className="synchronization">{t('synchronization')}</span><span className="archive">{t('archive')}</span></div></div><div className="chain-list">{chains.slice(0,6).map(({dataset,nodes})=><article key={dataset.id}><div className="chain-dataset"><Database/><div><b>{dataset.name}</b><small>{t(dataset.priority)}</small></div></div><div className="chain-path">{nodes.map((node,index)=><div className="chain-node-wrap" key={node.id}>{index>0&&<span className={`chain-arrow ${node.kind}`}><ChevronRight/></span>}{node.plan?<button type="button" className={`chain-node ${node.kind}`} onClick={()=>edit(node.plan!)} title={`${t('edit')}: ${node.plan.name}`}><i/>{node.name}<Edit3/></button>:<span className={`chain-node ${node.kind}`}><i/>{node.name}</span>}</div>)}</div></article>)}</div></section>}
function DestinationOverview({data,t}:{data:AppData;t:any}){const destinations=data.targets.map(target=>({target,count:data.plans.filter(plan=>plan.active&&!plan.deleted_at&&plan.target_id===target.id).length})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);const total=destinations.reduce((sum,item)=>sum+item.count,0);if(!total)return null;return <section className="section-card destination-overview"><div className="section-head"><div><span className="eyebrow">{t('targetDistribution')}</span><h2>{t('whereBackupsEnd')}</h2></div><div className="destination-total"><b>{total}</b><small>{t('activePlans')}</small></div></div><div className="destination-bars">{destinations.map(({target,count})=><div className="destination-row" key={target.id}><span className="target-color" style={{background:target.color||'#3478f6'}}/><b>{target.name}</b><div className="destination-track"><i style={{width:`${count/total*100}%`,background:target.color||'#3478f6'}}/></div><strong><b>{count}</b><small>{Math.round(count/total*100)}%</small></strong></div>)}</div></section>}
function summary(a:AppData['analysis'],t:any){const weak=a.datasets.filter(d=>d.score<70);return weak.length?`${a.datasets.length-weak.length} ${t('datasets').toLowerCase()} ${t('well').toLowerCase()}. ${weak.slice(0,2).map(d=>d.name).join(', ')} ${t('issues').toLowerCase()}.`:`${t('well')}. 3-2-1 is implemented for your active datasets.`}
function Stat({icon,value,label,tone='blue'}:any){return <article className="stat">
<span className={`stat-icon ${tone}`}>{icon}</span>
<div>
<b>{value}</b>
<small>{label}</small>
</div>
</article>}

function Plans({data,t,edit,remove}:any){const[q,setQ]=useState('');const[type,setType]=useState('all');const names=(key:string,id:string)=>data[key].find((x:Entity)=>x.id===id)?.name||'—';const sourceName=(p:Plan)=>p.source_target_id?names('targets',p.source_target_id):names('sources',p.source_id);const list=data.plans.filter((p:Plan)=>!p.deleted_at&&(type==='all'||p.protection_type===type)&&[p.name,sourceName(p),names('targets',p.target_id)].join(' ').toLowerCase().includes(q.toLowerCase()));return <section className="section-card">
<div className="toolbar">
<label className="search">
<Search/>
<input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')}/>
</label>
<select value={type} onChange={e=>setType(e.target.value)}>
<option value="all">{t('all')}</option>
<option value="backup">{t('backup')}</option>
<option value="synchronization">{t('synchronization')}</option>
<option value="archive">{t('archive')}</option>
</select>
</div>{!list.length?<Empty icon={<Database/>} text={t('noPlans')}/>:<div className="table-wrap">
<table>
<thead>
<tr>
<th>{t('name')}</th>
<th>{t('source')}</th>
<th>{t('target')}</th>
<th>{t('type')}</th>
<th>{t('timing')}</th>
<th>{t('actions')}</th>
</tr>
</thead>
<tbody>{list.map((p:Plan)=>
<tr key={p.id}>
<td data-label={t('name')}>
<div className="plan-name">
<i style={{background:p.color}}/>
<div>
<b>{p.name}</b>
<small>{p.dataset_ids.map((id:string)=>names('datasets',id)).join(', ')}</small>
</div>
</div>
</td>
<td data-label={t('source')}>{sourceName(p)}{p.source_target_id&&<PlanDependencyLabel plan={p} plans={data.plans} t={t}/>}</td>
<td data-label={t('target')}><span className="target-name"><i style={{background:data.targets.find((x:Entity)=>x.id===p.target_id)?.color||'#3478f6'}}/>{names('targets',p.target_id)}</span></td>
<td data-label={t('type')}>
<span className={`badge ${p.protection_type}`}>{t(p.protection_type)}</span>
</td>
<td data-label={t('timing')}>{scheduleLabel(p,t)}</td>
<td data-label={t('actions')}>
<div className="row-actions">
<button onClick={()=>edit(p)} title={t('edit')}>
<Edit3/>
</button>
<button onClick={()=>remove(p)} title={t('delete')}>
<Trash2/>
</button>
</div>
</td>
</tr>)}</tbody>
</table>
</div>}</section>}
function PlanDependencyLabel({plan,plans,t}:{plan:Plan;plans:Plan[];t:any}){const issue=dependencyStatus(plan,plans).issue;return <small className={`derived-label ${issue?'warning':''}`} title={issue?t('issues'):undefined}>{t('derivedCopy')}{issue&&' · !'}</small>}
function scheduleLabel(p:Plan,t:any){if(p.schedule_type==='manual')return t('manual');if(p.schedule_type==='daily')return `${t('daily')} · ${p.start_time}`;if(p.schedule_type==='monthly')return `${t('monthly')} · ${p.day_of_month} · ${p.start_time}`;return `${p.weekdays.map((d:number)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')} · ${p.start_time}`}

function Schedule({data,t,lang,edit}:{data:AppData;t:any;lang:Lang;edit:(plan:Plan)=>void}){const[mode,setMode]=useState<'week'|'months'|'agenda'>('week');const[date,setDate]=useState(new Date());const[now,setNow]=useState(new Date());useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60000);return()=>window.clearInterval(timer)},[]);const names=(key:keyof AppData,id:string)=>(data[key]as Entity[]).find(x=>x.id===id)?.name||'—';const week=startOfWeek(date,{weekStartsOn:1});const days=eachDayOfInterval({start:week,end:addDays(week,6)});const occurrences=(day:Date)=>data.plans.filter(p=>!p.deleted_at&&p.active&&matchesDay(p,day));const nowPosition=(now.getHours()*60+now.getMinutes())/1440*100;const editHint=lang==='de'?'Klicken, um diesen Backup-Plan zu bearbeiten':'Click to edit this backup plan';const conflicts=findScheduleConflicts(data.plans);return <section className="section-card schedule-card">
<div className="toolbar schedule-tools">
<div className="segmented">{(['week','months','agenda']as const).map(x=>
<button className={mode===x?'active':''} onClick={()=>setMode(x)} key={x}>{t(x)}</button>)}</div>
<div className="period">
<button onClick={()=>setDate(mode==='months'?addMonths(date,-3):addDays(date,-7))}>‹</button>
<b>{mode==='months'?format(date,'MMM yyyy')+' – '+format(addMonths(date,2),'MMM yyyy'):format(week,'d MMM')+' – '+format(addDays(week,6),'d MMM yyyy')}</b>
<button onClick={()=>setDate(mode==='months'?addMonths(date,3):addDays(date,7))}>›</button>
</div>
</div>{conflicts.length>0&&<ScheduleConflictList conflicts={conflicts} lang={lang} edit={edit}/>} {mode==='week'&&<div className="gantt">
<div className="gantt-head">
<b>
</b>{Array.from({length:24},(_,h)=>
<span key={h}>{String(h).padStart(2,'0')}</span>)}</div>{days.map(day=>
<div className="gantt-row" key={day.toISOString()}>
<b>{format(day,'EEE dd',{locale:lang==='de'?de:enUS})}</b>
<div className="timeline">{Array.from({length:24},(_,h)=>
<i key={h}/>)}{isSameDay(day,now)&&<span className="now-line" style={{left:`${nowPosition}%`}} title={`${lang==='de'?'Jetzt':'Now'} · ${format(now,'HH:mm')}`}><b>{format(now,'HH:mm')}</b></span>}{occurrences(day).map(p=>
<button type="button" className={`job ${isPlanRunning(p,day,now)?'running':''}`} onClick={()=>edit(p)} key={p.id} style={{left:`${timeMins(p.start_time)/1440*100}%`,width:`${Math.max(p.duration_minutes/1440*100,2.8)}%`,background:p.color}} title={`${p.name} · ${p.start_time} · ${p.duration_minutes} min${isPlanRunning(p,day,now)?` · ${lang==='de'?'läuft jetzt':'running now'}`:''} · ${editHint}`} aria-label={`${p.name} · ${editHint}`}>
<span>{p.name}</span>
</button>)}</div>
</div>)}</div>}{mode==='months'&&<MonthGantt date={date} data={data} edit={edit} editHint={editHint}/>} {mode==='agenda'&&<div className="agenda">{days.flatMap(day=>occurrences(day).map(p=>({day,p}))).sort((a,b)=>a.day.getTime()+timeMins(a.p.start_time)-b.day.getTime()-timeMins(b.p.start_time)).map(({day,p})=>
<button type="button" className="agenda-item" onClick={()=>edit(p)} title={editHint} key={day.toISOString()+p.id}>
<time>{format(day,'EEE, d MMM',{locale:lang==='de'?de:enUS})}<b>{p.start_time}</b>
</time>
<i style={{background:p.color}}/>
<div>
<b>{p.name}</b>
<span>{names('sources',p.source_id)} → {names('targets',p.target_id)}</span>
</div>
<em>{p.duration_minutes} {t('minutes')}</em>
</button>)}</div>}</section>}
function ScheduleConflictList({conflicts,lang,edit}:{conflicts:ScheduleConflict[];lang:Lang;edit:(plan:Plan)=>void}){const de=lang==='de';return <div className="schedule-conflicts"><div className="conflict-summary"><TriangleAlert/><div><b>{conflicts.length} {de?'mögliche Zeitplan-Konflikte':`possible schedule conflict${conflicts.length===1?'':'s'}`}</b><span>{de?'Diese Pläne überlappen sich auf derselben Quelle oder demselben Ziel. Prüfe, ob die Geräte mehrere Aufträge gleichzeitig bewältigen können.':'These plans overlap on the same source or target. Check whether the devices can handle multiple jobs at once.'}</span></div></div><div className="conflict-list">{conflicts.slice(0,5).map(conflict=><article key={`${conflict.first.id}:${conflict.second.id}`}><span>{conflict.resources.map(resource=>resource==='source'?(de?'Quelle':'Source'):(de?'Ziel':'Target')).join(' & ')}</span><button type="button" onClick={()=>edit(conflict.first)}>{conflict.first.name}</button><i>↔</i><button type="button" onClick={()=>edit(conflict.second)}>{conflict.second.name}</button></article>)}</div></div>}
function MonthGantt({date,data,edit,editHint}:any){const start=startOfMonth(date),end=endOfMonth(addMonths(date,2)),days=eachDayOfInterval({start,end});return <div className="month-gantt">
<div className="month-head">
<b>Backup plan</b>{days.map(d=>
<span className={[0,6].includes(d.getDay())?'weekend':''} key={d.toISOString()}>{d.getDate()===1?<small>{format(d,'MMM')}</small>:null}{d.getDate()}</span>)}</div>{data.plans.filter((p:Plan)=>p.active&&!p.deleted_at).map((p:Plan)=>
<div className="month-row" key={p.id}>
<b>{p.name}<small>{p.start_time}</small>
</b>{days.map(d=>
<span className={[0,6].includes(d.getDay())?'weekend':''} key={d.toISOString()}>{matchesDay(p,d)&&<button type="button" className="month-job" onClick={()=>edit(p)} style={{background:p.color}} title={`${p.name} · ${editHint}`} aria-label={`${p.name} · ${editHint}`}/>}</span>)}</div>)}</div>}
function matchesDay(p:Plan,d:Date){if(p.schedule_type==='daily')return true;if(p.schedule_type==='weekly')return p.weekdays.includes(d.getDay());if(p.schedule_type==='monthly')return p.day_of_month===d.getDate();return false}function timeMins(x:string){const[h,m]=x.split(':').map(Number);return h*60+m}function isPlanRunning(p:Plan,day:Date,now:Date){if(!isSameDay(day,now)||!matchesDay(p,day))return false;const minute=now.getHours()*60+now.getMinutes(),start=timeMins(p.start_time);return minute>=start&&minute<start+p.duration_minutes}

function Settings({data,t,lang,theme,setLang,setTheme,reload,release,setRelease,notify}:any){
 const[tab,setTab]=useState('locations');const[editing,setEditing]=useState<any>(null);const[backups,setBackups]=useState<any>({files:[],folder:''});const h=getHelp(lang);const loadBackups=()=>api('/backups').then(setBackups);useEffect(()=>{loadBackups()},[]);const groups=[['locations',MapPin],['sources',Server],['targets',HardDrive],['datasets',Database],['software',Archive]];
 const save=async()=>{const wasEditing=!!editing.id;await api(`/${tab}${editing.id?'/'+editing.id:''}`,{method:editing.id?'PUT':'POST',body:JSON.stringify(editing)});setEditing(null);await reload();notify(wasEditing?t('entryUpdated'):t('entryCreated'))};const remove=async(id:string)=>{if(confirm(t('deactivate')+'?')){await api(`/${tab}/${id}`,{method:'DELETE'});await reload();notify(t('entryDeactivated'))}};
 return <div className="settings-layout">
<aside className="settings-nav">
<b>{t('masterData')}</b>{groups.map(([key,Icon]:any)=>
<button className={tab===key?'active':''} onClick={()=>{setTab(key);setEditing(null)}} key={key}>
<Icon/><span>{t(key==='datasets'?'dataSets':key==='software'?'softwareList':key)}</span><em>{data[key].filter((x:Entity)=>x.active).length}</em></button>)}<b>{t('system')}</b>
<button className={tab==='system'?'active':''} onClick={()=>{setTab('system');setEditing(null)}}>
<SettingsIcon/>{t('system')}</button>
</aside>
<section className="section-card settings-content">{tab!=='system'?<>
<div className="section-head">
<h2>{t(tab==='datasets'?'dataSets':tab==='software'?'softwareList':tab)}</h2>
<button className="primary" onClick={()=>setEditing({...entityDefaults[tab]})}>
<Plus/>{t('add')}</button>
</div>
<div className="concept-card">
<span>
<CircleHelp/>
</span>
<div>
<h3>{(h as any)[tab].title}</h3>
<p>{(h as any)[tab].body}</p>
</div>
</div>
{tab==='locations'?<LocationTree locations={data.locations} t={t} lang={lang} edit={setEditing} remove={remove}/>:<div className="master-list">{data[tab].map((x:Entity)=>
<article key={x.id} className={!x.active?'inactive':''} style={tab==='targets'?{borderLeft:`4px solid ${x.color||'#3478f6'}`,paddingLeft:'10px'}:undefined}>
<span className="master-icon">{tab==='locations'?<MapPin/>:tab==='sources'?<Server/>:tab==='targets'?<HardDrive/>:tab==='datasets'?<Database/>:<Archive/>}</span>
<div>
<b>{x.name}</b>
<small>{entityMeta(tab,x,data,t)}</small>
</div>
<span className={`status ${x.active?'on':'off'}`}>{x.active?t('active'):t('deactivate')}</span>
<div className="row-actions">
<button onClick={()=>setEditing({...x,active:!!x.active,immutable_capable:!!x.immutable_capable,encrypted_default:!!x.encrypted_default})}>
<Edit3/>
</button>
<button onClick={()=>remove(x.id)}>
<Trash2/>
</button>
</div>
</article>)}</div>}
</>:<SystemSettings {...{t,lang,theme,setLang,setTheme,backups,loadBackups,release,setRelease,reload,notify}}/>}</section>{editing&&<EntityModal tab={tab} value={editing} setValue={setEditing} data={data} t={t} lang={lang} save={save}/>}</div>
}
function LocationTree({locations,t,lang,edit,remove}:{locations:Entity[];t:any;lang:Lang;edit:(value:any)=>void;remove:(id:string)=>void}){const[collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());const ids=new Set(locations.map(x=>x.id));const children=new Map<string,Entity[]>();for(const location of locations){const parent=location.parent_id&&ids.has(location.parent_id)?location.parent_id:'root';children.set(parent,[...(children.get(parent)||[]),location])}for(const rows of children.values())rows.sort((a,b)=>a.name.localeCompare(b.name,lang));const toggle=(id:string)=>setCollapsed(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});const render=(parentId:string,depth:number,trail:Set<string>):any[]=>{return(children.get(parentId)||[]).flatMap(location=>{if(trail.has(location.id))return[];const hasChildren=(children.get(location.id)||[]).length>0;const isCollapsed=collapsed.has(location.id);const row=<article className={`tree-row ${depth===0?'root ':''}${!location.active?'inactive':''}`} style={{'--depth':depth} as any} key={location.id}><button className={`tree-toggle ${hasChildren?'':'leaf'}`} onClick={()=>{if(hasChildren)toggle(location.id)}} aria-expanded={hasChildren?!isCollapsed:undefined} title={hasChildren?(isCollapsed?(lang==='de'?'Unterpunkte anzeigen':'Show children'):(lang==='de'?'Unterpunkte ausblenden':'Hide children')):undefined}>{hasChildren?(isCollapsed?<ChevronRight/>:<ChevronDown/>):<span/>}</button><span className="master-icon"><MapPin/></span><div><b>{location.name}</b><small>{location.type}</small></div><span className={`status ${location.active?'on':'off'}`}>{location.active?t('active'):t('deactivate')}</span><div className="row-actions"><button onClick={()=>edit({...location,active:!!location.active})}><Edit3/></button><button onClick={()=>remove(location.id)}><Trash2/></button></div></article>;return[row,...(!hasChildren||isCollapsed?[]:render(location.id,depth+1,new Set([...trail,location.id])))]})};return <div className="master-list location-tree">{render('root',0,new Set())}</div>}
function entityMeta(tab:string,x:any,data:AppData,t:any){const find=(k:keyof AppData,id:string)=>(data[k]as Entity[]).find(y=>y.id===id)?.name||'';if(tab==='locations')return `${x.type}${x.parent_id?' · '+find('locations',x.parent_id):''}`;if(tab==='sources')return `${x.device_type}${x.location_id?' · '+find('locations',x.location_id):''}`;if(tab==='targets')return `${x.storage_type}${x.location_id?' · '+find('locations',x.location_id):''}`;if(tab==='datasets')return `${t(x.priority)} · ${find('sources',x.source_id)}`;return x.notes||'—'}

function SystemSettings({t,lang,theme,setLang,setTheme,backups,loadBackups,release,setRelease,reload}:any){const[checking,setChecking]=useState(false);const[checkedAt,setCheckedAt]=useState<Date|null>(null);const[checkError,setCheckError]=useState(false);const checkUpdates=async()=>{setChecking(true);setCheckError(false);try{const result=await api('/release?force=1');setRelease(result);setCheckError(!!result.unavailable);setCheckedAt(new Date())}catch{setCheckError(true);setCheckedAt(new Date())}finally{setChecking(false)}};return <>
<div className="system-grid">
<article>
<Languages/>
<div>
<b>{t('language')}</b>
<span>English / Deutsch</span>
</div>
<div className="segmented">
<button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>🇬🇧 EN</button>
<button className={lang==='de'?'active':''} onClick={()=>setLang('de')}>🇩🇪 DE</button>
</div>
</article>
<article>{theme==='light'?<Sun/>:<Moon/>}<div>
<b>{t('theme')}</b>
<span>{t(theme)}</span>
</div>
<div className="segmented">
<button className={theme==='light'?'active':''} onClick={()=>setTheme('light')}>{t('light')}</button>
<button className={theme==='dark'?'active':''} onClick={()=>setTheme('dark')}>{t('dark')}</button>
</div>
</article>
</div>
<div className="backup-head">
<div>
<h3>{t('system')}</h3>
<p>
<FolderArchive/> {t('folder')}: <code>{backups.folder}</code>
</p>
</div>
<div>
<a className="secondary" href="/api/export.csv">
<Download/>CSV</a>
<button className="secondary" onClick={()=>location.href='/api/export'}>
<Download/>{t('export')}</button>
<ImportButton t={t} lang={lang} reload={reload} loadBackups={loadBackups}/>
<button className="primary" onClick={async()=>{await api('/backups',{method:'POST'});loadBackups()}}>
<Plus/>{t('createBackup')}</button>
</div>
</div>
<div className="backup-list">{backups.files.length?backups.files.map((f:any)=>
<article key={f.name}>
<FolderArchive/>
<div>
<b>{f.name}</b>
<span>{new Date(f.createdAt).toLocaleString()} · {(f.size/1024).toFixed(1)} KB</span>
</div>
<a href={`/api/backups/${encodeURIComponent(f.name)}/download`} title={t('download')}>
<Download/>
</a>
<button title={t('restore')} onClick={async()=>{if(confirm(t('confirmRestore'))&&confirm(t('confirmRestore'))){await api(`/backups/${encodeURIComponent(f.name)}/restore`,{method:'POST'});reload();loadBackups()}}}>
<RefreshCw/>
</button>
<button title={t('permanentDelete')} onClick={async()=>{if(confirm(t('confirmPermanent'))){await api(`/backups/${encodeURIComponent(f.name)}`,{method:'DELETE'});loadBackups()}}}>
<Trash2/>
</button>
</article>):<Empty icon={<FolderArchive/>} text={t('noBackups')}/>}</div>
<div className="update-card">
<Github/>
<div>
<b>{release?.available?`${t('updateAvailable')}: v${release.latest}`:t('upToDate')}</b>
<span>{t('updateCli')}</span>
{checkedAt&&<span className={checkError?'update-check-error':'update-check-ok'}>{checkError?(lang==='de'?'GitHub ist momentan nicht erreichbar.':'GitHub is currently unavailable.'):(lang==='de'?`Zuletzt geprüft: ${checkedAt.toLocaleTimeString('de-DE')}`:`Last checked: ${checkedAt.toLocaleTimeString('en-US')}`)}</span>}
{release?.available&&<code>sudo /opt/backup-planner/scripts/update.sh</code>}</div>
<button className="secondary" onClick={checkUpdates} disabled={checking}>
<RefreshCw className={checking?'spin':''}/>{checking?(lang==='de'?'Prüfe…':'Checking…'):t('checkUpdates')}</button>
</div>
</>}

function ImportButton({t,lang,reload,loadBackups}:any){const[preview,setPreview]=useState<any>(null);const[reading,setReading]=useState(false);const choose=async(file?:File)=>{if(!file)return;setReading(true);try{const payload=JSON.parse(await file.text());const result=await api('/import/preview',{method:'POST',body:JSON.stringify(payload)});setPreview({fileName:file.name,payload,...result})}catch(error:any){setPreview({fileName:file.name,payload:null,valid:false,counts:{},warnings:[],errors:[error.message||'Invalid JSON file']})}finally{setReading(false)}};const execute=async()=>{await api('/import',{method:'POST',body:JSON.stringify(preview.payload)});setPreview(null);await reload();await loadBackups()};return <><label className={`secondary file-button ${reading?'disabled':''}`}><Download/>{reading?(lang==='de'?'Prüfe…':'Checking…'):t('import')}<input type="file" accept="application/json" disabled={reading} onChange={e=>{choose(e.target.files?.[0]);e.target.value=''}}/></label>{preview&&<Modal title={lang==='de'?'Import prüfen':'Review import'} close={()=>setPreview(null)}><div className="import-preview"><div className={`import-verdict ${preview.valid?'ok':'error'}`}>{preview.valid?<ShieldCheck/>:<TriangleAlert/>}<div><b>{preview.valid?(lang==='de'?'Datei ist bereit zum Import':'File is ready to import'):(lang==='de'?'Import ist nicht möglich':'Import cannot continue')}</b><span>{preview.fileName}</span></div></div><div className="import-meta"><div><span>Version</span><b>{preview.version||'—'}</b></div><div><span>{lang==='de'?'Erstellt':'Created'}</span><b>{preview.createdAt?new Date(preview.createdAt).toLocaleString(lang==='de'?'de-DE':'en-US'):'—'}</b></div></div><div className="import-counts">{['locations','sources','targets','datasets','software','plans'].map(key=><div key={key}><b>{preview.counts?.[key]||0}</b><span>{t(key==='datasets'?'dataSets':key==='software'?'softwareList':key)}</span></div>)}</div>{preview.warnings?.length>0&&<div className="import-messages warning"><b>{lang==='de'?'Hinweise':'Warnings'}</b>{preview.warnings.map((message:string)=><p key={message}>{message}</p>)}</div>}{preview.errors?.length>0&&<div className="import-messages error"><b>{lang==='de'?'Fehler':'Errors'}</b>{preview.errors.map((message:string)=><p key={message}>{message}</p>)}</div>}<div className="import-replace"><TriangleAlert/><span>{lang==='de'?'Beim Import werden alle aktuellen Daten ersetzt. Vorher erstellt Backup Planner automatisch eine Sicherheitssicherung.':'Importing replaces all current data. Backup Planner automatically creates a safety backup first.'}</span></div></div><div className="modal-actions"><button className="secondary" onClick={()=>setPreview(null)}>{t('cancel')}</button><button className="primary" disabled={!preview.valid} onClick={execute}>{t('import')}</button></div></Modal>}</>}

function PlanModal({value,setValue,data,t,lang,save,onOpenSettings}:any){const h=getHelp(lang);const[attempted,setAttempted]=useState(false);const[durationUnit,setDurationUnit]=useState<'minutes'|'hours'>(()=>value.duration_minutes>=60&&value.duration_minutes%60===0?'hours':'minutes');const autoName=useRef('');const set=(k:string,v:any)=>setValue({...value,[k]:v});const sourceValue=value.source_target_id?`target:${value.source_target_id}`:value.source_id?`source:${value.source_id}`:'';const availableAtTarget=new Set(data.dataset_availability.filter((a:any)=>a.node_type==='target'&&a.node_id===value.source_target_id).map((a:any)=>a.dataset_id));const datasets=data.datasets.filter((d:Entity)=>d.active&&(value.source_target_id?availableAtTarget.has(d.id):d.source_id===value.source_id));const targetSourceIds=new Set(data.dataset_availability.filter((a:any)=>a.node_type==='target').map((a:any)=>a.node_id));const sourceOptions=[...data.sources.filter((x:Entity)=>x.active).map((x:Entity)=>({value:`source:${x.id}`,label:x.name})),...data.targets.filter((x:Entity)=>x.active&&targetSourceIds.has(x.id)).map((x:Entity)=>({value:`target:${x.id}`,label:`${x.name} · ${t('availableCopy')}`}))];const chooseSource=(ref:string)=>{if(!ref)return setValue({...value,source_id:'',source_target_id:null,dataset_ids:[]});const[type,nodeId]=ref.split(':');if(type==='source')return setValue({...value,source_id:nodeId,source_target_id:null,dataset_ids:[]});const firstAvailability=data.dataset_availability.find((a:any)=>a.node_type==='target'&&a.node_id===nodeId);const firstDataset=data.datasets.find((d:Entity)=>d.id===firstAvailability?.dataset_id);setValue({...value,source_id:firstDataset?.source_id||'',source_target_id:nodeId,dataset_ids:[]})};const sourceName=sourceOptions.find((x:any)=>x.value===sourceValue)?.label?.split(' · ')[0]||'';const targetName=data.targets.find((x:Entity)=>x.id===value.target_id)?.name||'';const datasetName=data.datasets.find((x:Entity)=>x.id===value.dataset_ids[0])?.name||'';const suggestion=[sourceName&&targetName?`${sourceName} → ${targetName}`:'',datasetName].filter(Boolean).join(' · ');useEffect(()=>{if(suggestion&&(!value.name||value.name===autoName.current)){autoName.current=suggestion;setValue({...value,name:suggestion})}},[suggestion]);const durationValue=durationUnit==='hours'?value.duration_minutes/60:value.duration_minutes;const dependency=dependencyStatus(value as Plan,data.plans);const downstream=value.id?getDownstreamPlans(value as Plan,data.plans):[];const section=(en:string,de:string)=>lang==='de'?de:en;return <Modal title={value.id?t('edit'):t('newPlan')} close={()=>setValue(null)}>
<div className="form-grid">
<Field label={t('name')} help={h.name} wide>
<input value={value.name} onChange={e=>set('name',e.target.value)} autoFocus/>
{suggestion&&value.name!==suggestion&&<button type="button" className="name-suggestion" onClick={()=>{autoName.current=suggestion;set('name',suggestion)}}>{t('useSuggestedName')}: <b>{suggestion}</b></button>}
</Field>
<FormSection title={section('Data path','Datenweg')} text={section('Choose where the data comes from, what is protected, and where the copy is stored.','Lege fest, woher die Daten kommen, was geschützt wird und wo die Kopie liegt.')}/>
<Field label={t('source')} help={h.planSource}>
<select value={sourceValue} onChange={e=>chooseSource(e.target.value)}><option value="">Select…</option>{sourceOptions.map((option:any)=><option key={option.value} value={option.value}>{option.label}</option>)}</select>
</Field>
<Field label={t('target')} help={h.planTarget}>
<Select value={value.target_id} onChange={(v:string)=>set('target_id',v)} options={data.targets.filter((target:Entity)=>target.id!==value.source_target_id)}/>
</Field>
<Field label={t('dataset')} help={h.planDatasets} wide>
  {value.source_target_id&&<div className="chain-note"><Activity/><div><b>{t('dependentPlan')}</b><span>{t('chainSourceHint')}</span></div></div>}
  {!value.source_id ? <div className="dataset-empty"><CircleHelp/><div><b>{h.chooseSourceFirst}</b><span>{h.planDatasets}</span></div></div>
  : datasets.length === 0 ? <div className="dataset-empty warning"><TriangleAlert/><div><b>{h.noDatasets}</b><button type="button" onClick={onOpenSettings}>{h.manageDatasets}<ChevronRight/></button></div></div>
  : <div className={`checkbox-grid dataset-select ${attempted&&value.dataset_ids.length===0?'invalid':''}`}>{datasets.map((d:Entity)=>
    <label key={d.id}><input type="checkbox" checked={value.dataset_ids.includes(d.id)} onChange={e=>set('dataset_ids',e.target.checked?[...value.dataset_ids,d.id]:value.dataset_ids.filter((x:string)=>x!==d.id))}/><span><b>{d.name}</b><small>{t(d.priority)}</small></span></label>)}</div>}
  {attempted&&value.dataset_ids.length===0&&datasets.length>0&&<p className="field-error"><TriangleAlert/>{h.selectOne}</p>}
</Field>
{value.source_target_id&&value.dataset_ids.length>0&&<DependencyNotice status={dependency} lang={lang}/>}
{downstream.length>0&&<div className={`dependency-impact wide ${!value.active?'danger':''}`}><Activity/><div><b>{section(`${downstream.length} downstream plan${downstream.length===1?'':'s'} depend on this copy`,`${downstream.length} nachgelagerte${downstream.length===1?'r Plan hängt':' Pläne hängen'} von dieser Kopie ab`)}</b><span>{downstream.map((item:Plan)=>item.name).join(', ')}</span>{!value.active&&<strong>{section('Deactivating this plan interrupts these protection chains.','Das Deaktivieren dieses Plans unterbricht diese Sicherungsketten.')}</strong>}</div></div>}
<FormSection title={section('Protection','Schutz')} text={section('Define the copy type and the software responsible for creating it.','Bestimme die Art der Kopie und die dafür verwendete Software.')}/>
<Field label={t('type')} help={h.protectionType}>
<select value={value.protection_type} onChange={e=>{const next=e.target.value;setValue({...value,protection_type:next,color:next==='backup'?'#16a36a':next==='synchronization'?'#3478f6':'#7c5ce7'})}}>
<option value="backup">{t('backup')}</option>
<option value="synchronization">{t('synchronization')}</option>
<option value="archive">{t('archive')}</option>
</select>
</Field>
<Field label={t('software')} help={h.planSoftware}>
<Select empty value={value.software_id||''} onChange={(v:string)=>set('software_id',v||null)} options={data.software}/>
</Field>
<FormSection title={section('Schedule','Zeitplan')} text={section('Plan when the job starts and how long it normally takes.','Plane, wann der Auftrag startet und wie lange er üblicherweise dauert.')}/>
<Field label={t('timing')} help={h.schedule}>
<select value={value.schedule_type} onChange={e=>set('schedule_type',e.target.value)}>
<option value="daily">{t('daily')}</option>
<option value="weekly">{t('weekly')}</option>
<option value="monthly">{t('monthly')}</option>
<option value="manual">{t('manual')}</option>
</select>
</Field>{value.schedule_type!=='manual'&&<Field label={t('start')} help={h.startTime}>
<input type="time" value={value.start_time} onChange={e=>set('start_time',e.target.value)}/>
</Field>}{value.schedule_type==='weekly'&&<Field label={t('weekly')} help={h.weekdays} wide>
<div className="weekday-picker">{[1,2,3,4,5,6,0].map(d=>
<button type="button" className={value.weekdays.includes(d)?'active':''} onClick={()=>set('weekdays',value.weekdays.includes(d)?value.weekdays.filter((x:number)=>x!==d):[...value.weekdays,d])} key={d}>{['Su','Mo','Tu','We','Th','Fr','Sa'][d]}</button>)}</div>
{attempted&&value.weekdays.length===0&&<p className="field-error"><TriangleAlert/>{h.selectDay}</p>}
</Field>}{value.schedule_type==='monthly'&&<Field label={t('monthly')} help={h.schedule}>
<input type="number" min="1" max="31" value={value.day_of_month} onChange={e=>set('day_of_month',e.target.value)}/>
</Field>}<Field label={t('duration')} help={h.duration}>
<div className="duration-input">
<input type="number" min={durationUnit==='hours'?'0.25':'1'} step={durationUnit==='hours'?'0.25':'1'} value={durationValue} onChange={e=>set('duration_minutes',Math.max(1,Number(e.target.value)*(durationUnit==='hours'?60:1)))}/>
<select value={durationUnit} onChange={e=>setDurationUnit(e.target.value as 'minutes'|'hours')} aria-label={t('duration')}><option value="minutes">{t('minutes')}</option><option value="hours">{lang==='de'?'Stunden':'Hours'}</option></select>
</div>
</Field>
<FormSection title={section('Retention & responsibility','Aufbewahrung & Verantwortung')} text={section('Document how long copies remain available and who takes care of this plan.','Dokumentiere, wie lange Kopien verfügbar bleiben und wer diesen Plan betreut.')}/>
<Field label={t('versions')} help={h.versions}>
<input type="number" min="1" value={value.version_count||''} onChange={e=>set('version_count',e.target.value)}/>
</Field>
<Field label={t('retention')} help={h.retention}>
<input type="number" min="1" value={value.retention_value||''} onChange={e=>set('retention_value',e.target.value)}/>
</Field>
<Field label={t('owner')} help={h.owner}>
<input value={value.owner} onChange={e=>set('owner',e.target.value)}/>
</Field>
<FormSection title={section('Notes & safety','Notizen & Sicherheit')} text={section('Add context and record technical protection properties.','Ergänze Hinweise und dokumentiere technische Schutzeigenschaften.')}/>
<Field label={t('notes')} help={h.notes} wide>
<textarea value={value.notes} onChange={e=>set('notes',e.target.value)}/>
</Field>
<Field label="Options" help={h.options} wide>
<div className="switches">
<label>
<input type="checkbox" checked={value.immutable} onChange={e=>set('immutable',e.target.checked)}/>{t('immutable')}</label>
<label>
<input type="checkbox" checked={value.encrypted} onChange={e=>set('encrypted',e.target.checked)}/>{t('encrypted')}</label>
<label>
<input type="checkbox" checked={value.active} onChange={e=>set('active',e.target.checked)}/>{t('active')}<Help text={h.active}>
</Help>
</label>
<input className="color" type="color" value={value.color} onChange={e=>set('color',e.target.value)}/>
</div>
</Field>
</div>
<ModalActions t={t} close={()=>setValue(null)} save={()=>{setAttempted(true);if(value.dataset_ids.length>0&&(value.schedule_type!=='weekly'||value.weekdays.length>0))save()}}/>
</Modal>}

function FormSection({title,text}:{title:string;text:string}){return <div className="form-section-title wide"><div><b>{title}</b><span>{text}</span></div></div>}
function DependencyNotice({status,lang}:{status:ReturnType<typeof dependencyStatus>;lang:Lang}){const de=lang==='de';const copy=status.issue==='missing'?[de?'Vorgelagerter Plan fehlt':'Upstream plan is missing',de?'Die gewählten Daten erreichen diese Quelle derzeit nicht zuverlässig. Erstelle oder aktiviere zuerst einen Plan zu diesem Ziel.':'The selected data does not currently reach this source reliably. Create or activate a plan to this target first.']:status.issue==='inactive'?[de?'Vorgelagerter Plan ist deaktiviert':'Upstream plan is inactive',de?`${status.upstream?.name} muss aktiviert werden, damit dieser Folgeschritt Daten erhält.`:`${status.upstream?.name} must be active for this downstream step to receive data.`]:status.issue==='manual'?[de?'Manueller vorgelagerter Plan':'Manual upstream plan',de?`${status.upstream?.name} muss vor diesem Plan manuell ausgeführt werden.`:`${status.upstream?.name} must be run manually before this plan.`]:status.issue==='timing'?[de?'Reihenfolge ist nicht sichergestellt':'Execution order is not guaranteed',de?`${status.upstream?.name} endet möglicherweise nicht vor diesem Plan. Passe Tage, Startzeit oder Dauer an.`:`${status.upstream?.name} may not finish before this plan. Adjust days, start times, or duration.`]:[de?'Abhängigkeit ist plausibel':'Dependency looks good',de?`${status.upstream?.name} ist aktiv und soll vor diesem Folgeschritt enden.`:`${status.upstream?.name} is active and scheduled to finish before this downstream step.`];return <div className={`dependency-notice wide ${status.issue?'warning':'ok'}`}>{status.issue?<TriangleAlert/>:<Check/>}<div><b>{copy[0]}</b><span>{copy[1]}</span></div></div>}

function EntityModal({tab,value,setValue,data,t,lang,save}:any){const h=getHelp(lang);const set=(k:string,v:any)=>setValue({...value,[k]:v});return <Modal title={`${value.id?t('edit'):t('add')} · ${t(tab==='datasets'?'dataSets':tab==='software'?'softwareList':tab)}`} close={()=>setValue(null)}>
<div className="form-grid">
<Field label={t('name')} help={h.name} wide>
<input value={value.name} onChange={e=>set('name',e.target.value)} autoFocus/>
</Field>{tab==='locations'&&<>
<Field label="Type" help={h.locationType}>
<select value={value.type} onChange={e=>set('type',e.target.value)}>
<option value="country">Country</option>
<option value="site">Site</option>
<option value="building">Building</option>
<option value="room">Room</option>
<option value="cloud">Cloud region</option>
</select>
</Field>
<Field label={t('parent')} help={h.parent}>
<Select empty value={value.parent_id||''} onChange={(v:string)=>set('parent_id',v||null)} options={data.locations.filter((x:Entity)=>x.id!==value.id)}/>
</Field>
</>}{tab==='sources'&&<>
<Field label={t('location')} help={h.sourceLocation}>
<Select value={value.location_id||''} onChange={(v:string)=>set('location_id',v)} options={data.locations}/>
</Field>
<Field label={t('deviceType')} help={h.deviceType}>
<select value={value.device_type} onChange={e=>set('device_type',e.target.value)}>
<option value="computer">Computer</option>
<option value="server">Server</option>
<option value="phone">Phone</option>
<option value="nas">NAS</option>
<option value="cloud">Cloud</option>
<option value="other">Other</option>
</select>
</Field>
</>}{tab==='targets'&&<>
<Field label={t('location')} help={h.targetLocation}>
<Select value={value.location_id||''} onChange={(v:string)=>set('location_id',v)} options={data.locations}/>
</Field>
<Field label={t('storageType')} help={h.storageType}>
<select value={value.storage_type} onChange={e=>set('storage_type',e.target.value)}>
<option value="nas">NAS</option>
<option value="external-disk">External disk</option>
<option value="server">Server</option>
<option value="cloud">Cloud</option>
<option value="tape">Tape</option>
<option value="other">Other</option>
</select>
</Field>
<Field label={t('provider')} help={h.provider} wide>
<input value={value.provider} onChange={e=>set('provider',e.target.value)}/>
</Field>
<Field label={t('color')} help={h.targetColor}>
<div className="color-field"><input type="color" value={value.color||'#3478f6'} onChange={e=>set('color',e.target.value)}/><code>{value.color||'#3478f6'}</code></div>
</Field>
<Field label="Options" wide>
<div className="switches">
<label>
<input type="checkbox" checked={value.immutable_capable} onChange={e=>set('immutable_capable',e.target.checked)}/>{t('capable')}<Help text={h.immutable}>
</Help>
</label>
<label>
<input type="checkbox" checked={value.encrypted_default} onChange={e=>set('encrypted_default',e.target.checked)}/>{t('defaultEncrypted')}<Help text={h.encrypted}>
</Help>
</label>
</div>
</Field>
</>}{tab==='datasets'&&<>
<Field label={t('source')} help={h.datasetSource}>
<Select value={value.source_id} onChange={(v:string)=>set('source_id',v)} options={data.sources}/>
</Field>
<Field label={t('priority')} help={h.priority}>
<select value={value.priority} onChange={e=>set('priority',e.target.value)}>
<option value="low">{t('low')}</option>
<option value="normal">{t('normal')}</option>
<option value="high">{t('high')}</option>
</select>
</Field>
</>}<Field label={t('notes')} help={h.notes} wide>
<textarea value={value.notes||''} onChange={e=>set('notes',e.target.value)}/>
</Field>
<Field label="" wide>
<label className="check">
<input type="checkbox" checked={value.active} onChange={e=>set('active',e.target.checked)}/>{t('active')}<Help text={h.active}>
</Help>
</label>
</Field>
</div>
<ModalActions t={t} close={()=>setValue(null)} save={save}/>
</Modal>}
function Modal({title,close,children}:any){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}>
<div className="modal">
<div className="modal-head">
<div>
<span className="eyebrow">Backup Planner</span>
<h2>{title}</h2>
</div>
<button className="icon-button" onClick={close}>
<X/>
</button>
</div>{children}</div>
</div>}
function ModalActions({t,close,save}:any){return <div className="modal-actions">
<button className="secondary" onClick={close}>{t('cancel')}</button>
<button className="primary" onClick={save}>{t('save')}</button>
</div>}
function Field({label,help,wide,children}:any){return <label className={`field ${wide?'wide':''}`}>
<span>{label}{help&&<Help text={help}/>}</span>{children}</label>}
function Help({text}:{text:string}){return <span className="help-tip" tabIndex={0} aria-label={text}>
<Info/>
<span role="tooltip">{text}</span>
</span>}
function Select({value,onChange,options,empty=false}:any){return <select value={value} onChange={e=>onChange(e.target.value)}>
<option value="">{empty?'—':'Select…'}</option>{options.filter((x:Entity)=>x.active).map((x:Entity)=>
<option key={x.id} value={x.id}>{x.name}</option>)}</select>}
function Empty({icon,text}:any){return <div className="empty">{icon}<p>{text}</p>
</div>}
