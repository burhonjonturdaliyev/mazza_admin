import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDownToLine, Bell, Building2, CalendarDays, ChevronDown, CircleDollarSign,
  Check, LayoutDashboard, LoaderCircle, MoreHorizontal, Search, Settings, ShieldCheck, TrendingUp,
  Users, WalletCards, LogOut
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { PropertiesBookings } from './components/PropertiesBookings'
import { FinanceDirectory } from './components/FinanceDirectory'
import { Catalog } from './components/Catalog'
import { Notifications } from './components/Notifications'
import { adminFetch } from './auth'
import './App.css'


type View = 'Dashboard' | 'Foydalanuvchilar' | 'Agentlar' | 'Agent arizalari' | 'Mulklar' | 'Bronlar' | 'Tranzaksiyalar' | 'Pul yechish' | 'Bildirishnomalar' | 'Sozlamalar'
const nav: [View, typeof LayoutDashboard][] = [
  ['Dashboard', LayoutDashboard], ['Foydalanuvchilar', Users], ['Agentlar', ShieldCheck], ['Agent arizalari', ShieldCheck],
  ['Mulklar', Building2], ['Bronlar', CalendarDays], ['Bildirishnomalar', Bell], ['Tranzaksiyalar', WalletCards], ['Pul yechish', ArrowDownToLine],
]

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mazza_admin_token') ?? '')
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null)
  const [view, setView] = useState<View>('Dashboard')
  const [query, setQuery] = useState('')
  const [withdrawals, setWithdrawals] = useState(12)
  const title = useMemo(() => view === 'Dashboard' ? 'Xush kelibsiz, Burhonjon' : view, [view])
  const logout = () => {
    localStorage.removeItem('mazza_admin_token')
    localStorage.removeItem('mazza_admin_refresh')
    setDashboard(null)
    setToken('')
  }
  useEffect(() => {
    const expired = () => setToken('')
    window.addEventListener('mazza-admin-session-expired', expired)
    return () => window.removeEventListener('mazza-admin-session-expired', expired)
  }, [])
  useEffect(() => { if (!token) return; adminFetch('https://mazzajoy.uz/api/v1/admin/platform/?section=dashboard').then(r=>r.ok?r.json():Promise.reject()).then(setDashboard).catch(()=>setDashboard(null)) }, [token])
  if (!token) return <Login onSuccess={setToken}/>
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><span>Mazza<span className="brand-dot">.</span></span></div>
      <div className="workspace"><span className="workspace-dot"/> MAZZA PLATFORM <ChevronDown size={14}/></div>
      <nav>{nav.map(([label, Icon]) => <button key={label} className={view === label ? 'nav active' : 'nav'} onClick={() => setView(label)}><Icon size={19}/><span>{label}</span>{label === 'Pul yechish' && withdrawals > 0 && <b>{withdrawals}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className={view === 'Sozlamalar' ? 'nav active' : 'nav'} onClick={()=>setView('Sozlamalar')}><Settings size={19}/><span>Sozlamalar</span></button><div className="support"><span>?</span><div><strong>Yordam kerakmi?</strong><small>Qo‘llab-quvvatlash markazi</small></div></div></div>
    </aside>
    <main>
      <header><div><p className="eyebrow">{view === 'Dashboard' ? '01 AVGUST, 2026' : 'MAZZA BOSHQARUV TIZIMI'}</p><h1>{title}</h1><p className="subtitle">Platformangizdagi asosiy ko‘rsatkichlar va jarayonlar.</p></div><div className="header-actions"><button className="icon-btn"><Bell size={20}/><i/></button><div className="avatar">BT</div><div className="profile"><strong>Burhonjon</strong><small>Super admin</small></div><button className="logout-button" onClick={logout} title="Admin paneldan chiqish"><LogOut size={17}/><span>Chiqish</span></button></div></header>
      <section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Foydalanuvchi, mulk yoki bron qidiring..."/></div><button className="range">Oxirgi 30 kun <ChevronDown size={15}/></button></section>
      {view === 'Dashboard' ? <Dashboard data={dashboard} setView={setView} withdrawals={withdrawals}/> : view === 'Sozlamalar' ? <Catalog/> : view === 'Bildirishnomalar' ? <Notifications query={query}/> : view === 'Tranzaksiyalar' || view === 'Pul yechish' ? <FinanceDirectory view={view} token={token} query={query} onPendingChange={setWithdrawals}/> : <Directory view={view} query={query} token={token}/>}
    </main>
  </div>
}

function Dashboard({ data, setView, withdrawals }: {data:Record<string, any>|null,setView:(v:View)=>void, withdrawals:number}) {
  const metrics = data?.metrics
  const money = (value: unknown) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Number(value ?? 0))
  const activity = (data?.recent_transactions ?? []).slice(0, 7).reverse().map((item: Record<string, any>) => ({
    day: item.created_at ? new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' }).format(new Date(item.created_at)) : '—', value: Number(item.amount ?? 0),
  }))
  const transactionRows = (data?.recent_transactions ?? []).slice(0, 4).map((item: Record<string, any>) => [
    `#TRX-${item.id}`, item.kind?.replaceAll('_', ' ') || 'Tranzaksiya', item.user__first_name || item.user__phone || '—', `${item.direction === 'debit' ? '−' : '+'} ${money(item.amount)} so‘m`, item.direction === 'debit' ? 'Chiqim' : 'Kirim',
  ])
  const bookingRows = (data?.recent_bookings ?? []).slice(0, 4).map((item: Record<string, any>) => [
    item.item__property__name || 'Mulk ko‘rsatilmagan', item.user__phone || '—', `${item.date_access || '—'} — ${item.date_exit || '—'}`, item.status || 'Noma’lum',
  ])
  return <><section className="metrics">
    <Metric icon={<CircleDollarSign/>} tone="violet" label="Platforma daromadi" value={metrics?.revenue ?? '—'} suffix="so‘m" delta="30 kun"/>
    <Metric icon={<CalendarDays/>} tone="blue" label="Yangi bronlar" value={metrics?.bookings?.toString() ?? '—'} suffix="ta" delta="30 kun"/>
    <Metric icon={<Users/>} tone="orange" label="Faol foydalanuvchilar" value={metrics?.active_users?.toString() ?? '—'} suffix="ta" delta="jonli"/>
    <Metric icon={<Building2/>} tone="green" label="Faol mulklar" value={metrics?.properties?.toString() ?? '—'} suffix="ta" delta="jonli"/>
  </section>
  <section className="grid-two"><div className="panel revenue"><div className="panel-head"><div><h2>Daromadlar tahlili</h2><p>Oxirgi to‘lovlardagi real tushumlar</p></div><button className="link" onClick={()=>setView('Tranzaksiyalar')}>Hisobotni ko‘rish →</button></div><div className="chart-stat"><strong>{money(metrics?.revenue)} <small>so‘m</small></strong><span><TrendingUp size={15}/> Oxirgi 30 kun</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity}><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7257f5" stopOpacity=".32"/><stop offset="100%" stopColor="#7257f5" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#7257f5" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div>
  <div className="panel attention"><div className="panel-head"><div><h2>Diqqat talab qiladi</h2><p>Tezkor boshqaruv markazi</p></div></div><button className="attention-row" onClick={()=>setView('Pul yechish')}><span className="bubble amber"><ArrowDownToLine size={18}/></span><div><strong>{data?.pending?.withdrawals ?? withdrawals} ta pul yechish so‘rovi</strong><small>Tekshiruv va tasdiqlashni kutmoqda</small></div><b>Ko‘rish →</b></button><button className="attention-row" onClick={()=>setView('Agent arizalari')}><span className="bubble blue"><ShieldCheck size={18}/></span><div><strong>{data?.pending?.agent_requests ?? 0} ta agent arizasi</strong><small>Tekshiruv va tasdiqlashni kutmoqda</small></div><b>Ko‘rish →</b></button><button className="attention-row" onClick={()=>setView('Mulklar')}><span className="bubble pink"><Building2 size={18}/></span><div><strong>{data?.pending?.inactive_properties ?? 0} ta mulk</strong><small>Moderatsiya navbatida</small></div><b>Ko‘rish →</b></button></div></section>
  <section className="grid-two lower"><DataPanel title="Oxirgi tranzaksiyalar" action="Barchasi" rows={transactionRows} columns={['ID', 'Turi', 'Foydalanuvchi', 'Summa', 'Holat']}/><DataPanel title="Yangi bronlar" action="Kalendar" rows={bookingRows} columns={['Mulk', 'Mijoz', 'Sana', 'Holat']}/></section>
  <section className="panel withdraw"><div><p className="eyebrow">MOLIYAVIY NAZORAT</p><h2>Pul yechish so‘rovlarini tasdiqlang</h2><p>{data?.pending?.withdrawals ?? withdrawals} ta so‘rov ko‘rib chiqishni kutmoqda.</p></div><div><strong>{data?.pending?.withdrawals ?? withdrawals} ta</strong><button onClick={()=>setView('Pul yechish')}>So‘rovlarni ko‘rish</button></div></section></>
}
function Metric({icon,tone,label,value,suffix,delta}:{icon:React.ReactNode,tone:string,label:string,value:string,suffix:string,delta:string}) { return <article className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value} <small>{suffix}</small></strong><span><TrendingUp size={13}/> {delta} <em>o‘tgan oyga nisbatan</em></span></div></article> }
function DataPanel({title,action,rows,columns}:{title:string,action:string,rows:string[][],columns:string[]}) {return <div className="panel data"><div className="panel-head"><div><h2>{title}</h2></div><button className="link">{action} →</button></div><div className="table"><div className="tr th">{columns.map(c=><span key={c}>{c}</span>)}</div>{rows.map(r=><div className="tr" key={r[0]}>{r.map((v,j)=><span key={j} className={j===r.length-1?'status':''}>{j===r.length-1?<i className={v==='Tasdiqlangan'||v==='success'?'ok':v==='waiting'?'wait':'review'}>{v==='success'?'Muvaffaqiyatli':v}</i>:v}</span>)}<button><MoreHorizontal size={18}/></button></div>)}</div></div>}
type PlatformUser = {
  id: number | string; username?: string; first_name?: string; last_name?: string;
  full_name?: string; phone?: string; email?: string; role?: string;
  is_active?: boolean; agent_request_pending?: boolean; created_at?: string;
}

const API = 'https://mazzajoy.uz/api/v1/admin/platform/'
const getRows = (payload: unknown): PlatformUser[] => {
  if (Array.isArray(payload)) return payload as PlatformUser[]
  if (!payload || typeof payload !== 'object') return []
  const data = payload as Record<string, unknown>
  for (const key of ['results', 'users', 'data', 'items']) if (Array.isArray(data[key])) return data[key] as PlatformUser[]
  return []
}
const userName = (user: PlatformUser) => user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User #${user.id}`
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()

function Directory({view,query,token}:{view:View,query:string,token:string}) {
  if (view === 'Mulklar' || view === 'Bronlar') return <PropertiesBookings section={view === 'Mulklar' ? 'properties' : 'bookings'} token={token} query={query}/>
  const isUsers = view === 'Foydalanuvchilar'
  const isRequests = view === 'Agent arizalari'
  const [rows, setRows] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<PlatformUser['id'] | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isUsers && view !== 'Agentlar' && !isRequests) return
    const controller = new AbortController()
    setLoading(true); setError(''); setMessage('')
    const load = async (params: URLSearchParams) => {
      const response = await adminFetch(`${API}?${params}`, { signal: controller.signal })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.detail || 'Ma’lumotlarni yuklab bo‘lmadi')
      return getRows(body)
    }
    const params = new URLSearchParams({ section: 'users' })
    if (view === 'Agentlar') params.set('role', 'agent')
    const pendingParams = new URLSearchParams({ section: 'users' })
    Promise.all(view === 'Agentlar' ? [load(params), load(pendingParams)] : [load(params)])
      .then(([agents, allUsers]) => {
        if (!allUsers) return setRows(agents)
        const pending = allUsers.filter(user => user.agent_request_pending)
        setRows([...agents, ...pending.filter(user => !agents.some(agent => agent.id === user.id))])
      })
      .catch(reason => { if (reason.name !== 'AbortError') setError(reason.message || 'Tarmoq xatosi yuz berdi') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [isUsers, token, view])

  const filtered = rows.filter(user => (!isRequests || user.agent_request_pending) && `${userName(user)} ${user.username ?? ''} ${user.phone ?? ''} ${user.email ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  async function approve(user: PlatformUser) {
    setActionId(user.id); setError(''); setMessage('')
    try {
      const response = await adminFetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_agent', user_id: user.id }) })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.detail || 'Agentni tasdiqlab bo‘lmadi')
      setRows(current => current.map(item => item.id === user.id ? { ...item, role: 'agent', agent_request_pending: false, is_active: true } : item))
      setMessage(`${userName(user)} agent sifatida tasdiqlandi.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Amal bajarilmadi') }
    finally { setActionId(null) }
  }
  async function changeUserStatus(user: PlatformUser) {
    const is_active = user.is_active === false
    if (!window.confirm(`${userName(user)} foydalanuvchisini ${is_active ? 'blokdan chiqarish' : 'bloklash'}ni tasdiqlaysizmi?`)) return
    setActionId(user.id); setError('')
    try {
      const response = await adminFetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_user_status', user_id: user.id, is_active }) })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.detail || 'Foydalanuvchi holati yangilanmadi')
      setRows(current => current.map(item => item.id === user.id ? { ...item, is_active } : item))
      setMessage(`${userName(user)} ${is_active ? 'blokdan chiqarildi' : 'bloklandi'}.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Amal bajarilmadi') }
    finally { setActionId(null) }
  }

  if (!isUsers && view !== 'Agentlar' && !isRequests) return <section className="panel directory"><div className="panel-head"><div><h2>{view}</h2><p>Bu bo‘lim hozir yuklanmoqda.</p></div></div></section>
  return <section className="panel directory"><div className="panel-head"><div><h2>{view}</h2><p>{isUsers ? 'Platformadagi foydalanuvchilar, rollar va agent arizalarini boshqaring.' : 'Agentlar va tasdiqlashni kutayotgan arizalar.'}</p></div></div><div className="filter-row"><button>{isUsers ? 'Barcha rollar' : 'Agentlar'} <ChevronDown size={14}/></button><span>{loading ? 'Yuklanmoqda...' : `${filtered.length} ta natija`}</span></div>{message && <div className="directory-notice success"><Check size={16}/>{message}</div>}{error && <div className="directory-notice error">{error}<button onClick={() => setError('')}>×</button></div>}<div className="directory-list">{loading ? <div className="directory-state"><LoaderCircle className="spin" size={24}/> Ma’lumotlar yuklanmoqda...</div> : filtered.length === 0 ? <div className="directory-state">{query ? 'Qidiruv bo‘yicha ma’lumot topilmadi.' : 'Hozircha ma’lumot mavjud emas.'}</div> : filtered.map(user => { const name = userName(user); const pending = Boolean(user.agent_request_pending); const isAgent = user.role === 'agent'; return <div className={`directory-row ${pending ? 'agent-request-row' : ''}`} key={user.id}><span className="person">{initials(name)}</span><div><strong>{name}</strong><small>{user.phone || user.email || user.username || 'Kontakt kiritilmagan'} · {user.role || 'client'}</small></div><span className={pending ? 'pill pending' : user.is_active === false ? 'pill muted' : 'pill'}>{pending ? 'Agent arizasi' : user.is_active === false ? 'Nofaol' : isAgent ? 'Agent' : 'Faol'}</span><div className="directory-actions">{pending && <button className="approve" disabled={actionId === user.id} onClick={() => void approve(user)}>{actionId === user.id ? <LoaderCircle className="spin" size={15}/> : <Check size={15}/>} Agentga tasdiqlash</button>}<button className={user.is_active === false ? 'approve secondary-action' : 'row-menu'} disabled={actionId === user.id} onClick={() => void changeUserStatus(user)}>{actionId === user.id ? <LoaderCircle className="spin" size={15}/> : user.is_active === false ? 'Blokdan chiqarish' : 'Bloklash'}</button></div></div> })}</div></section>
}
export default App

function Login({onSuccess}:{onSuccess:(token:string)=>void}) {
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('https://mazzajoy.uz/api/v1/admin/login/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const d=await r.json();if(!r.ok)throw Error(d.detail);localStorage.setItem('mazza_admin_token',d.access);localStorage.setItem('mazza_admin_refresh',d.refresh);onSuccess(d.access)}catch(e){setError(e instanceof Error?e.message:'Kirish amalga oshmadi')}finally{setBusy(false)}}
  return <div className="login"><form onSubmit={submit}><div className="brand"><span className="brand-mark">M</span>Mazza<span className="brand-dot">.</span></div><p className="eyebrow">XAVFSIZ BOSHQARUV PORTALI</p><h1>Admin panelga kiring</h1><p>Platforma operatsiyalarini boshqarish uchun ma’lumotlaringizni kiriting.</p><label>Login<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></label><label>Parol<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required/></label>{error&&<small className="login-error">{error}</small>}<button className="primary" disabled={busy}>{busy?'Tekshirilmoqda...':'Xavfsiz kirish'}</button></form></div>
}
