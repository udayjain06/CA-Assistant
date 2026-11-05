'use client'
import { useState } from 'react'
import IOSSheet from '@/components/ui/IOSSheet'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Doc = { id:number; name:string; type:string; text:string; extracted:any; status:'uploaded'|'analyzing'|'done' }

const DOC_TYPES = ['Form 16','Salary Slip','Bank Statement','Form 26AS','Invoice','GST Certificate','PAN Card','Other']

export default function DocsPage() {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Salary Slip')
  const [newText, setNewText] = useState('')
  const [viewing, setViewing] = useState<Doc|null>(null)
  const [uploadError, setUploadError] = useState('')

  const S = {
    card: {background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:20} as React.CSSProperties,
    btn:  {background:'var(--accent)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:500,cursor:'pointer'} as React.CSSProperties,
    ghost:{background:'transparent',color:'var(--muted)',border:'1px solid var(--border2)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer'} as React.CSSProperties,
    inp:  {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,outline:'none',width:'100%'} as React.CSSProperties,
    ta:   {background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:13,outline:'none',width:'100%',minHeight:180,resize:'vertical',fontFamily:'monospace'} as React.CSSProperties,
  }

  async function uploadDoc() {
    if (!newText.trim()) { setUploadError('Document text paste karo!'); return }
    setUploadError('')
    const doc: Doc = { id:Date.now(), name:newName||newType, type:newType, text:newText, extracted:null, status:'analyzing' }
    setDocs(d=>[doc,...d])
    setShowAdd(false); setNewName(''); setNewText('')

    try {
      const res = await fetch(`${API}/api/itr/extract-salary-slip`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:newText,age:28})
      })
      const data = await res.json()
      setDocs(d=>d.map(x=>x.id===doc.id?{...x,extracted:data,status:'done'}:x))
    } catch {
      // Basic local extraction
      const extracted: Record<string,string> = {}
      const amtMatch = newText.match(/(?:gross|total|net|basic|ctc)[:\s]+([₹]?[\d,]+)/gi)
      if (amtMatch) extracted['Detected amounts'] = amtMatch.join(', ')
      const panMatch = newText.match(/[A-Z]{5}\d{4}[A-Z]/g)
      if (panMatch) extracted['PAN'] = panMatch[0]
      setDocs(d=>d.map(x=>x.id===doc.id?{...x,extracted:{...extracted,note:'Connect backend for full AI extraction'},status:'done'}:x))
    }
  }

  const typeEmoji: Record<string,string> = {
    'Form 16':'📋','Salary Slip':'💰','Bank Statement':'🏦',
    'Form 26AS':'📊','Invoice':'🧾','GST Certificate':'📜','PAN Card':'🪪','Other':'📄'
  }

  return (
    <div className="page-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <h1 style={{marginBottom:0}}>Document Vault</h1>
        <button className="pressable" style={S.btn} onClick={()=>setShowAdd(true)}>+ Upload document</button>
      </div>

      {docs.length===0 && (
        <div style={{...S.card,textAlign:'center',padding:'40px 16px'}}>
          <div style={{fontSize:48,marginBottom:16}}>📂</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Koi document nahi abhi</div>
          <div style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>
            Form 16, salary slip, bank statement, Form 26AS — sab yahan store karo.<br/>AI automatically important data extract kar lega.
          </div>
          <button className="pressable" style={S.btn} onClick={()=>setShowAdd(true)}>+ Pehla document upload karo</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:16}}>
        {docs.map(doc=>(
          <div key={doc.id} className="module-card pressable" style={{...S.card,cursor:'pointer'}} onClick={()=>setViewing(doc)}>
            <div style={{fontSize:32,marginBottom:10}}>{typeEmoji[doc.type]||'📄'}</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{doc.name}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>{doc.type}</div>
            {doc.status==='analyzing' ? (
              <span style={{fontSize:12,color:'var(--amber)'}}>🤖 AI analyzing...</span>
            ) : (
              <span style={{fontSize:12,color:'var(--green)'}}>✅ Extracted</span>
            )}
          </div>
        ))}
      </div>

      {/* iOS Bottom Sheet: Upload Document */}
      <IOSSheet isOpen={showAdd} onClose={()=>setShowAdd(false)} title="📄 Upload Document">
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Document name (optional)</label>
              <input style={S.inp} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. June 2026 salary slip"/>
            </div>
            <div>
              <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>Document type</label>
              <select style={{...S.inp}} value={newType} onChange={e=>setNewType(e.target.value)}>
                {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label style={{fontSize:13,color:'var(--muted)',display:'block',marginBottom:6}}>
            Document text paste karo (PDF se Ctrl+A → Ctrl+C → yahan Ctrl+V)
          </label>
          <textarea style={S.ta} value={newText} onChange={e=>setNewText(e.target.value)}
            placeholder="Salary slip, Form 16, bank statement ka text yahan paste karo..."/>
          {uploadError && (
            <div role="alert" style={{ color:'var(--red)', fontSize:13, marginTop:8, padding:'6px 12px', background:'#1a0505', borderRadius:6, border:'1px solid #3d1010' }}>{uploadError}</div>
          )}
          <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap',justifyContent:'flex-end'}}>
            <button className="pressable" style={S.ghost} onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="pressable" style={S.btn} onClick={uploadDoc}>🤖 Upload & AI Extract</button>
          </div>
        </div>
      </IOSSheet>

      {/* iOS Bottom Sheet: View Document & AI Data */}
      <IOSSheet isOpen={Boolean(viewing)} onClose={()=>setViewing(null)} title={viewing ? `${typeEmoji[viewing.type]||'📄'} ${viewing.name}` : undefined}>
        {viewing && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:16}}>
            <div style={S.card}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Original text</div>
              <div style={{whiteSpace:'pre-wrap',fontSize:12,fontFamily:'monospace',color:'var(--muted)',background:'var(--surface)',borderRadius:8,padding:12,maxHeight:300,overflow:'auto'}}>
                {viewing.text}
              </div>
            </div>
            <div style={S.card}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>🤖 AI Extracted Data</div>
              {viewing.extracted ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(viewing.extracted).filter(([k])=>k!=='summary').map(([k,v])=>(
                    typeof v==='number'&&v>0 ? (
                      <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--surface)',borderRadius:6}}>
                        <span style={{fontSize:13,color:'var(--muted)',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</span>
                        <span style={{fontSize:13,fontWeight:500}}>₹{Math.round(Number(v)).toLocaleString('en-IN')}</span>
                      </div>
                    ) : typeof v==='string'&&v ? (
                      <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--surface)',borderRadius:6}}>
                        <span style={{fontSize:13,color:'var(--muted)',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</span>
                        <span style={{fontSize:13,fontWeight:500,maxWidth:200,textAlign:'right'}}>{String(v).slice(0,50)}</span>
                      </div>
                    ) : null
                  ))}
                  {viewing.extracted.summary && (
                    <div style={{background:'rgba(79,110,247,.1)',border:'1px solid rgba(79,110,247,.3)',borderRadius:8,padding:12,fontSize:13,marginTop:8}}>
                      {viewing.extracted.summary}
                    </div>
                  )}
                </div>
              ) : <div style={{color:'var(--muted)',fontSize:13}}>Analyzing...</div>}
            </div>
          </div>
        )}
      </IOSSheet>
    </div>
  )
}
