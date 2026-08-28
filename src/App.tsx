import{useEffect,useState}from'react';
import{Activity,Archive,CalendarDays,ChevronRight,CircleHelp,Database,Download,Edit3,FolderArchive,Github,HardDrive,Info,Languages,LayoutDashboard,MapPin,Moon,Plus,RefreshCw,Search,Server,Settings as SettingsIcon,ShieldCheck,Sun,Trash2,TriangleAlert,X}from'lucide-react';
import{addDays,addMonths,eachDayOfInterval,endOfMonth,format,startOfMonth,startOfWeek}from'date-fns';import{de,enUS}from'date-fns/locale';
import{api}from'./api';import{useCopy,type Lang}from'./i18n';import type{AppData,Entity,Plan}from'./types';
import{getHelp}from'./help';

type View='dashboard'|'plans'|'schedule'|'settings';
const blankPlan={name:'',source_id:'',target_id:'',software_id:null,dataset_ids:[],protection_type:'backup',schedule_type:'weekly',weekdays:[],day_of_month:1,start_time:'03:00',duration_minutes:30,retention_value:null,retention_unit:'days',version_count:null,immutable:false,encrypted:false,owner:'',color:'#3478f6',notes:'',active:true};
const entityDefaults:Record<string,any>={locations:{name:'',type:'site',parent_id:null,notes:'',active:true},sources:{name:'',location_id:null,device_type:'computer',notes:'',active:true},targets:{name:'',location_id:null,storage_type:'nas',provider:'',immutable_capable:false,encrypted_default:false,notes:'',active:true},datasets:{name:'',source_id:'',priority:'normal',notes:'',active:true},software:{name:'',notes:'',active:true}};
const iconByView={dashboard:LayoutDashboard,plans:Database,schedule:CalendarDays,settings:SettingsIcon};

export default function App(){
 const[lang,setLang]=useState<Lang>(()=>(localStorage.getItem('language')as Lang)||'en');const[theme,setTheme]=useState(()=>localStorage.getItem('theme')||'light');const[view,setView]=useState<View>('dashboard');const[data,setData]=useState<AppData|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[plan,setPlan]=useState<any|null>(null);const[release,setRelease]=useState<any>(null);const t=useCopy(lang);
 const load=async()=>{try{setError('');setData(await api('/data'))}catch(e:any){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},[theme]);useEffect(()=>{localStorage.setItem('language',lang);document.documentElement.lang=lang},[lang]);useEffect(()=>{load();api('/release').then(setRelease).catch(()=>{})},[]);
 const savePlan=async()=>{try{await api(`/plans${plan.id?'/'+plan.id:''}`,{method:plan.id?'PUT':'POST',body:JSON.stringify({...plan,duration_minutes:Number(plan.duration_minutes),day_of_month:plan.day_of_month?Number(plan.day_of_month):null,version_count:plan.version_count?Number(plan.version_count):null,retention_value:plan.retention_value?Number(plan.retention_value):null})});setPlan(null);await load()}catch(e:any){setError(e.message)}};
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
   <div className="page">{view==='dashboard'&&data&&<Dashboard data={data} t={t} onStart={()=>nav('settings')}/>} {view==='plans'&&data&&<Plans data={data} t={t} edit={(p:Plan)=>setPlan({...p,immutable:!!p.immutable,encrypted:!!p.encrypted,active:!!p.active})} remove={async (p:Plan)=>{if(confirm(t('delete')+'?')){await api(`/plans/${p.id}`,{method:'DELETE'});load()}}}/>} {view==='schedule'&&data&&<Schedule data={data} t={t} lang={lang}/>} {view==='settings'&&data&&<Settings data={data} t={t} lang={lang} theme={theme} setLang={setLang} setTheme={setTheme} reload={load} release={release} setRelease={setRelease}/>}</div>
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
 </div>;
}

function Dashboard({data,t,onStart}:{data:AppData;t:any;onStart:()=>void}){const a=data.analysis;const tone=a.tone;const circumference=2*Math.PI*54;return <>
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
function summary(a:AppData['analysis'],t:any){const weak=a.datasets.filter(d=>d.score<70);return weak.length?`${a.datasets.length-weak.length} ${t('datasets').toLowerCase()} ${t('well').toLowerCase()}. ${weak.slice(0,2).map(d=>d.name).join(', ')} ${t('issues').toLowerCase()}.`:`${t('well')}. 3-2-1 is implemented for your active datasets.`}
function Stat({icon,value,label,tone='blue'}:any){return <article className="stat">
<span className={`stat-icon ${tone}`}>{icon}</span>
<div>
<b>{value}</b>
<small>{label}</small>
</div>
</article>}

function Plans({data,t,edit,remove}:any){const[q,setQ]=useState('');const[type,setType]=useState('all');const names=(key:string,id:string)=>data[key].find((x:Entity)=>x.id===id)?.name||'—';const list=data.plans.filter((p:Plan)=>!p.deleted_at&&(type==='all'||p.protection_type===type)&&[p.name,names('sources',p.source_id),names('targets',p.target_id)].join(' ').toLowerCase().includes(q.toLowerCase()));return <section className="section-card">
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
<td>
<div className="plan-name">
<i style={{background:p.color}}/>
<div>
<b>{p.name}</b>
<small>{p.dataset_ids.map((id:string)=>names('datasets',id)).join(', ')}</small>
</div>
</div>
</td>
<td>{names('sources',p.source_id)}</td>
<td>{names('targets',p.target_id)}</td>
<td>
<span className={`badge ${p.protection_type}`}>{t(p.protection_type)}</span>
</td>
<td>{scheduleLabel(p,t)}</td>
<td>
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
function scheduleLabel(p:Plan,t:any){if(p.schedule_type==='manual')return t('manual');if(p.schedule_type==='daily')return `${t('daily')} · ${p.start_time}`;if(p.schedule_type==='monthly')return `${t('monthly')} · ${p.day_of_month} · ${p.start_time}`;return `${p.weekdays.map((d:number)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')} · ${p.start_time}`}

function Schedule({data,t,lang}:{data:AppData;t:any;lang:Lang}){const[mode,setMode]=useState<'week'|'months'|'agenda'>('week');const[date,setDate]=useState(new Date());const names=(key:keyof AppData,id:string)=>(data[key]as Entity[]).find(x=>x.id===id)?.name||'—';const week=startOfWeek(date,{weekStartsOn:1});const days=eachDayOfInterval({start:week,end:addDays(week,6)});const occurrences=(day:Date)=>data.plans.filter(p=>!p.deleted_at&&p.active&&matchesDay(p,day));return <section className="section-card schedule-card">
<div className="toolbar schedule-tools">
<div className="segmented">{(['week','months','agenda']as const).map(x=>
<button className={mode===x?'active':''} onClick={()=>setMode(x)} key={x}>{t(x)}</button>)}</div>
<div className="period">
<button onClick={()=>setDate(mode==='months'?addMonths(date,-3):addDays(date,-7))}>‹</button>
<b>{mode==='months'?format(date,'MMM yyyy')+' – '+format(addMonths(date,2),'MMM yyyy'):format(week,'d MMM')+' – '+format(addDays(week,6),'d MMM yyyy')}</b>
<button onClick={()=>setDate(mode==='months'?addMonths(date,3):addDays(date,7))}>›</button>
</div>
</div>{mode==='week'&&<div className="gantt">
<div className="gantt-head">
<b>
</b>{Array.from({length:24},(_,h)=>
<span key={h}>{String(h).padStart(2,'0')}</span>)}</div>{days.map(day=>
<div className="gantt-row" key={day.toISOString()}>
<b>{format(day,'EEE dd',{locale:lang==='de'?de:enUS})}</b>
<div className="timeline">{Array.from({length:24},(_,h)=>
<i key={h}/>)}{occurrences(day).map(p=>
<div className="job" key={p.id} style={{left:`${timeMins(p.start_time)/1440*100}%`,width:`${Math.max(p.duration_minutes/1440*100,2.8)}%`,background:p.color}} title={`${p.name} · ${p.start_time} · ${p.duration_minutes} min`}>
<span>{p.name}</span>
</div>)}</div>
</div>)}</div>}{mode==='months'&&<MonthGantt date={date} data={data} names={names}/>} {mode==='agenda'&&<div className="agenda">{days.flatMap(day=>occurrences(day).map(p=>({day,p}))).sort((a,b)=>a.day.getTime()+timeMins(a.p.start_time)-b.day.getTime()-timeMins(b.p.start_time)).map(({day,p})=>
<article key={day.toISOString()+p.id}>
<time>{format(day,'EEE, d MMM',{locale:lang==='de'?de:enUS})}<b>{p.start_time}</b>
</time>
<i style={{background:p.color}}/>
<div>
<b>{p.name}</b>
<span>{names('sources',p.source_id)} → {names('targets',p.target_id)}</span>
</div>
<em>{p.duration_minutes} {t('minutes')}</em>
</article>)}</div>}</section>}
function MonthGantt({date,data}:any){const start=startOfMonth(date),end=endOfMonth(addMonths(date,2)),days=eachDayOfInterval({start,end});return <div className="month-gantt">
<div className="month-head">
<b>Backup plan</b>{days.map(d=>
<span className={[0,6].includes(d.getDay())?'weekend':''} key={d.toISOString()}>{d.getDate()===1?<small>{format(d,'MMM')}</small>:null}{d.getDate()}</span>)}</div>{data.plans.filter((p:Plan)=>p.active&&!p.deleted_at).map((p:Plan)=>
<div className="month-row" key={p.id}>
<b>{p.name}<small>{p.start_time}</small>
</b>{days.map(d=>
<span className={[0,6].includes(d.getDay())?'weekend':''} key={d.toISOString()}>{matchesDay(p,d)&&<i style={{background:p.color}}/>}</span>)}</div>)}</div>}
function matchesDay(p:Plan,d:Date){if(p.schedule_type==='daily')return true;if(p.schedule_type==='weekly')return p.weekdays.includes(d.getDay());if(p.schedule_type==='monthly')return p.day_of_month===d.getDate();return false}function timeMins(x:string){const[h,m]=x.split(':').map(Number);return h*60+m}

function Settings({data,t,lang,theme,setLang,setTheme,reload,release,setRelease}:any){
 const[tab,setTab]=useState('locations');const[editing,setEditing]=useState<any>(null);const[backups,setBackups]=useState<any>({files:[],folder:''});const h=getHelp(lang);const loadBackups=()=>api('/backups').then(setBackups);useEffect(()=>{loadBackups()},[]);const groups=[['locations',MapPin],['sources',Server],['targets',HardDrive],['datasets',Database],['software',Archive]];
 const save=async()=>{await api(`/${tab}${editing.id?'/'+editing.id:''}`,{method:editing.id?'PUT':'POST',body:JSON.stringify(editing)});setEditing(null);reload()};const remove=async(id:string)=>{if(confirm(t('deactivate')+'?')){await api(`/${tab}/${id}`,{method:'DELETE'});reload()}};
 return <div className="settings-layout">
<aside className="settings-nav">
<b>{t('masterData')}</b>{groups.map(([key,Icon]:any)=>
<button className={tab===key?'active':''} onClick={()=>{setTab(key);setEditing(null)}} key={key}>
<Icon/>{t(key==='datasets'?'dataSets':key==='software'?'softwareList':key)}</button>)}<b>{t('system')}</b>
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
<div className="master-list">{data[tab].map((x:Entity)=>
<article key={x.id} className={!x.active?'inactive':''}>
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
</article>)}</div>
</>:<SystemSettings {...{t,lang,theme,setLang,setTheme,backups,loadBackups,release,setRelease,reload}}/>}</section>{editing&&<EntityModal tab={tab} value={editing} setValue={setEditing} data={data} t={t} lang={lang} save={save}/>}</div>
}
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
<label className="secondary file-button">
<Download/>{t('import')}<input type="file" accept="application/json" onChange={async e=>{const file=e.target.files?.[0];if(file&&confirm(t('confirmRestore'))){await api('/import',{method:'POST',body:await file.text()});reload();loadBackups()}}}/>
</label>
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

function PlanModal({value,setValue,data,t,lang,save,onOpenSettings}:any){const h=getHelp(lang);const[attempted,setAttempted]=useState(false);const[durationUnit,setDurationUnit]=useState<'minutes'|'hours'>(()=>value.duration_minutes>=60&&value.duration_minutes%60===0?'hours':'minutes');const set=(k:string,v:any)=>setValue({...value,[k]:v});const datasets=data.datasets.filter((d:Entity)=>d.source_id===value.source_id&&d.active);const durationValue=durationUnit==='hours'?value.duration_minutes/60:value.duration_minutes;return <Modal title={value.id?t('edit'):t('newPlan')} close={()=>setValue(null)}>
<div className="form-grid">
<Field label={t('name')} help={h.name} wide>
<input value={value.name} onChange={e=>set('name',e.target.value)} autoFocus/>
</Field>
<Field label={t('source')} help={h.planSource}>
<Select value={value.source_id} onChange={(v:string)=>setValue({...value,source_id:v,dataset_ids:[]})} options={data.sources}/>
</Field>
<Field label={t('target')} help={h.planTarget}>
<Select value={value.target_id} onChange={(v:string)=>set('target_id',v)} options={data.targets}/>
</Field>
<Field label={t('dataset')} help={h.planDatasets} wide>
  {!value.source_id ? <div className="dataset-empty"><CircleHelp/><div><b>{h.chooseSourceFirst}</b><span>{h.planDatasets}</span></div></div>
  : datasets.length === 0 ? <div className="dataset-empty warning"><TriangleAlert/><div><b>{h.noDatasets}</b><button type="button" onClick={onOpenSettings}>{h.manageDatasets}<ChevronRight/></button></div></div>
  : <div className={`checkbox-grid dataset-select ${attempted&&value.dataset_ids.length===0?'invalid':''}`}>{datasets.map((d:Entity)=>
    <label key={d.id}><input type="checkbox" checked={value.dataset_ids.includes(d.id)} onChange={e=>set('dataset_ids',e.target.checked?[...value.dataset_ids,d.id]:value.dataset_ids.filter((x:string)=>x!==d.id))}/><span><b>{d.name}</b><small>{t(d.priority)}</small></span></label>)}</div>}
  {attempted&&value.dataset_ids.length===0&&datasets.length>0&&<p className="field-error"><TriangleAlert/>{h.selectOne}</p>}
</Field>
<Field label={t('type')} help={h.protectionType}>
<select value={value.protection_type} onChange={e=>set('protection_type',e.target.value)}>
<option value="backup">{t('backup')}</option>
<option value="synchronization">{t('synchronization')}</option>
<option value="archive">{t('archive')}</option>
</select>
</Field>
<Field label={t('software')} help={h.planSoftware}>
<Select empty value={value.software_id||''} onChange={(v:string)=>set('software_id',v||null)} options={data.software}/>
</Field>
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
<Field label={t('versions')} help={h.versions}>
<input type="number" min="1" value={value.version_count||''} onChange={e=>set('version_count',e.target.value)}/>
</Field>
<Field label={t('retention')} help={h.retention}>
<input type="number" min="1" value={value.retention_value||''} onChange={e=>set('retention_value',e.target.value)}/>
</Field>
<Field label={t('owner')} help={h.owner}>
<input value={value.owner} onChange={e=>set('owner',e.target.value)}/>
</Field>
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
