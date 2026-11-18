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
import { useLessons, useTracks } from '../../lib/api'
import { TrackArt, trackPaper } from '../../components/Illustrations'
import RenderFigure from './RenderFigure'
import './home.css'

const guideSteps = [
  {
    Icon: Route,
    title: 'Pick a question',
    description: 'Follow a track in order or open the concept you need today.',
  },
  {
    Icon: MousePointer2,
    title: 'Step through it',
    description: 'Advance the diagram and connect each change to the code that caused it.',
  },
  {
    Icon: Bookmark,
    title: 'Pick up where you left off',
    description:
      'Answer the knowledge check or bookmark a lesson. Your place is saved in this browser.',
  },
]
export default function Home() {
  const tracks = useTracks(),
    lessons = useLessons()
  return (
    <div className="wrap home">
      <section className="hero">
        <div className="hero-copy">
          <div className="kicker field-label">
            <span className="edition-mark" />
            AN INTERACTIVE FIELD GUIDE
          </div>
          <h1 className="serif">
            React, under
            <br />
            <em>the hood.</em>
          </h1>
          <p>
            Explore how React works through animated diagrams, hands-on experiments, and bite-sized
            lessons.
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
            <i />
            <span>
              <BookOpen />
              24 lessons
            </span>
            <i />
            <span>
              <MousePointer2 />
              Self-paced
            </span>
          </div>
        </div>
        <RenderFigure />
      </section>
      <section className="track-section">
        <div className="section-head">
          <div>
            <div className="kicker">
              <span className="bar" />
              THE CURRICULUM
            </div>
            <h2>Learning tracks</h2>
          </div>
          <Link className="text-link" to="/curriculum">
            View curriculum <ArrowRight size={16} />
          </Link>
        </div>
        {tracks.isPending ? (
          <div className="skeleton" role="status" aria-label="Loading tracks" />
        ) : tracks.isError ? (
          <div className="notice">
            The curriculum could not load.{' '}
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
                    <span className="track-index">TRACK {String(i + 1).padStart(2, '0')}</span>
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
                      {(lessons.data ?? []).filter((l) => l.trackId === t.id).length ||
                        4} lessons <span>·</span> {t.difficulty}
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
          <div>
            <div className="kicker">
              <span className="bar" />
              AT THE WORKBENCH
            </div>
            <h2>Featured experiments</h2>
          </div>
        </div>
        <div className="featured-grid">
          {[
            [
              'lists-and-keys',
              'Reorder a component tree',
              'Follow a key as its list item changes position.',
            ],
            [
              'effect-lifecycle',
              'Trace an effect',
              'See when a connection opens and when it closes.',
            ],
            [
              'fetching-and-caching',
              'Inspect the cache',
              'Watch cached data meet a background request.',
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
        <div className="kicker">
          <span className="bar" />
          HOW TO USE THIS GUIDE
        </div>
        <h2 className="serif">Learn one change at a time.</h2>
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
