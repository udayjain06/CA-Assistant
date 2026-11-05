'use client'
import { useState } from 'react'

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Item = { id: number; desc: string; hsn: string; qty: string; rate: string; gst: string }

const toWords = (n: number) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  if (n === 0) return 'Zero'
  const num = Math.floor(n)
  const convert = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }
  return convert(num) + ' Rupees Only'
}

export default function InvoicePage() {
  const [seller, setSeller] = useState({ name: '', gstin: '', address: '', state: 'Delhi', phone: '', email: '' })
  const [buyer, setBuyer]   = useState({ name: '', gstin: '', address: '', state: 'Delhi' })
  const [invoiceNo, setInvoiceNo] = useState('INV-2026-001')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems]   = useState<Item[]>([{ id: 1, desc: '', hsn: '', qty: '1', rate: '', gst: '18' }])
  const [notes, setNotes]   = useState('')
  const [preview, setPreview] = useState(false)

  const addItem = () => setItems(i => [...i, { id: Date.now(), desc: '', hsn: '', qty: '1', rate: '', gst: '18' }])
  const updItem = (id: number, f: string, v: string) => setItems(i => i.map(x => x.id === id ? { ...x, [f]: v } : x))
  const delItem = (id: number) => setItems(i => i.filter(x => x.id !== id))

  const isInterState = seller.state !== buyer.state

  const calcItem = (item: Item) => {
    const qty = Number(item.qty) || 0
    const rate = Number(item.rate) || 0
    const gstRate = Number(item.gst) || 0
    const taxable = qty * rate
    const gstAmt = taxable * gstRate / 100
    return { taxable, gstAmt, total: taxable + gstAmt, gstRate }
  }

  const totalTaxable = items.reduce((s, i) => s + calcItem(i).taxable, 0)
  const totalGST     = items.reduce((s, i) => s + calcItem(i).gstAmt, 0)
  const grandTotal   = totalTaxable + totalGST

  const S = {
    card:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 } as React.CSSProperties,
    btn:   { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
    inp:   { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' } as React.CSSProperties,
    label: { fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 } as React.CSSProperties,
  }

  if (preview) return (
    <div className="page-container">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="pressable" style={S.ghost} onClick={() => setPreview(false)}>← Edit</button>
        <button className="pressable" style={S.btn} onClick={() => window.print()}>🖨️ Print / Download PDF</button>
      </div>

      {/* INVOICE WRAPPER FOR HORIZONTAL SCROLL ON PHONE */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 16 }}>
        <div id="invoice" style={{ background: '#fff', color: '#111', borderRadius: 12, padding: 32, maxWidth: 800, minWidth: 640, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{seller.name || 'Your Business'}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4, whiteSpace: 'pre-line' }}>{seller.address}</div>
            {seller.phone && <div style={{ fontSize: 12, color: '#555' }}>📞 {seller.phone}</div>}
            {seller.email && <div style={{ fontSize: 12, color: '#555' }}>✉️ {seller.email}</div>}
            {seller.gstin && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>GSTIN: {seller.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4F6EF7' }}>TAX INVOICE</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Invoice No: <b>{invoiceNo}</b></div>
            <div style={{ fontSize: 13 }}>Date: <b>{invoiceDate}</b></div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>BILL TO</div>
          <div style={{ fontWeight: 600 }}>{buyer.name || 'Customer Name'}</div>
          <div style={{ fontSize: 12, color: '#555', whiteSpace: 'pre-line' }}>{buyer.address}</div>
          {buyer.gstin && <div style={{ fontSize: 12, marginTop: 4 }}>GSTIN: <b>{buyer.gstin}</b></div>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#4F6EF7', color: '#fff' }}>
              {['#', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'GST%', 'GST Amt', 'Total'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' || h === 'Qty' ? 'center' : 'right', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const c = calcItem(item)
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.desc}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{item.hsn}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>{item.qty}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{inr(Number(item.rate))}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{inr(c.taxable)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{item.gst}%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{inr(c.gstAmt)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{inr(c.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            {[
              { l: 'Taxable amount', v: inr(totalTaxable) },
              isInterState
                ? { l: 'IGST', v: inr(totalGST) }
                : { l: `CGST + SGST`, v: `${inr(totalGST / 2)} + ${inr(totalGST / 2)}` },
              { l: 'Grand Total', v: inr(grandTotal), bold: true },
            ].map(({ l, v, bold }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ fontSize: 13, color: bold ? '#111' : '#555', fontWeight: bold ? 700 : 400 }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: bold ? '#4F6EF7' : '#111' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, background: '#f0f4ff', borderRadius: 8, padding: 12, fontSize: 12, color: '#555' }}>
          Amount in words: <b style={{ color: '#111' }}>{toWords(Math.round(grandTotal))}</b>
        </div>

        {notes && <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}><b>Notes:</b> {notes}</div>}

        <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', flexWrap: 'wrap', gap: 8 }}>
          <div>This is a computer generated invoice</div>
          <div>Seller State: {seller.state} | Buyer State: {buyer.state} | Supply type: {isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}</div>
        </div>
      </div>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ marginBottom: 0 }}>GST Invoice Generator</h1>
        <button className="pressable" style={S.btn} onClick={() => setPreview(true)}>👁 Preview Invoice</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Seller */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🏢 Your business (Seller)</div>
          {[
            { key: 'name', label: 'Business name*', placeholder: 'ABC Pvt Ltd' },
            { key: 'gstin', label: 'GSTIN*', placeholder: '07AABCU9603R1ZV' },
            { key: 'address', label: 'Address', placeholder: '123, Street, City - 110001' },
            { key: 'phone', label: 'Phone', placeholder: '9876543210' },
            { key: 'email', label: 'Email', placeholder: 'info@abc.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <label style={S.label}>{label}</label>
              <input style={S.inp} value={seller[key as keyof typeof seller]} onChange={e => setSeller(s => ({ ...s, [key]: e.target.value }))} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label style={S.label}>State</label>
            <select style={S.inp} value={seller.state} onChange={e => setSeller(s => ({ ...s, state: e.target.value }))}>
              {['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'West Bengal', 'Telangana', 'Haryana', 'Madhya Pradesh', 'Other'].map(st => <option key={st}>{st}</option>)}
            </select>
          </div>
        </div>

        {/* Buyer + Invoice details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>👤 Customer (Buyer)</div>
            {[
              { key: 'name', label: 'Customer name*', placeholder: 'XYZ Corp' },
              { key: 'gstin', label: 'GSTIN (if B2B)', placeholder: 'Optional for B2C' },
              { key: 'address', label: 'Address', placeholder: 'Customer address' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <label style={S.label}>{label}</label>
                <input style={S.inp} value={buyer[key as keyof typeof buyer]} onChange={e => setBuyer(b => ({ ...b, [key]: e.target.value }))} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label style={S.label}>State</label>
              <select style={S.inp} value={buyer.state} onChange={e => setBuyer(b => ({ ...b, state: e.target.value }))}>
                {['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'West Bengal', 'Telangana', 'Haryana', 'Madhya Pradesh', 'Other'].map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📄 Invoice details</div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Invoice number</label>
              <input style={S.inp} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Invoice date</label>
              <input style={S.inp} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            {isInterState && <div style={{ marginTop: 10, fontSize: 12, color: '#F59E0B', background: '#1f1500', padding: '8px 10px', borderRadius: 6 }}>⚡ Inter-state supply — IGST applicable</div>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Items / Services</div>
          <button className="pressable" style={S.ghost} onClick={addItem}>+ Add item</button>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
          <div style={{ minWidth: 520 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
              {['Description', 'HSN code', 'Qty', 'Rate (₹)', 'GST %', ''].map(h => (
                <div key={h} style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {items.map(item => {
              const c = calcItem(item)
              return (
                <div key={item.id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
                    <input style={S.inp} value={item.desc} onChange={e => updItem(item.id, 'desc', e.target.value)} placeholder="Service/product description" />
                    <input style={S.inp} value={item.hsn} onChange={e => updItem(item.id, 'hsn', e.target.value)} placeholder="998313" />
                    <input style={S.inp} type="number" value={item.qty} onChange={e => updItem(item.id, 'qty', e.target.value)} />
                    <input style={S.inp} type="number" value={item.rate} onChange={e => updItem(item.id, 'rate', e.target.value)} placeholder="10000" />
                    <select style={S.inp} value={item.gst} onChange={e => updItem(item.id, 'gst', e.target.value)}>
                      {['0', '5', '12', '18', '28'].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button className="pressable" onClick={() => delItem(item.id)} aria-label="Delete item" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, padding: 6 }}>×</button>
                    </div>
                  </div>
                  {item.rate && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, paddingLeft: 4 }}>
                    Taxable: {inr(c.taxable)} | GST: {inr(c.gstAmt)} | Total: <b style={{ color: 'var(--text)' }}>{inr(c.total)}</b>
                  </div>}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 14 }}>
            Taxable: {inr(totalTaxable)} | GST: {inr(totalGST)} | <b style={{ color: 'var(--accent)', fontSize: 16 }}>Total: {inr(grandTotal)}</b>
          </div>
        </div>
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        <label style={S.label}>Notes / Terms & conditions</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Payment due within 30 days. Bank details: ..."
          style={{ ...S.inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
      </div>

      <button className="pressable" style={{ ...S.btn, marginTop: 16 }} onClick={() => setPreview(true)}>👁 Preview & Print Invoice →</button>
    </div>
  )
}
