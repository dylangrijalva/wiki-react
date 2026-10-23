import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Lesson, LessonSummary, Progress, Track } from '@rendered/shared'
import {
  useBookmark,
  useBookmarks,
  useLesson,
  useLessons,
  useProgress,
  useSaveProgress,
  useTracks,
} from '../../lib/api'
import { Walkthrough } from './Walkthrough'
import { LessonNotes, KnowledgeCheck } from './LessonNotes'
import { LessonNavigation } from './LessonNavigation'
import './lesson.css'

function Studio({
  lesson,
  lessons,
  tracks,
  progress,
}: {
  lesson: Lesson
  lessons: LessonSummary[]
  tracks: Track[]
  progress: Progress[]
}) {
  const saved = progress.find((row) => row.lessonId === lesson.slug)
  const [index, setIndex] = useState(() => Math.min(saved?.step ?? 0, lesson.steps.length - 1))
  const [check, setCheck] = useState(false)
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1100)
  const reduced = useReducedMotion()
  const {
    mutate: save,
    isError: saveError,
    isPending: saving,
    variables: failedWrite,
  } = useSaveProgress()
  const bookmarks = useBookmarks(),
    bookmark = useBookmark()
  const bookmarked = bookmarks.data?.includes(lesson.slug) ?? false
  const initial = useRef(false)
  useEffect(() => {
    if (initial.current) return
    initial.current = true
    save({ slug: lesson.slug, step: index })
  }, [index, lesson.slug, save])
  const select = useCallback(
    (next: number) => {
      if (next < 0 || next >= lesson.steps.length || next === index) return
      setIndex(next)
      setCheck(false)
      save({ slug: lesson.slug, step: next })
    },
    [index, lesson, save],
  )
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey ||
        document.querySelector('dialog[open],[aria-modal="true"]')
      )
        return
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input,select,textarea,[contenteditable="true"],[role="slider"],.rr-lab,.rr-sidebar',
        )
      )
        return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        select(index + (e.key === 'ArrowRight' ? 1 : -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, select])
  const track = tracks.find((t) => t.id === lesson.trackId)
  const nextLesson = lessons[lessons.findIndex((l) => l.slug === lesson.slug) + 1]
  const showCheck = () => {
    setCheck(true)
    requestAnimationFrame(() =>
      document
        .getElementById('rr-check')
        ?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' }),
    )
  }
  return (
    <div
      className="rr-player"
      style={{ '--track-tint': track?.color ?? '#d8c7ed' } as CSSProperties}
    >
      <div className="rr-breadcrumb">
        <Link to="/curriculum">Curriculum</Link>
        <ChevronRight size={13} />
        <Link to={'/curriculum?track=' + lesson.trackId}>{track?.title}</Link>
        <ChevronRight size={13} />
        <span>
          Lesson{' '}
          {String(
            lessons
              .filter((l) => l.trackId === lesson.trackId)
              .findIndex((l) => l.slug === lesson.slug) + 1,
          ).padStart(2, '0')}
        </span>
      </div>
      <div className={'rr-workspace ' + (open ? 'is-open' : '')}>
        <div className="rr-nav-slot">
          <button
            className="rr-nav-toggle"
            aria-expanded={open}
            aria-controls="rr-outline"
            onClick={() => setOpen(!open)}
          >
            {open ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}{' '}
            {open ? 'Hide contents' : 'Show contents'}
          </button>
          {open && (
            <div id="rr-outline">
              <LessonNavigation
                {...{ lesson, lessons, tracks, progress }}
                onNavigate={() => {
                  if (window.innerWidth < 1100) setOpen(false)
                }}
              />
            </div>
          )}
        </div>
        <div className="rr-lesson-body">
          <div className="rr-title-row">
            <div className="rr-track-meta">
              <span />
              {track?.title}
              <i /> {track?.difficulty}
            </div>
            <button
              className="rr-bookmark"
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
              aria-pressed={bookmarked}
              disabled={bookmarks.isPending || bookmarks.isError || bookmark.isPending}
              onClick={() => bookmark.mutate({ slug: lesson.slug, bookmarked: !bookmarked })}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
              {bookmarked ? 'Saved' : 'Save lesson'}
            </button>
          </div>
          <h1>{lesson.title}</h1>
          <p className="rr-objective">{lesson.objective}</p>
          {(bookmark.isError || bookmarks.isError) && (
            <p role="alert">
              Bookmarks could not be updated.{' '}
              <button
                onClick={() =>
                  bookmarks.isError
                    ? bookmarks.refetch()
                    : bookmark.mutate({ slug: lesson.slug, bookmarked: !bookmarked })
                }
              >
                Try again
              </button>
            </p>
          )}
          <div className="rr-lesson-grid">
            <Walkthrough lesson={lesson} index={index} onStep={select} onCheck={showCheck} />
            <LessonNotes lesson={lesson} index={index} />
          </div>
          {saveError && (
            <p role="alert">
              Your progress could not be saved.{' '}
              <button onClick={() => failedWrite && save(failedWrite)}>Save again</button>
            </p>
          )}
          {check && (
            <KnowledgeCheck
              lesson={lesson}
              completed={Boolean(saved?.completed)}
              pending={saving}
              onComplete={() => save({ slug: lesson.slug, step: index, completed: true })}
            />
          )}
          {saved?.completed && (
            <motion.div className="rr-finish" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>
                <Check size={16} />
                Lesson completed
              </span>
              <Link to={nextLesson ? '/lessons/' + nextLesson.slug : '/progress'}>
                {nextLesson ? 'Next lesson' : 'View progress'} <ArrowRight size={15} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
export default function LessonPage() {
  const { slug = '' } = useParams()
  const lesson = useLesson(slug),
    lessons = useLessons(),
    tracks = useTracks(),
    progress = useProgress()
  const queries = [lesson, lessons, tracks, progress]
  if (queries.some((q) => q.isError))
    return (
      <div className="rr-load">
        <BookOpen size={24} />
        <h1>Lesson unavailable</h1>
        <p>{queries.find((q) => q.isError)?.error?.message}</p>
        <button
          className="btn"
          onClick={() => queries.filter((q) => q.isError).forEach((q) => void q.refetch())}
        >
          Try again
        </button>{' '}
        <Link className="btn" to="/curriculum">
          Back to curriculum
        </Link>
      </div>
    )
  if (!lesson.data || !lessons.data || !tracks.data || !progress.data)
    return (
      <div className="rr-load" aria-busy="true" role="status">
        <span>Opening lesson…</span>
        <div className="skeleton" />
      </div>
    )
  return (
    <Studio
      key={slug}
      lesson={lesson.data}
      lessons={lessons.data}
      tracks={tracks.data}
      progress={progress.data}
    />
  )
}
