import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, Command } from 'lucide-react'
import { motion } from 'motion/react'
import { Brand } from '../components/Brand'
import Palette from '../features/search/Palette'

const pages = [
  ['/', 'Overview'],
  ['/curriculum', 'Curriculum'],
  ['/progress', 'My progress'],
] as const
function NavLinks({ close }: { close?: () => void }) {
  return pages.map(([to, name]) => (
    <NavLink key={to} to={to} onClick={close} end={to === '/'}>
      {name}
    </NavLink>
  ))
}
export default function Shell() {
  const [search, setSearch] = useState(false),
    [menu, setMenu] = useState(false),
    [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark')
  const { pathname } = useLocation()
  const previous = useRef<HTMLElement | null>(null)
  const lastPath = useRef(pathname)
  const open = useCallback(() => {
    previous.current = document.activeElement as HTMLElement
    setSearch(true)
    setMenu(false)
  }, [])
  const close = useCallback(() => {
    setSearch(false)
    requestAnimationFrame(() => previous.current?.focus())
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (search) close()
        else open()
      }
      if (e.key === 'Escape') setMenu(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, close, search])
  useEffect(() => {
    window.scrollTo(0, 0)
    const page =
      pages.find(([to]) => to === pathname)?.[1] ??
      (pathname.startsWith('/lessons/') ? pathname.slice(9).replaceAll('-', ' ') : 'Page not found')
    document.title =
      pathname === '/'
        ? 'React, Rendered · An interactive field guide'
        : page.charAt(0).toUpperCase() + page.slice(1) + ' · React, Rendered'
    if (lastPath.current !== pathname) {
      document.getElementById('main')?.focus({ preventScroll: true })
      lastPath.current = pathname
    }
  }, [pathname])
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    try {
      localStorage.setItem('rendered-theme', next ? 'dark' : 'light')
    } catch {
      /* Storage may be disabled. */
    }
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap nav-row">
          <Brand />
          <nav className="main-nav" aria-label="Main">
            <NavLinks />
          </nav>
          <div className="utilities">
            <button className="search-launch" onClick={open} aria-label="Search lessons">
              <Search size={15} />
              <span>Search lessons</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <button
              className="icon-btn"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
              onClick={toggle}
            >
              {dark ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button
              className="mobile-menu icon-btn"
              aria-expanded={menu}
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" aria-label="Mobile">
            <NavLinks close={() => setMenu(false)} />
          </nav>
        )}
      </header>
      <motion.main
        id="main"
        tabIndex={-1}
        key={pathname}
        initial={{ opacity: 0.65, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.main>
      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div>
            <Brand />
            <p>React concepts, beautifully explained.</p>
          </div>
          <nav aria-label="Footer">
            <Link to="/curriculum">Curriculum</Link>
            <Link to="/progress">My progress</Link>
            <a href="https://react.dev/learn">React documentation ↗</a>
          </nav>
        </div>
      </footer>
      {search && <Palette close={close} />}
    </>
  )
}
