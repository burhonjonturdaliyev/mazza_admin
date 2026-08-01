import { useEffect, useState } from 'react'
import { LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'

const API = 'https://mazzajoy.uz/api/v1/admin/platform/'
type CatalogData = { regions: any[]; categories: any[]; comfortables: any[]; rules: any[]; currency_rate?: {rate?: string}; banners: any[] }

export function Catalog({token}:{token:string}) {
  const [data,setData]=useState<CatalogData|null>(null); const [error,setError]=useState(''); const [busy,setBusy]=useState('')
  const load=async()=>{setBusy('load');setError('');try{const r=await fetch(`${API}?section=catalog`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw Error(d.detail);setData(d)}catch(e){setError(e instanceof Error?e.message:'Xatolik')}finally{setBusy('')}}
  useEffect(()=>{void load()},[])
  const add=async(entity:string)=>{const name=window.prompt('Nomi:');if(!name)return;setBusy(entity);try{const r=await fetch(API,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'catalog_create',entity,name})});if(!r.ok)throw Error((await r.json()).detail);await load()}catch(e){setError(e instanceof Error?e.message:'Saqlanmadi')}finally{setBusy('')}}
  const remove=async(entity:string,id:number)=>{if(!confirm('O‘chirishni tasdiqlaysizmi?'))return;setBusy(`${entity}${id}`);try{const r=await fetch(API,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'catalog_delete',entity,id})});if(!r.ok)throw Error((await r.json()).detail);await load()}catch(e){setError(e instanceof Error?e.message:'O‘chirilmadi')}finally{setBusy('')}}
  if(!data)return <section className="panel finance-state"><LoaderCircle className="spin"/> {error||'Katalog yuklanmoqda...'}</section>
  const groups:[string,string,any[]][]=[['Hududlar','region',data.regions],['Kategoriyalar','category',data.categories],['Qulayliklar','comfortable',data.comfortables],['Qoidalar','rule',data.rules]]
  return <section className="panel directory"><div className="panel-head"><div><h2>Platforma sozlamalari</h2><p>Katalog va mobil ilovada chiqadigan ma’lumotlarni boshqaring.</p></div><button className="range" onClick={()=>void load()}><RefreshCw size={14}/> Yangilash</button></div>{error&&<p className="directory-notice error">{error}</p>}<div className="catalog-grid">{groups.map(([title,entity,items])=><div className="catalog-card" key={entity}><div><strong>{title}</strong><button onClick={()=>void add(entity)} disabled={!!busy}><Plus size={15}/> Qo‘shish</button></div>{items.length?items.map(item=><p key={item.id}><span>{item.name}</span><button onClick={()=>void remove(entity,item.id)} disabled={!!busy}><Trash2 size={14}/></button></p>):<small>Hozircha yo‘q</small>}</div>)}</div></section>
}
