import {Link} from 'react-router-dom'
import {ArrowRight,BookOpen,Bookmark,Compass,Layers3,Check} from 'lucide-react'
import type {LessonSummary} from '@rendered/shared'
import {useBookmarks,useProgress,useLessons,useTracks} from '../../lib/api'
import {TrackArt,trackPaper} from '../../components/Illustrations'
function ReadingList({title,rows,empty}:{title:string;rows:LessonSummary[];empty:string}){
 return <section className="reading-list"><h2>{title}</h2>{rows.length?<ul>{rows.map(r=><li key={r.slug}><Link to={'/lessons/'+r.slug}><BookOpen size={16}/><span>{r.title}</span><ArrowRight size={15}/></Link></li>)}</ul>:<p>{empty}</p>}</section>
}
export default function ProgressPage(){
 const catalog=useLessons(),tracks=useTracks(),visits=useProgress(),marks=useBookmarks()
 const queries=[catalog,tracks,visits,marks]
 if(queries.some(q=>q.isError))return <div className="wrap notice">Progress is unavailable. <button onClick={()=>queries.forEach(q=>void q.refetch())}>Try again</button></div>
 if(!catalog.data||!tracks.data||!visits.data||!marks.data)return <div className="wrap skeleton" aria-label="Loading progress" role="status"/>
 const lessons=catalog.data,bySlug=new Map(lessons.map(l=>[l.slug,l])),progress=visits.data,completed=new Set(progress.filter(r=>r.completed).map(r=>r.lessonId))
 const recent=progress.flatMap(r=>bySlug.get(r.lessonId)??[]),resume=recent.find(l=>!completed.has(l.slug))
 const suggested=resume??lessons.find(l=>!completed.has(l.slug))
 const percent=lessons.length?Math.round(completed.size*100/lessons.length):0
 const active=tracks.data.map(t=>({t,all:lessons.filter(l=>l.trackId===t.id)})).filter(({all})=>all.some(l=>progress.some(p=>p.lessonId===l.slug))&&all.some(l=>!completed.has(l.slug)))
 return <div className="wrap progress-page"><div className="page-title"><div className="kicker"><span className="bar"/>YOUR FIELD NOTES</div><h1 className="serif">My progress<span>.</span></h1><p>Your lessons, bookmarks, and next steps.</p></div>
 <div className="progress-cards"><article><Check size={19}/><strong>{completed.size}<small> / {lessons.length}</small></strong><span>Lessons completed</span></article><article><Compass size={19}/><strong>{percent}%</strong><span>Overall completion</span><progress aria-label="Overall completion" value={percent} max={100}/></article><article><Bookmark size={19}/><strong>{marks.data.length}</strong><span>Bookmarked lessons</span></article></div>
 {suggested&&<div className="next-read"><div><div className="kicker">{resume?'CONTINUE LEARNING':'SUGGESTED NEXT LESSON'}</div><h2>{suggested.title}</h2><p>{suggested.objective}</p><Link className="btn primary" to={'/lessons/'+suggested.slug}>{resume?'Resume lesson':'Start lesson'}<ArrowRight size={16}/></Link></div><div className="next-art" style={{background:trackPaper(suggested.trackId)}}><TrackArt id={suggested.trackId}/></div></div>}
 <div className="desk-grid"><ReadingList title="Recently visited" rows={recent} empty="Open a lesson and it will appear here."/><ReadingList title="Bookmarks" rows={marks.data.flatMap(id=>bySlug.get(id)??[])} empty="Save a lesson with the bookmark button in its player."/></div>
 <section className="reading-list"><h2>Tracks in progress</h2>{!active.length?<p>Tracks appear here while you work through their lessons.</p>:active.map(({t,all})=><Link className="active-track" to={'/curriculum?track='+t.id} key={t.id}><Layers3 size={17}/>{t.title}<span>{all.filter(l=>completed.has(l.slug)).length} / {all.length} complete</span><ArrowRight size={15}/></Link>)}</section></div>
}
