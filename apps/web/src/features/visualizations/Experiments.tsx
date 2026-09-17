import { useState, type ReactNode } from 'react'
import { AudioLines, FlaskConical, RotateCcw } from 'lucide-react'
import type { Step, Lesson } from '@rendered/shared'
import { SceneDiagram } from './SceneDiagram'

type Node = Step['scene']['nodes'][number]
type Status = NonNullable<Node['status']>
const node = (id: string, label: string, detail: string, status: Status = 'idle'): Node => ({id,label,detail,status})

function Lab({title,scene,mode,controls,result,children}: {
  title:string;scene:Step['scene'];mode:Lesson['mode'];controls:ReactNode;result:string;children?:ReactNode
}) {
  return <div className="rr-lab">
    <div className="rr-lab-title"><FlaskConical size={15}/>{title}</div>
    {children}
    <SceneDiagram scene={scene} mode={mode} label={title}/>
    <div className="rr-lab-actions">{controls}</div><p className="rr-lab-result" aria-live="polite">{result}</p>
  </div>
}

const initialClips = ['Kick', 'Snare', 'Hat']
function Reconciliation() {
  const [operation, setOperation] = useState<'Swap'|'Replace'|'Rename'>('Swap')
  const [stable, setStable] = useState(true)
  const clips = operation === 'Swap' ? ['Hat','Snare','Kick'] : operation === 'Replace' ? ['Kick','Clap','Hat'] : ['Kick','Snare','Open hat']
  const result = operation === 'Swap' ? (stable ? 'The draft follows Hat to the first position. All three row instances keep their state.' : 'The draft stays in slot 3. The row now displays Kick with Hat’s old draft.') :
    operation === 'Replace' ? (stable ? 'Snare unmounts. Clap gets a new row and new local state.' : 'Slot 2 keeps its old instance when Snare becomes Clap.') :
      'The same key and component type preserve the row. Its label changes to Open hat.'
  const oldNodes = initialClips.map((clip,i) => node('old'+i,clip,clip === 'Hat' ? 'draft: editing' : 'draft: empty', operation === 'Replace' && i === 1 && stable ? 'removed' : 'idle'))
  const newNodes = clips.map((clip,i) => {
    const original = !stable ? i : operation === 'Rename' ? i : initialClips.indexOf(clip)
    const status = original === -1 ? 'added' : (clip !== initialClips[original] ? 'active' : 'kept')
    return node('next'+i, clip, original === 2 ? 'draft: editing' : 'draft: empty',status)
  })
  return <div className="rr-lab">
    <div className="rr-lab-title"><FlaskConical size={15}/>Match two clip lists</div>
    <div className="rr-tree-pair">{[{label:'Before', nodes:oldNodes},{label:'After',nodes:newNodes}].map(group=>
      <div key={group.label}><small>{group.label}</small><SceneDiagram mode="tree" label={group.label+' clip tree'} scene={{
        nodes:[node('clips','ClipList',stable?'key = clip.id':'key = index','active'),...group.nodes],
        edges:group.nodes.map(n=>['clips',n.id])
      }}/></div>)}</div>
    <div className="rr-lab-actions">
      <label>Row key <select value={stable ? 'id' : 'index'} onChange={e=>setStable(e.target.value === 'id')}><option value="id">Clip ID</option><option value="index">Array index</option></select></label>
      {(['Swap','Replace','Rename'] as const).map(action => <button key={action} aria-pressed={operation===action} onClick={()=>setOperation(action)}>{action}</button>)}
    </div><p className="rr-lab-result" aria-live="polite">{result}</p>
  </div>
}

function Propagation(){
  const [solo,setSolo]=useState<string|null>(null)
  const [started,setStarted]=useState(false)
  const channels=['Lead','Bass']
  return <Lab title="Solo a mixer channel" mode="tree" scene={{nodes:[
    node('mixer','Mixer',`soloId: ${solo ?? 'null'}`, started?'active':'idle'),
    ...channels.map(ch=>node(ch,ch,solo===ch?'solo: true':'solo: false',started?'active':'idle'))],
    edges:channels.map(ch=>['mixer',ch])}}
    controls={channels.map(ch=><button key={ch} aria-pressed={solo===ch} onClick={()=>{setStarted(true);setSolo(solo===ch ? null : ch)}}>{'Solo '+ch}</button>)}
    result={started ? `The setter queues a render in Mixer. Both un-memoized channel children render with soloId = ${solo ?? 'null'}.` : 'Both channels read one selection from Mixer. Choose a channel to update their parent.'}/>
}

function Lifecycle(){
  const [mounted,setMounted]=useState(true)
  const [station,setStation]=useState('Jazz')
  const [previous,setPrevious]=useState<string|null>(null)
  const [change,setChange]=useState<'mount'|'switch'|'unmount'|'repeat'>('mount')
  const switchStation=()=>{setPrevious(station); setStation(station==='Jazz'?'Folk':'Jazz');setChange('switch')}
  const toggleMount=()=>{setPrevious(mounted ? station : null);setChange(mounted ? 'unmount' : 'mount');setMounted(!mounted)}
  const nodes:Node[] = change === 'unmount' ? [node('commit','Commit','remove player','active'),node('clean','Cleanup',`close ${previous}`,'removed')] :
    [node('render','Render',station,'active'),node('commit','Commit','update UI','kept'),
      ...(change==='switch' ? [node('clean','Cleanup',`close ${previous}`,'removed')] : []),
      node('setup',change==='repeat'?'Still connected':'Setup',`${change==='repeat'?'keep':'open'} ${station}`,change==='repeat'?'kept':'added')]
  return <Lab title="Reconnect a preview stream" mode="timeline" scene={{nodes,edges:nodes.slice(1).map((n,i)=>[nodes[i].id,n.id])}}
    controls={<><button disabled={!mounted} onClick={switchStation}>Change station</button><button disabled={!mounted} onClick={()=>setChange('repeat')}>Render again</button><button onClick={toggleMount}>{mounted?'Unmount':'Mount'} player</button></>}
    result={change==='switch'?`The cleanup closes ${previous} before setup connects to ${station}.`: change==='unmount'?'Removing the player runs the last cleanup. The stream is closed.':change==='repeat'?'The dependency stayed equal. This commit keeps the existing subscription.':`After the component commits, setup opens the ${station} stream. This model shows the production lifecycle.`}/>
}

function Composition(){
  const [transport,setTransport]=useState(false)
  const [caption,setCaption]=useState(false)
  const nodes=[node('frame','Frame','children slot','kept'),node('wave','Waveform','clip preview','kept'),
    ...(transport ? [node('transport','Transport','play controls','added')] : []),
    ...(caption ? [node('caption','Caption','clip title','added')] : [])]
  return <Lab title="Compose a clip preview" mode="tree" scene={{nodes,edges:nodes.slice(1).map(n=>['frame',n.id])}}
    controls={<><button aria-pressed={transport} onClick={()=>setTransport(!transport)}>{transport?'Remove':'Add'} transport</button><button aria-pressed={caption} onClick={()=>setCaption(!caption)}>{caption?'Remove':'Add'} caption</button></>}
    result={`Frame renders ${nodes.length-1} ${nodes.length===2?'child':'children'} supplied by the caller. Its own implementation stays the same.`}>
    <div className="rr-preview" aria-label="Composed clip preview"><AudioLines size={26}/>{transport && <span aria-label="transport preview">◀　▶　▶|</span>}{caption && <small>Tape loop 01</small>}</div>
  </Lab>
}

function Performance(){
  const [memo,setMemo]=useState(false)
  const [run,setRun]=useState({parent:0,chart:0,samples:1,why:'Choose a change and compare the render counts.'})
  function render(samplesChanged:boolean){
    const renders=samplesChanged || !memo
    setRun(last=>({parent:last.parent+1,chart:last.chart+Number(renders),samples:last.samples+Number(samplesChanged),
      why:samplesChanged?'New samples change the chart prop, so Spectrum renders.':memo?'The sample reference stayed equal. This model skips the chart render.':'A parent theme change renders this ordinary child with the same samples.'}))
  }
  return <Lab title="Compare a memoized chart" mode="tree" scene={{nodes:[
    node('panel','Editor',`${run.parent} updates`,'active'),node('list',memo?'memo(Spectrum)':'Spectrum',`${run.chart} render calls`,run.chart===run.parent?'active':'kept'),node('samples','Samples',`buffer ${run.samples}`,'idle')],edges:[['panel','list'],['samples','list']]}}
    controls={<><button aria-pressed={memo} onClick={()=>{setMemo(!memo);setRun({parent:0,chart:0,samples:1,why:'Counters reset for the new comparison.'})}}>Memo {memo?'on':'off'}</button><button onClick={()=>render(false)}>Change theme</button><button onClick={()=>render(true)}>New samples</button></>}
    result={run.why+' Counts model updates after mount. Use the React Profiler to measure a real chart.'}/>
}

type RequestState='idle'|'pending'|'fresh'|'refreshing'|'error'|'stale'|'refreshError'
function Fetching(){
  const [phase,setPhase]=useState<RequestState>('idle')
  const [hit,setHit]=useState(false)
  const requesting=phase==='pending'||phase==='refreshing'
  const cached=['fresh','stale','refreshing','refreshError'].includes(phase)
  function request(){
    setHit(phase==='fresh')
    if(phase!=='fresh')setPhase(cached?'refreshing':'pending')
  }
  const result:Record<RequestState,string>={
    idle:'The library has no data for this key. Open the collection to request it.',
    pending:'The first request is in flight. The list shows its loading state.',
    fresh:hit?'Another observer reads fresh cached data without starting a request.':'The response populated the cache. The list can display the clips.',
    refreshing:'The list keeps its cached clips while the new request runs.',
    error:'The first request failed. No cached list exists yet. Open the collection to retry.',
    stale:'The freshness window elapsed. A new observer can trigger a background refetch.',
    refreshError:'Refresh failed. The earlier data is still available, and the UI can report the refresh error.'}
  return <Lab title="Follow a collection query" mode="flow" scene={{nodes:[
    node('screen','Clip library',cached?'show cached clips':phase==='error'?'show error':requesting?'loading…':'empty',cached?'kept':'active'),
    node('cache','Query cache',cached?(phase==='fresh'?'fresh':'stale'):'no data',hit?'kept':cached?'added':'idle'),
    node('server','Server',requesting?'fetching…':phase==='error'||phase==='refreshError'?'failed':'ready',requesting?'active':phase==='error'||phase==='refreshError'?'removed':'idle')],
    edges:requesting?[['screen','cache'],['cache','server']]:cached?[['cache','screen']]:[]}}
    controls={<><button onClick={request} disabled={requesting}>Open collection</button>{requesting?<><button onClick={()=>setPhase('fresh')}>Resolve request</button><button onClick={()=>setPhase(cached?'refreshError':'error')}>Fail request</button></>:<button disabled={phase!=='fresh'} onClick={()=>{setPhase('stale');setHit(false)}}>Expire freshness</button>}</>}
    result={result[phase]}/>
}

const experiments: Record<string, () => ReactNode> = {
  'lists-and-keys': Reconciliation, 'lifting-state-up': Propagation, 'effect-lifecycle': Lifecycle,
  'component-composition':Composition, memoization:Performance, 'fetching-and-caching':Fetching
}
export function hasExperiment(slug:string){return Object.hasOwn(experiments,slug)}
export function Experiment({slug}:{slug:string}) {
  const [revision,setRevision]=useState(0)
  const LabView=experiments[slug]
  return <div className="rr-experiment"><LabView key={revision}/><button className="rr-reset" onClick={()=>setRevision(i=>i+1)}><RotateCcw size={13}/> Reset experiment</button></div>
}
