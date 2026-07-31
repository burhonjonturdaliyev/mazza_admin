import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDownToLine, Bell, Building2, CalendarDays, ChevronDown, CircleDollarSign,
  LayoutDashboard, MoreHorizontal, Search, Settings, ShieldCheck, TrendingUp,
  Users, WalletCards
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import './App.css'

const chart = [
  { day: 'Du', value: 14 }, { day: 'Se', value: 26 }, { day: 'Ch', value: 19 },
  { day: 'Pa', value: 42 }, { day: 'Ju', value: 31 }, { day: 'Sh', value: 58 }, { day: 'Ya', value: 46 },
]
const transactions = [
  ['#TRX-24081', 'Click to‘lovi', 'Shahzod Karimov', '+ 285 000 so‘m', 'success'],
  ['#TRX-24080', 'Pul yechish', 'Diyorbek Aliyev', '− 1 200 000 so‘m', 'waiting'],
  ['#TRX-24079', 'Bron komissiyasi', 'Chorvoq Family Dacha', '+ 75 000 so‘m', 'success'],
  ['#TRX-24078', 'Pul yechish', 'Zebo Hospitality', '− 540 000 so‘m', 'review'],
]
const bookings = [
  ['Anhor Choyxonasi', 'Murodjon E.', 'Bugun, 19:00', 'Tasdiqlangan'],
  ['Chorvoq Family Dacha', 'Madina R.', '02 Aug — 04 Aug', 'Kutilmoqda'],
  ['Grand Atlas Hotel', 'Abror S.', '03 Aug — 05 Aug', 'Tasdiqlangan'],
]

type View = 'Dashboard' | 'Foydalanuvchilar' | 'Agentlar' | 'Mulklar' | 'Bronlar' | 'Tranzaksiyalar' | 'Pul yechish'
const nav: [View, typeof LayoutDashboard][] = [
  ['Dashboard', LayoutDashboard], ['Foydalanuvchilar', Users], ['Agentlar', ShieldCheck],
  ['Mulklar', Building2], ['Bronlar', CalendarDays], ['Tranzaksiyalar', WalletCards], ['Pul yechish', ArrowDownToLine],
]

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mazza_admin_token') ?? '')
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null)
  const [view, setView] = useState<View>('Dashboard')
  const [query, setQuery] = useState('')
  const [withdrawals, setWithdrawals] = useState(12)
  const title = useMemo(() => view === 'Dashboard' ? 'Xush kelibsiz, Burhonjon' : view, [view])
  useEffect(() => { if (!token) return; fetch('https://mazzajoy.uz/api/v1/admin/platform/?section=dashboard', {headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():Promise.reject()).then(setDashboard).catch(()=>setDashboard(null)) }, [token])
  if (!token) return <Login onSuccess={setToken}/>
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><span>Mazza<span className="brand-dot">.</span></span></div>
      <div className="workspace"><span className="workspace-dot"/> MAZZA PLATFORM <ChevronDown size={14}/></div>
      <nav>{nav.map(([label, Icon]) => <button key={label} className={view === label ? 'nav active' : 'nav'} onClick={() => setView(label)}><Icon size={19}/><span>{label}</span>{label === 'Pul yechish' && withdrawals > 0 && <b>{withdrawals}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav"><Settings size={19}/><span>Sozlamalar</span></button><div className="support"><span>?</span><div><strong>Yordam kerakmi?</strong><small>Qo‘llab-quvvatlash markazi</small></div></div></div>
    </aside>
    <main>
      <header><div><p className="eyebrow">{view === 'Dashboard' ? '01 AVGUST, 2026' : 'MAZZA BOSHQARUV TIZIMI'}</p><h1>{title}</h1><p className="subtitle">Platformangizdagi asosiy ko‘rsatkichlar va jarayonlar.</p></div><div className="header-actions"><button className="icon-btn"><Bell size={20}/><i/></button><div className="avatar">BT</div><div className="profile"><strong>Burhonjon</strong><small>Super admin</small></div><ChevronDown size={16}/></div></header>
      <section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Foydalanuvchi, mulk yoki bron qidiring..."/></div><button className="range">Oxirgi 30 kun <ChevronDown size={15}/></button></section>
      {view === 'Dashboard' ? <Dashboard data={dashboard} setView={setView} withdrawals={withdrawals} setWithdrawals={setWithdrawals}/> : <Directory view={view} query={query}/>} 
    </main>
  </div>
}

function Dashboard({ data, setView, withdrawals, setWithdrawals }: {data:Record<string, any>|null,setView:(v:View)=>void, withdrawals:number, setWithdrawals:(n:number)=>void}) {
  const metrics = data?.metrics
  return <><section className="metrics">
    <Metric icon={<CircleDollarSign/>} tone="violet" label="Platforma daromadi" value={metrics?.revenue ?? '—'} suffix="so‘m" delta="30 kun"/>
    <Metric icon={<CalendarDays/>} tone="blue" label="Yangi bronlar" value={metrics?.bookings?.toString() ?? '—'} suffix="ta" delta="30 kun"/>
    <Metric icon={<Users/>} tone="orange" label="Faol foydalanuvchilar" value={metrics?.active_users?.toString() ?? '—'} suffix="ta" delta="jonli"/>
    <Metric icon={<Building2/>} tone="green" label="Faol mulklar" value={metrics?.properties?.toString() ?? '—'} suffix="ta" delta="jonli"/>
  </section>
  <section className="grid-two"><div className="panel revenue"><div className="panel-head"><div><h2>Daromadlar tahlili</h2><p>Komissiya va platforma tushumlari</p></div><button className="link">Hisobotni ko‘rish →</button></div><div className="chart-stat"><strong>48 750 000 <small>so‘m</small></strong><span><TrendingUp size={15}/> 18.4%</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7257f5" stopOpacity=".32"/><stop offset="100%" stopColor="#7257f5" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#7257f5" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div>
  <div className="panel attention"><div className="panel-head"><div><h2>Diqqat talab qiladi</h2><p>Tezkor boshqaruv markazi</p></div></div><button className="attention-row" onClick={()=>setView('Pul yechish')}><span className="bubble amber"><ArrowDownToLine size={18}/></span><div><strong>{withdrawals} ta pul yechish so‘rovi</strong><small>Jami 18 420 000 so‘m kutilmoqda</small></div><b>Ko‘rish →</b></button><button className="attention-row" onClick={()=>setView('Agentlar')}><span className="bubble blue"><ShieldCheck size={18}/></span><div><strong>7 ta agent arizasi</strong><small>Tekshiruv va tasdiqlashni kutmoqda</small></div><b>Ko‘rish →</b></button><button className="attention-row" onClick={()=>setView('Mulklar')}><span className="bubble pink"><Building2 size={18}/></span><div><strong>4 ta yangi mulk</strong><small>Moderatsiya navbatida</small></div><b>Ko‘rish →</b></button></div></section>
  <section className="grid-two lower"><DataPanel title="Oxirgi tranzaksiyalar" action="Barchasi" rows={transactions} columns={['ID', 'Turi', 'Mijoz / Mulk', 'Summa', 'Holat']}/><DataPanel title="Yangi bronlar" action="Kalendar" rows={bookings} columns={['Mulk', 'Mijoz', 'Sana', 'Holat']}/></section>
  <section className="panel withdraw"><div><p className="eyebrow">MOLIYAVIY NAZORAT</p><h2>Pul yechish so‘rovlarini tasdiqlang</h2><p>{withdrawals} ta so‘rov ko‘rib chiqishni kutmoqda.</p></div><div><strong>18 420 000 so‘m</strong><button onClick={()=>{setWithdrawals(0); setView('Pul yechish')}}>So‘rovlarni ko‘rish</button></div></section></>
}
function Metric({icon,tone,label,value,suffix,delta}:{icon:React.ReactNode,tone:string,label:string,value:string,suffix:string,delta:string}) { return <article className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value} <small>{suffix}</small></strong><span><TrendingUp size={13}/> {delta} <em>o‘tgan oyga nisbatan</em></span></div></article> }
function DataPanel({title,action,rows,columns}:{title:string,action:string,rows:string[][],columns:string[]}) {return <div className="panel data"><div className="panel-head"><div><h2>{title}</h2></div><button className="link">{action} →</button></div><div className="table"><div className="tr th">{columns.map(c=><span key={c}>{c}</span>)}</div>{rows.map(r=><div className="tr" key={r[0]}>{r.map((v,j)=><span key={j} className={j===r.length-1?'status':''}>{j===r.length-1?<i className={v==='Tasdiqlangan'||v==='success'?'ok':v==='waiting'?'wait':'review'}>{v==='success'?'Muvaffaqiyatli':v}</i>:v}</span>)}<button><MoreHorizontal size={18}/></button></div>)}</div></div>}
function Directory({view,query}:{view:View,query:string}) { const rows = Array.from({length: 7},(_,i)=>({name:['Dilshod Islomov','Malika Karimova','Javohir Mirzayev','Saidbek Tursunov','Zebo Hospitality','Anhor Choyxonasi','Chorvoq Family'][i],sub:['+998 90 123 45 67','Agent · Toshkent','Mijoz · Faol','Agent arizasi','14 820 000 so‘m','Moderatsiyada','Bronlar: 28'][i]})).filter(r=>r.name.toLowerCase().includes(query.toLowerCase())); return <section className="panel directory"><div className="panel-head"><div><h2>{view}</h2><p>Platformadagi barcha ma’lumotlarni boshqaring.</p></div><button className="primary">+ Yangi qo‘shish</button></div><div className="filter-row"><button>Hammasi <ChevronDown size={14}/></button><button>Oxirgi 30 kun <ChevronDown size={14}/></button><span>{rows.length} ta natija</span></div><div className="directory-list">{rows.map((r,i)=><div className="directory-row" key={r.name}><span className="person">{r.name.split(' ').map(x=>x[0]).join('')}</span><div><strong>{r.name}</strong><small>{r.sub}</small></div><span className={i===3||i===5?'pill pending':'pill'}>{i===3?'Kutilmoqda':i===5?'Tekshiruvda':'Faol'}</span><button><MoreHorizontal size={20}/></button></div>)}</div></section> }
export default App

function Login({onSuccess}:{onSuccess:(token:string)=>void}) {
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('https://mazzajoy.uz/api/v1/admin/login/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const d=await r.json();if(!r.ok)throw Error(d.detail);localStorage.setItem('mazza_admin_token',d.access);onSuccess(d.access)}catch(e){setError(e instanceof Error?e.message:'Kirish amalga oshmadi')}finally{setBusy(false)}}
  return <div className="login"><form onSubmit={submit}><div className="brand"><span className="brand-mark">M</span>Mazza<span className="brand-dot">.</span></div><p className="eyebrow">XAVFSIZ BOSHQARUV PORTALI</p><h1>Admin panelga kiring</h1><p>Platforma operatsiyalarini boshqarish uchun ma’lumotlaringizni kiriting.</p><label>Login<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></label><label>Parol<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required/></label>{error&&<small className="login-error">{error}</small>}<button className="primary" disabled={busy}>{busy?'Tekshirilmoqda...':'Xavfsiz kirish'}</button></form></div>
}
