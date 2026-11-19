import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronDown, ArrowRight, Check, BookOpen, SlidersHorizontal } from 'lucide-react'
import { motion } from 'motion/react'
import type { LessonSummary } from '@rendered/shared/contracts/catalog'
import type { Progress } from '@rendered/shared/contracts/progress'
import { useTracks, useLessons } from './queries'
import { useProgress } from '../progress/queries'
import { useSession } from '../account/session'
import { TrackArt, trackPaper } from '../../components/Illustrations'
import './catalog.css'

export function matchesLesson(
  lesson: LessonSummary,
  query: string,
  status: string,
  record?: Progress,
) {
  const text = (lesson.title + ' ' + lesson.objective).toLowerCase()
  return (
    text.includes(query.trim().toLowerCase()) &&
    (status === 'all' ||
      (status === 'complete'
        ? record?.completed
        : status === 'started'
          ? record && !record.completed
          : !record))
  )
}
export default function Curriculum() {
  const [params, setParams] = useSearchParams(),
    track = params.get('track') ?? ''
  const [query, setQuery] = useState(''),
    [difficulty, setDifficulty] = useState('all'),
    [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const topics = useTracks(),
    catalog = useLessons(),
    progress = useProgress()
  const session = useSession()
  const records = session.isSuccess && progress.isSuccess ? progress.data : undefined
  const completionFilter = records ? status : 'all'
  const reset = () => {
    setParams({})
    setQuery('')
    setDifficulty('all')
    setStatus('all')
    setExpanded({})
  }
  const filtered = (topics.data ?? [])
    .filter(
      (t) => (!track || t.id === track) && (difficulty === 'all' || t.difficulty === difficulty),
    )
    .map((t) => ({
      t,
      rows: (catalog.data ?? []).filter(
        (l) =>
          l.trackId === t.id &&
          matchesLesson(
            l,
            query,
            completionFilter,
            records?.find((r) => r.lessonId === l.slug),
          ),
      ),
    }))
    .filter((t) => t.rows.length)
  const queries = [topics, catalog]
  return (
    <div className="wrap catalog-page">
      <div className="page-title">
        <h1 className="display-heading">
          The curriculum<span>.</span>
        </h1>
        <p>
          New to React? Start with React Fundamentals. Each track has four lessons you can take in
          order or on their own.
        </p>
      </div>
      <div className="filters">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Find a lesson"
            placeholder="Find a lesson…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <SlidersHorizontal size={17} aria-hidden="true" />
        <select
          aria-label="Subject"
          value={track}
          onChange={(e) => {
            setParams(e.target.value ? { track: e.target.value } : {})
          }}
        >
          <option value="">All subjects</option>
          {topics.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="all">Any difficulty</option>
          {['Beginner', 'Intermediate', 'Advanced'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Completion status"
          value={completionFilter}
          disabled={!records}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Any status</option>
          <option value="new">Not started</option>
          <option value="started">In progress</option>
          <option value="complete">Completed</option>
        </select>
      </div>
      {(session.isError || progress.isError) && (
        <p className="notice" role="status">
          Your saved progress couldn’t load.{' '}
          <button
            className="text-link"
            onClick={() => void (session.isError ? session.refetch() : progress.refetch())}
          >
            Try again
          </button>
        </p>
      )}
      {queries.some((q) => q.isError) ? (
        <div className="notice">
          We couldn’t load the curriculum.{' '}
          <button onClick={() => queries.forEach((q) => void q.refetch())}>Try again</button>
        </div>
      ) : queries.some((q) => q.isPending) ? (
        <div className="skeleton" role="status" aria-label="Loading curriculum" />
      ) : filtered.length ? (
        <div className="catalog-list">
          {filtered.map(({ t, rows }) => {
            const all = catalog.data!.filter((l) => l.trackId === t.id),
              done = all.filter((l) =>
                records?.some((r) => r.lessonId === l.slug && r.completed),
              ).length
            const opened =
              expanded[t.id] ??
              (!!track || !!query.trim() || status !== 'all' || t.id === topics.data?.[0].id)
            return (
              <section className="catalog-track" key={t.id}>
                <h2>
                  <button
                    className="track-toggle"
                    aria-expanded={opened}
                    aria-controls={'list-' + t.id}
                    onClick={() => setExpanded({ ...expanded, [t.id]: !opened })}
                  >
                    <span className="catalog-icon" style={{ backgroundColor: trackPaper(t.id) }}>
                      <TrackArt id={t.id} />
                    </span>
                    <span className="catalog-heading">
                      <small>
                        {t.difficulty}, {all.length} lessons
                      </small>
                      <strong>{t.title}</strong>
                      <span>{t.description}</span>
                    </span>
                    {records && (
                      <span className="completion">
                        {done}/{all.length} complete
                        <progress value={done} max={all.length} />
                      </span>
                    )}
                    <ChevronDown size={19} className={opened ? 'up' : ''} />
                  </button>
                </h2>
                {opened && (
                  <motion.ol
                    id={'list-' + t.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {rows.map((l) => {
                      const record = records?.find((r) => r.lessonId === l.slug)
                      return (
                        <li key={l.slug}>
                          <Link to={'/lessons/' + l.slug}>
                            <span>{l.title}</span>
                            <small>
                              {record?.completed && <Check size={15} aria-hidden="true" />}
                              {record?.completed
                                ? 'Complete'
                                : record
                                  ? 'In progress'
                                  : l.stepCount + ' steps'}
                            </small>
                            <ArrowRight size={15} />
                          </Link>
                        </li>
                      )
                    })}
                  </motion.ol>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="empty">
          <BookOpen />
          <h2>No matching lessons</h2>
          <p>Try a different search or clear the filters to see every lesson.</p>
          <button className="btn" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
