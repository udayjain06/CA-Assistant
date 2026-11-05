'use client'
import { useState } from 'react'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type Trade = { id: number; coin: string; buyPrice: string; sellPrice: string; qty: string; date: string; type: 'sell' | 'swap' | 'income' }

export default function CryptoPage() {
  const [trades, setTrades] = useState<Trade[]>([
    { id: 1, coin: 'Bitcoin', buyPrice: '4500000', sellPrice: '6000000', qty: '0.1', date: '2025-03-15', type: 'sell' },
  ])
  const [income, setIncome] = useState('')  // Mining/staking/airdrops

  const add = () => setTrades(t => [...t, { id: Date.now(), coin: '', buyPrice: '', sellPrice: '', qty: '1', date: new Date().toISOString().split('T')[0], type: 'sell' }])
  const upd = (id: number, f: string, v: string) => setTrades(t => t.map(x => x.id === id ? { ...x, [f]: v } : x))
  const del = (id: number) => setTrades(t => t.filter(x => x.id !== id))

  const calcTrade = (t: Trade) => {
    const qty = Number(t.qty) || 0
    const buy = Number(t.buyPrice) || 0
    const sell = Number(t.sellPrice) || 0
    const gain = (sell - buy) * qty
    const tax = gain > 0 ? gain * 0.30 : 0   // 30% flat, NO deductions except cost
    const cess = tax * 0.04
    const tds = sell * qty * 0.01             // 1% TDS on sale value
    return { gain, tax: tax + cess, tds, saleValue: sell * qty, costValue: buy * qty }
  }

  const results = trades.map(t => ({ ...t, ...calcTrade(t) }))
  const otherIncome = Number(income) || 0
  const totalGain = results.reduce((s, r) => s + Math.max(0, r.gain), 0)
  const totalLoss = results.reduce((s, r) => s + Math.min(0, r.gain), 0)
  const totalTax  = results.reduce((s, r) => s + r.tax, 0) + otherIncome * 0.30 * 1.04
  const totalTDS  = results.reduce((s, r) => s + r.tds, 0)

  const S = {
    card:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 } as React.CSSProperties,
    btn:   { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
    inp:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' } as React.CSSProperties,
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 8 }}>Crypto Tax Calculator</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>As per Section 115BBH — Crypto, NFT, Virtual Digital Assets (VDA)</p>

      {/* Rules banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '⚡', title: '30% flat tax', desc: 'No deductions except cost of acquisition. No loss set-off against other income.' },
          { icon: '🏦', title: '1% TDS (Sec 194S)', desc: 'Deducted on every sale above ₹50K/year (₹10K for specified persons).' },
          { icon: '❌', title: 'No loss carry forward', desc: 'Crypto losses CANNOT be set off against crypto gains or any other income.' },
        ].map(r => (
          <div key={r.title} style={{ background: '#1a0505', border: '1px solid #3d1010', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total gains', val: inr(totalGain), color: 'var(--green)' },
          { label: 'Total losses (ignored)', val: inr(Math.abs(totalLoss)), color: 'var(--red)' },
          { label: 'Tax @ 30% + cess', val: inr(totalTax), color: 'var(--red)' },
          { label: 'TDS deducted (1%)', val: inr(totalTDS), color: 'var(--amber)' },
        ].map(c => (
          <div key={c.label} style={S.card}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, letterSpacing: '-0.02em' }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Trades */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Crypto transactions</div>
          <button className="pressable" style={S.ghost} onClick={add}>+ Add transaction</button>
        </div>

        {trades.map(t => {
          const r = calcTrade(t)
          return (
            <div key={t.id} style={{ background: 'var(--surface)', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${r.gain < 0 ? 'var(--red)30' : 'var(--green)30'}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Coin/Token</div>
                  <input style={S.inp} value={t.coin} onChange={e => upd(t.id, 'coin', e.target.value)} placeholder="Bitcoin, ETH, USDT..." />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Type</div>
                  <select style={S.inp} value={t.type} onChange={e => upd(t.id, 'type', e.target.value as Trade['type'])}>
                    <option value="sell">Sell</option>
                    <option value="swap">Swap</option>
                    <option value="income">Income (mining/staking)</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Buy price/unit (₹)</div>
                  <input style={S.inp} type="number" value={t.buyPrice} onChange={e => upd(t.id, 'buyPrice', e.target.value)} placeholder="4500000" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Sell price/unit (₹)</div>
                  <input style={S.inp} type="number" value={t.sellPrice} onChange={e => upd(t.id, 'sellPrice', e.target.value)} placeholder="6000000" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Quantity</div>
                  <input style={S.inp} type="number" value={t.qty} onChange={e => upd(t.id, 'qty', e.target.value)} placeholder="0.1" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Date</div>
                  <input style={S.inp} type="date" value={t.date} onChange={e => upd(t.id, 'date', e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="pressable" onClick={() => del(t.id)} aria-label="Delete trade" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, paddingBottom: 6 }}>×</button>
                </div>
              </div>

              {(t.buyPrice && t.sellPrice) && (
                <div style={{ display: 'flex', gap: 20, fontSize: 12, flexWrap: 'wrap' }}>
                  <span>Sale value: <b>{inr(r.saleValue)}</b></span>
                  <span>Cost: <b>{inr(r.costValue)}</b></span>
                  <span style={{ color: r.gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {r.gain >= 0 ? 'Gain' : 'Loss'}: <b>{inr(Math.abs(r.gain))}</b>
                  </span>
                  {r.gain > 0 && <span style={{ color: 'var(--red)' }}>Tax (30%+cess): <b>{inr(r.tax)}</b></span>}
                  <span style={{ color: 'var(--amber)' }}>TDS (1%): <b>{inr(r.tds)}</b></span>
                  {r.gain < 0 && <span style={{ color: 'var(--amber)' }}>⚠️ Loss cannot be set off</span>}
                </div>
              )}
            </div>
          )
        })}

        {/* Mining/staking income */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mining / Staking / Airdrop income (if any)</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input style={{ ...S.inp, maxWidth: 200 }} type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="₹ total amount" />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>This is also taxed at 30% flat</span>
            {income && <span style={{ fontSize: 13, color: '#EF4444' }}>Tax: <b>{inr(Number(income) * 0.312)}</b></span>}
          </div>
        </div>
      </div>

      {/* Schedule VDA info */}
      <div style={{ ...S.card, marginTop: 16, background: 'rgba(79,110,247,.05)', border: '1px solid rgba(79,110,247,.3)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📋 How to report in ITR</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
          <div>1. ITR-2 ya ITR-3 mein <b style={{ color: 'var(--text)' }}>Schedule VDA</b> fill karo</div>
          <div>2. Har transaction separately enter karo — coin name, buy date, sell date, amount</div>
          <div>3. TDS jo kat gayi (Form 26AS mein dikh rahi hogi) woh claim karo</div>
          <div>4. Losses <b style={{ color: 'var(--text)' }}>set-off nahi ho sakti</b> — har gain pe alag 30% tax</div>
          <div>5. Foreign exchange mein crypto rakha hai toh <b style={{ color: 'var(--text)' }}>Schedule FA</b> bhi fill karo</div>
        </div>
        {totalTDS > 0 && (
          <div style={{ marginTop: 12, background: '#052713', border: '1px solid #0a4020', borderRadius: 8, padding: 12, fontSize: 13 }}>
            💰 TDS credit: Tumhara {inr(totalTDS)} TDS already kat gaya — yeh tax mein se minus hoga. Net tax payable: <b style={{ color: '#22C55E' }}>{inr(Math.max(0, totalTax - totalTDS))}</b>
          </div>
        )}
      </div>
    </div>
  )
}
