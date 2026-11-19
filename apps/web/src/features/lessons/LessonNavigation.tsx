import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Search, Clock3 } from 'lucide-react'
import type { Lesson, LessonSummary, Progress, Track } from '@rendered/shared'

export function LessonNavigation({
  tracks,
  lessons,
  lesson,
  progress,
  onNavigate,
}: {
  tracks: Track[]
  lessons: LessonSummary[]
  lesson: Lesson
  progress: Progress[]
  onNavigate: () => void
}) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([lesson.trackId])
  const query = search.toLocaleLowerCase().trim()
  const filtered = lessons.filter((item) => item.title.toLocaleLowerCase().includes(query))
  return (
    <nav aria-label="Lesson navigation" className="rr-sidebar">
      <Link to="/curriculum" className="rr-nav-heading">
        Course contents
      </Link>
      <label className="rr-nav-search">
        <Search size={15} />
        <input
          type="search"
          aria-label="Find a lesson by title"
          placeholder="Find a lesson…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {tracks.map((track) => {
        const children = filtered.filter((item) => item.trackId === track.id)
        if (!children.length) return null
        const open = Boolean(query) || expanded.includes(track.id)
        return (
          <div className="rr-nav-track" key={track.id}>
            <button
              aria-expanded={open}
              onClick={() =>
                setExpanded(
                  open ? expanded.filter((id) => id !== track.id) : [...expanded, track.id],
                )
              }
            >
              {track.title}
              <ChevronDown size={14} style={{ rotate: open ? '180deg' : '0deg' }} />
            </button>
            {open && (
              <ul>
                {children.map((item) => {
                  const row = progress.find((p) => p.lessonId === item.slug)
                  const active = lesson.slug === item.slug
                  return (
                    <li key={item.slug}>
                      <Link
                        to={'/lessons/' + item.slug}
                        aria-current={active ? 'page' : undefined}
                        onClick={onNavigate}
                      >
                        {item.title}
                        {row && (
                          <>
                            {row.completed ? (
                              <Check size={13} aria-hidden="true" />
                            ) : (
                              <Clock3 size={13} aria-hidden="true" />
                            )}
                            <span className="rr-sr">
                              {row.completed ? ', completed' : ', in progress'}
                            </span>
                          </>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
      {!filtered.length && <p className="rr-no-results">No lesson titles match your search.</p>}
    </nav>
  )
}
