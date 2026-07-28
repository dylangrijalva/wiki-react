import { useEffect, useRef, useState } from 'react'
import { Search, CornerDownLeft, X, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLessons, useSearch } from '../../lib/api'

export default function Palette({close}:{close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const input=useRef<HTMLInputElement>(null)
 const [term,setTerm]=useState(''),[active,setActive]=useState(0)
 const list=useLessons(),search=useSearch(term.trim())
 const result=term.trim()?search:list
 const rows=(result.data??[]).slice(0,12)
 const navigate=useNavigate()
 const go=(slug:string)=>{close();navigate('/lessons/'+slug)}
 useEffect(()=>{const el=dialog.current;el?.showModal();input.current?.focus();return ()=>el?.close()},[])
 return <dialog className="palette" ref={dialog} aria-labelledby="palette-title" onCancel={close} onClick={e=>{if(e.target===dialog.current)close()}}
 onKeyDown={e=>{if(!rows.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=(active+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length;setActive(next);dialog.current?.querySelector('#match-'+next)?.scrollIntoView({block:'nearest'})}else if(e.key==='Enter'&&e.target===input.current){e.preventDefault();go(rows[Math.min(active,rows.length-1)].slug)}}}>
 <div className="palette-inner"><div className="palette-bar"><Search size={19}/><h2 id="palette-title" className="sr-only">Search lessons</h2><input ref={input} aria-label="Search lessons" placeholder="Search lessons and concepts…" value={term} onChange={e=>{setTerm(e.target.value);setActive(0)}}/><button onClick={close} aria-label="Close search"><X size={18}/></button></div>
 <p className="kicker">{term?'Matching lessons':'Browse lessons'}</p>
 <div className="matches">{rows.map((r,i)=><button id={'match-'+i} className={i===active?'selected':''} key={r.slug} onFocus={()=>setActive(i)} onClick={()=>go(r.slug)}><BookOpen size={16}/><span>{r.title}</span><CornerDownLeft size={14}/></button>)}{!rows.length&&<p>{result.isPending?'Searching…':result.isError?'Search is unavailable. Try again.':'No lessons match this search.'}</p>}</div>
 <div className="palette-foot mono">↑ ↓ to browse · Enter to open · Esc to close</div></div></dialog>
}
