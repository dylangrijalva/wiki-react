import { useEffect, useRef, useState } from 'react'
import { Search, CornerDownLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLessons } from '../curriculum/queries'
import { useSearch } from './queries'

import './palette.css'

export default function Palette({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState(''),
    [active, setActive] = useState(0)
  const list = useLessons(),
    search = useSearch(term.trim())
  const result = term.trim() ? search : list
  const rows = term.trim() ? (result.data ?? []) : (result.data ?? []).slice(0, 12)
  const navigate = useNavigate()
  const go = (slug: string) => {
    close()
    navigate('/lessons/' + slug)
  }
  useEffect(() => {
    const el = dialog.current
    el?.showModal()
    input.current?.focus()
    return () => el?.close()
  }, [])
  return (
    <dialog
      className="palette"
      ref={dialog}
      aria-labelledby="palette-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) close()
      }}
      onKeyDown={(e) => {
        if (!rows.length) return
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
          setActive(next)
          input.current?.focus()
          dialog.current?.querySelector('#match-' + next)?.scrollIntoView({ block: 'nearest' })
        } else if (e.key === 'Enter' && e.target === input.current) {
          e.preventDefault()
          go(rows[Math.min(active, rows.length - 1)].slug)
        }
      }}
    >
      <div className="palette-inner">
        <div className="palette-bar">
          <Search size={19} />
          <h2 id="palette-title" className="sr-only">
            Search lessons
          </h2>
          <input
            ref={input}
            role="combobox"
            aria-autocomplete="list"
            aria-controls="lesson-matches"
            aria-expanded="true"
            aria-activedescendant={rows[active] ? 'match-' + active : undefined}
            maxLength={160}
            aria-label="Search lessons"
            placeholder="Try a topic like props or caching"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setActive(0)
            }}
          />
          <button onClick={close} aria-label="Close search">
            <X size={18} />
          </button>
        </div>
        <p className="kicker">{term ? 'Matching lessons' : 'Browse lessons'}</p>
        <div className="matches" id="lesson-matches" role="listbox" aria-label="Matching lessons">
          {rows.map((r, i) => (
            <button
              role="option"
              aria-selected={active === i}
              tabIndex={-1}
              id={'match-' + i}
              className={i === active ? 'selected' : ''}
              key={r.slug}
              onFocus={() => setActive(i)}
              onClick={() => go(r.slug)}
            >
              <span>{r.title}</span>
              <CornerDownLeft size={14} />
            </button>
          ))}
        </div>
        {!rows.length && (
          <p>
            {result.isPending
              ? 'Searching…'
              : result.isError
                ? 'We couldn’t load the search results. Try again.'
                : 'No lessons found. Try a shorter search.'}
          </p>
        )}
        <div className="palette-foot mono">
          <span>↑ ↓ to browse</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </dialog>
  )
}
