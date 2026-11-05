'use client'
import { useState } from 'react'
import IOSSheet from '@/components/ui/IOSSheet'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type AssetType = 'equity' | 'debt_mf' | 'property' | 'gold'
type Entry = { id: number; name: string; buy: string; sell: string; buyDate: string; sellDate: string; asset: AssetType }

function monthsDiff(d1: string, d2: string) {
  const a = new Date(d1), b = new Date(d2)
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()
}

function calcGain(e: Entry) {
  const buy = Number(e.buy) || 0
  const sell = Number(e.sell) || 0
  const gain = sell - buy
  const months = e.buyDate && e.sellDate ? monthsDiff(e.buyDate, e.sellDate) : 0

  let isLT = false, taxRate = 0, label = '', stcgRate = 0

  if (e.asset === 'equity') {
    isLT = months >= 12
    stcgRate = 20 // STCG 20% from July 2024
    taxRate = isLT ? (gain > 125000 ? 12.5 : 0) : 20
    label = isLT ? 'LTCG (12.5% above ₹1.25L)' : 'STCG (20%)'
  } else if (e.asset === 'debt_mf') {
    isLT = false // All debt MF gains taxed as per slab post Apr 2023
    taxRate = 30 // Approximate highest slab
    label = 'As per income slab (post Apr 2023)'
  } else if (e.asset === 'property') {
    isLT = months >= 24
    taxRate = isLT ? 12.5 : 30 // LTCG 12.5% (no indexation from 2024 budget) or slab
    label = isLT ? 'LTCG (12.5%, no indexation)' : 'STCG (as per slab ~30%)'
  } else if (e.asset === 'gold') {
    isLT = months >= 36
    taxRate = isLT ? 12.5 : 30
    label = isLT ? 'LTCG (12.5%)' : 'STCG (as per slab)'
  }

  const taxableGain = e.asset === 'equity' && isLT ? Math.max(0, gain - 125000) : gain
  const tax = gain > 0 ? Math.max(0, taxableGain * taxRate / 100) : 0
  const cess = tax * 0.04
  return { gain, months, isLT, taxRate, label, tax: tax + cess, taxableGain }
}

const ASSET_LABELS: Record<AssetType, string> = {
  equity: '📈 Stocks / Equity MF',
  debt_mf: '🏦 Debt MF / Bonds',
  property: '🏠 Property',
  gold: '🥇 Gold / SGB',
}

export default function CapitalGainsPage() {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, name: 'Reliance Industries', buy: '100000', sell: '150000', buyDate: '2023-01-15', sellDate: '2024-06-10', asset: 'equity' },
  ])
  const [showInfo, setShowInfo] = useState(false)

  const add = () => setEntries(e => [...e, { id: Date.now(), name: '', buy: '', sell: '', buyDate: '', sellDate: '', asset: 'equity' }])
  const upd = (id: number, f: string, v: string) => setEntries(e => e.map(x => x.id === id ? { ...x, [f]: v } : x))
  const del = (id: number) => setEntries(e => e.filter(x => x.id !== id))

  const results = entries.map(e => ({ ...e, ...calcGain(e) }))
  const totalGain = results.reduce((s, r) => s + r.gain, 0)
  const totalTax  = results.reduce((s, r) => s + r.tax, 0)
  const stcgTotal = results.filter(r => !r.isLT).reduce((s, r) => s + r.gain, 0)
  const ltcgTotal = results.filter(r => r.isLT).reduce((s, r) => s + r.gain, 0)

  const S = {
    card:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 } as React.CSSProperties,
    btn:   { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
    inp:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' } as React.CSSProperties,
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ marginBottom: 0 }}>Capital Gains Calculator</h1>
        <button className="pressable" style={S.ghost} onClick={() => setShowInfo(!showInfo)}>ℹ️ Tax rates</button>
      </div>

      {/* iOS Bottom Sheet: Tax Rates Info */}
      <IOSSheet isOpen={showInfo} onClose={() => setShowInfo(false)} title="ℹ️ Capital Gains Tax Rates">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { asset: '📈 Equity/MF', stcg: '20% (< 1 yr)', ltcg: '12.5% above ₹1.25L (> 1 yr)' },
            { asset: '🏦 Debt MF', stcg: 'As per slab', ltcg: 'As per slab (post Apr 2023)' },
            { asset: '🏠 Property', stcg: 'As per slab (< 2 yr)', ltcg: '12.5% no indexation (> 2 yr)' },
            { asset: '🥇 Gold', stcg: 'As per slab (< 3 yr)', ltcg: '12.5% (> 3 yr)' },
          ].map(r => (
            <div key={r.asset} style={{ background: 'var(--surface)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{r.asset}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>STCG: {r.stcg}</div>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>LTCG: {r.ltcg}</div>
            </div>
          ))}
        </div>
      </IOSSheet>

      {/* Summary */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total gains', val: inr(totalGain), color: totalGain >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'STCG', val: inr(stcgTotal), color: 'var(--text)' },
            { label: 'LTCG', val: inr(ltcgTotal), color: 'var(--text)' },
            { label: 'Estimated tax', val: inr(totalTax), color: 'var(--red)' },
          ].map(c => (
            <div key={c.label} style={S.card}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, letterSpacing: '-0.02em' }}>{c.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Entries */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Your transactions</div>
          <button className="pressable" style={S.ghost} onClick={add}>+ Add transaction</button>
        </div>

        {entries.map((e, i) => {
          const r = results[i]
          return (
            <div key={e.id} style={{ background: 'var(--surface)', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${r.gain < 0 ? 'var(--red)' : 'var(--green)'}30` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Asset name</div>
                  <input style={S.inp} value={e.name} onChange={ev => upd(e.id, 'name', ev.target.value)} placeholder="e.g. Reliance, MF name" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Asset type</div>
                  <select style={S.inp} value={e.asset} onChange={ev => upd(e.id, 'asset', ev.target.value as AssetType)}>
                    {Object.entries(ASSET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Buy price (₹)</div>
                  <input style={S.inp} type="number" value={e.buy} onChange={ev => upd(e.id, 'buy', ev.target.value)} placeholder="100000" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Sell price (₹)</div>
                  <input style={S.inp} type="number" value={e.sell} onChange={ev => upd(e.id, 'sell', ev.target.value)} placeholder="150000" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Buy date</div>
                  <input style={S.inp} type="date" value={e.buyDate} onChange={ev => upd(e.id, 'buyDate', ev.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Sell date</div>
                  <input style={S.inp} type="date" value={e.sellDate} onChange={ev => upd(e.id, 'sellDate', ev.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="pressable" onClick={() => del(e.id)} aria-label="Delete transaction" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 20, paddingBottom: 6 }}>×</button>
                </div>
              </div>

              {(e.buy && e.sell) && (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                  <span>Holding: <b>{r.months} months</b></span>
                  <span style={{ color: r.isLT ? 'var(--green)' : 'var(--amber)' }}>{r.isLT ? '✅ Long term' : '⚡ Short term'}</span>
                  <span>Gain: <b style={{ color: r.gain >= 0 ? 'var(--green)' : 'var(--red)' }}>{inr(r.gain)}</b></span>
                  <span>Tax type: <b>{r.label}</b></span>
                  <span>Est. tax: <b style={{ color: 'var(--red)' }}>{inr(r.tax)}</b></span>
                </div>
              )}
            </div>
          )
        })}

        {entries.length > 1 && totalTax > 0 && (
          <div style={{ background: '#1a0505', border: '1px solid #3d1010', borderRadius: 10, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 6 }}>
              💡 Tax loss harvesting tip
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Agar koi stock/MF loss mein hai toh usse sell karo — yeh loss tumhara gain offset kar dega aur tax kam hoga. Same day ya 30 days baad re-buy kar sakte ho.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
