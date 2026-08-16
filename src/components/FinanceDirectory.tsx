import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, ChevronDown, CircleDollarSign, CreditCard, LoaderCircle, RefreshCw, WalletCards, X, XCircle } from 'lucide-react'
import { adminFetch } from '../auth'

const API = 'https://mazzajoy.uz/api/v1/admin/platform/'

type FinanceView = 'Tranzaksiyalar' | 'Pul yechish'
type Transaction = { id: number; amount: string | number; direction: string; kind: string; reference: string; note: string; created_at: string; user__phone?: string; user__first_name?: string }
type Balance = { balans?: string | number; balance?: string | number; user__phone?: string; user__first_name?: string; user?: { phone?: string; first_name?: string } }
type Withdrawal = { id: number; amount: string | number; card_number: string; card_holder: string; status: string; admin_note: string; created_at: string; user__phone?: string; user__first_name?: string; reviewed_by__first_name?: string }

function money(value: unknown) {
  const number = Number(value ?? 0)
  return `${new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Number.isFinite(number) ? number : 0)} so‘m`
}
function date(value: string) {
  return new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
function label(kind: string) {
  return ({ withdrawal: 'Pul yechish', payment: 'To‘lov', booking: 'Bron', click: 'Click to‘lovi', balance: 'Balans' } as Record<string, string>)[kind] ?? kind.replaceAll('_', ' ')
}
function person(row: { user__first_name?: string; user__phone?: string }) { return row.user__first_name || row.user__phone || 'Noma’lum foydalanuvchi' }

export function FinanceDirectory({ view, token: _token, query, onPendingChange }: { view: FinanceView; token: string; query: string; onPendingChange?: (count: number) => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  const request = useCallback(async (section: string, init?: RequestInit) => {
    const response = await adminFetch(`${API}?section=${section}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.detail || 'Serverdan ma’lumot olib bo‘lmadi')
    return body
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      if (view === 'Tranzaksiyalar') {
        const [transactionsData, balancesData] = await Promise.all([request('transactions'), request('balances')])
        setTransactions(transactionsData.results ?? [])
        setBalances(balancesData.results ?? balancesData ?? [])
      } else {
        const data = await request('withdrawals')
        const results = data.results ?? []
        setWithdrawals(results)
        onPendingChange?.(results.filter((row: Withdrawal) => row.status === 'pending').length)
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Kutilmagan xatolik') }
    finally { setLoading(false) }
  }, [onPendingChange, request, view])

  useEffect(() => { void load() }, [load])

  const filteredTransactions = useMemo(() => transactions.filter(row => `${person(row)} ${row.kind} ${row.reference}`.toLowerCase().includes(query.toLowerCase())), [query, transactions])
  const filteredWithdrawals = useMemo(() => withdrawals.filter(row => (status === 'all' || row.status === status) && `${person(row)} ${row.card_holder} ${row.card_number}`.toLowerCase().includes(query.toLowerCase())), [query, status, withdrawals])

  async function review(row: Withdrawal, nextStatus: 'approved' | 'rejected' | 'paid') {
    const action = nextStatus === 'rejected' ? 'rad etish' : nextStatus === 'paid' ? 'to‘langan deb belgilash' : 'tasdiqlash'
    const note = window.prompt(`So‘rovni ${action}. Izoh (ixtiyoriy):`, row.admin_note || '')
    if (note === null) return
    setBusyId(row.id); setNotice('')
    try {
      const response = await adminFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_withdrawal',
          withdrawal_id: row.id,
          status: nextStatus,
          note,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'So‘rov yangilanmadi')
      setNotice(`So‘rov ${nextStatus === 'rejected' ? 'rad etildi' : nextStatus === 'paid' ? 'to‘landi deb belgilandi' : 'tasdiqlandi'}.`)
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'So‘rov yangilanmadi') }
    finally { setBusyId(null) }
  }

  if (loading) return <section className="panel finance-state"><LoaderCircle className="spin" size={28}/><strong>Moliyaviy ma’lumotlar yuklanmoqda...</strong><small>Server bilan xavfsiz bog‘lanilmoqda</small></section>
  if (error) return <section className="panel finance-state error"><AlertCircle size={28}/><strong>Ma’lumotlarni yuklab bo‘lmadi</strong><small>{error}</small><button className="primary" onClick={() => void load()}><RefreshCw size={15}/> Qayta urinish</button></section>

  if (view === 'Tranzaksiyalar') return <section className="panel finance">
    <div className="panel-head"><div><h2>Tranzaksiyalar va balanslar</h2><p>Platformadagi barcha moliyaviy harakatlar.</p></div><button className="range" onClick={() => void load()}><RefreshCw size={14}/> Yangilash</button></div>
    <div className="finance-summary"><article><WalletCards/><div><small>Tranzaksiyalar</small><strong>{transactions.length} ta</strong></div></article><article><CircleDollarSign/><div><small>Jami balans</small><strong>{money(balances.reduce((sum, item) => sum + Number(item.balans ?? item.balance ?? 0), 0))}</strong></div></article><article><CreditCard/><div><small>Balans hisoblari</small><strong>{balances.length} ta</strong></div></article></div>
    <h3>Oxirgi tranzaksiyalar</h3><div className="finance-table"><div className="finance-row finance-heading"><span>Foydalanuvchi</span><span>Turi</span><span>Vaqt</span><span>Summa</span></div>{filteredTransactions.length ? filteredTransactions.map(row => <div className="finance-row" key={row.id}><span><strong>{person(row)}</strong><small>{row.reference || row.note || '—'}</small></span><span>{label(row.kind)}</span><span>{date(row.created_at)}</span><span className={row.direction === 'debit' ? 'debit' : 'credit'}>{row.direction === 'debit' ? '−' : '+'}{money(row.amount)}</span></div>) : <Empty text="Qidiruvga mos tranzaksiya topilmadi."/>}</div>
    <h3>Foydalanuvchi balanslari</h3><div className="finance-table balances"><div className="finance-row finance-heading"><span>Foydalanuvchi</span><span>Telefon</span><span>Joriy balans</span></div>{balances.length ? balances.map((row, index) => <div className="finance-row" key={`${row.user__phone}-${index}`}><span><strong>{row.user__first_name || row.user?.first_name || 'Foydalanuvchi'}</strong></span><span>{row.user__phone || row.user?.phone || '—'}</span><span className="credit">{money(row.balans ?? row.balance)}</span></div>) : <Empty text="Balans hisoblari hali mavjud emas."/>}</div>
  </section>

  return <section className="panel finance">
    <div className="panel-head"><div><h2>Pul yechish so‘rovlari</h2><p>So‘rovlarni tekshiring, tasdiqlang yoki rad eting.</p></div><button className="range" onClick={() => void load()}><RefreshCw size={14}/> Yangilash</button></div>
    <div className="filter-row"><button onClick={() => setStatus(status === 'all' ? 'pending' : 'all')}>{status === 'all' ? 'Barcha holatlar' : 'Kutilmoqda'} <ChevronDown size={14}/></button><span>{filteredWithdrawals.length} ta natija</span></div>{notice && <p className="finance-notice"><Check size={15}/>{notice}</p>}
    <div className="finance-table withdrawals"><div className="finance-row finance-heading"><span>Agent</span><span>Karta</span><span>Summa</span><span>Holat</span><span>Amal</span></div>{filteredWithdrawals.length ? filteredWithdrawals.map(row => <div className="finance-row" key={row.id}><span><strong>{person(row)}</strong><small>{date(row.created_at)}</small></span><span><strong>{row.card_holder || 'Karta egasi kiritilmagan'}</strong><small>{row.card_number}</small></span><span>{money(row.amount)}</span><span><i className={`finance-status ${row.status}`}>{({ pending: 'Kutilmoqda', approved: 'Tasdiqlangan', paid: 'To‘langan', rejected: 'Rad etilgan' } as Record<string, string>)[row.status] || row.status}</i></span><span>{row.status === 'pending' ? <div className="review-actions"><button title="Tasdiqlash" className="approve" disabled={busyId === row.id} onClick={() => void review(row, 'approved')}><Check size={16}/></button><button title="Rad etish" className="reject" disabled={busyId === row.id} onClick={() => void review(row, 'rejected')}><X size={16}/></button></div> : row.status === 'approved' ? <button className="paid-button" disabled={busyId === row.id} onClick={() => void review(row, 'paid')}><Check size={14}/> To‘landi</button> : <small>{row.reviewed_by__first_name ? `${row.reviewed_by__first_name} ko‘rdi` : 'Yakunlangan'}</small>}</span></div>) : <Empty text="Tanlangan holat bo‘yicha so‘rovlar yo‘q."/>}</div>
  </section>
}

function Empty({ text }: { text: string }) { return <div className="finance-empty"><XCircle size={22}/><span>{text}</span></div> }
