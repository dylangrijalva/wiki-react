import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Layers3,
  MousePointer2,
  Play,
  Bookmark,
  Route,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useLessons, useTracks } from '../curriculum/queries'
import { TrackArt, trackPaper } from '../../components/Illustrations'
import RenderFigure from './RenderFigure'
import HeroHeadline from './HeroHeadline'
import './home.css'

const guideSteps = [
  {
    Icon: Route,
    title: 'Choose a lesson',
    description: 'Start with rendering, or jump to a topic you already use in your code.',
  },
  {
    Icon: MousePointer2,
    title: 'Read the diagram alongside the code',
    description:
      'Use the arrow keys to move one step at a time. At the end, try the question to check your understanding.',
  },
  {
    Icon: Bookmark,
    title: 'Pick up where you left off',
    description:
      'Each lesson remembers your last step. Create an account to use your bookmarks and progress on another device.',
  },
]
export default function Home() {
  const tracks = useTracks(),
    lessons = useLessons()
  return (
    <div className="wrap home">
      <section className="hero">
        <div className="hero-copy">
          <HeroHeadline />
          <p>
            When a counter goes from 0 to 1, which components run again? Step through a render and
            see what React changes on screen.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/lessons/how-react-renders">
              Start learning <ArrowRight size={17} />
            </Link>
            <Link className="btn" to="/curriculum">
              <BookOpen size={16} /> Explore lessons
            </Link>
          </div>
          <div className="course-facts">
            <span>
              <Layers3 />6 learning tracks
            </span>
            <span>
              <BookOpen />
              24 lessons
            </span>
            <span>
              <MousePointer2 />
              Self-paced
            </span>
          </div>
        </div>
        <RenderFigure />
      </section>
      <aside className="author-note" aria-labelledby="author-note-title">
        <h2 id="author-note-title">Why I made this guide</h2>
        <p>
          I struggled with React when I was starting out. I made these lessons to give you an easier
          way to learn it. You can step through a diagram and see what your code does.
        </p>
      </aside>
      <section className="track-section">
        <div className="section-head">
          <h2>Learning tracks</h2>
          <Link className="text-link" to="/curriculum">
            View curriculum <ArrowRight size={16} />
          </Link>
        </div>
        {tracks.isPending ? (
          <div className="skeleton" role="status" aria-label="Loading tracks" />
        ) : tracks.isError ? (
          <div className="notice">
            We couldn’t load the learning tracks.{' '}
            <button onClick={() => tracks.refetch()}>Try again</button>
          </div>
        ) : (
          <div className="track-grid">
            {tracks.data.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.055 }}
              >
                <Link className="track-card" to={'/curriculum?track=' + t.id}>
                  <div className="track-cover" style={{ backgroundColor: trackPaper(t.id) }}>
                    <TrackArt id={t.id} />
                    <span className="corner-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                  <div className="track-body">
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <div className="track-meta">
                      <BookOpen size={13} />
                      {(lessons.data ?? []).filter((l) => l.trackId === t.id).length || 4} lessons
                      <span>{t.difficulty}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <section className="feature-section">
        <div className="section-head">
          <h2>Featured experiments</h2>
        </div>
        <div className="featured-grid">
          {[
            [
              'lists-and-keys',
              'Reorder a clip list',
              'Swap two clips. Does the draft move with the clip you were editing?',
            ],
            [
              'effect-lifecycle',
              'Switch radio stations',
              'Watch the old stream disconnect before the new one opens.',
            ],
            [
              'fetching-and-caching',
              'Open a cached collection',
              'See which clips stay on screen while a fresh copy loads.',
            ],
          ].map(([slug, title, desc]) => (
            <Link key={slug} to={'/lessons/' + slug}>
              <Play size={18} />
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <ArrowRight size={15} />
            </Link>
          ))}
        </div>
      </section>
      <section className="how">
        <h2 className="display-heading">How to use this guide</h2>
        <div>
          {guideSteps.map(({ Icon, title, description }) => (
            <article key={title}>
              <Icon size={21} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
