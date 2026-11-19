import type { Track } from '../types.js'

export const tracks: Track[] = [
  {
    id: 'fundamentals',
    title: 'React Fundamentals',
    description: 'See how React turns JSX into a page and keeps track of each item in a list.',
    difficulty: 'Beginner',
    color: '#af9aef',
  },
  {
    id: 'state',
    title: 'State Management',
    description: 'Only one channel can play solo. Decide where the mixer should keep that state.',
    difficulty: 'Beginner',
    color: '#a4d6ae',
  },
  {
    id: 'effects',
    title: 'Effects and Data',
    description:
      'See why switching stations closes the old stream and when the clip library can reuse cached data.',
    difficulty: 'Intermediate',
    color: '#91bbeb',
  },
  {
    id: 'performance',
    title: 'React Performance',
    description:
      'Count the renders after an update. Try memoizing a chart or rendering only the rows near the visible part of a list.',
    difficulty: 'Intermediate',
    color: '#f5bb83',
  },
  {
    id: 'architecture',
    title: 'Scalable Architecture',
    description: 'Give the export feature its own folder and reuse the same clip row in two views.',
    difficulty: 'Advanced',
    color: '#e9a7c0',
  },
  {
    id: 'production',
    title: 'Production Best Practices',
    description:
      'Test a rename form, move through tabs with the keyboard, and recover when a preview fails.',
    difficulty: 'Advanced',
    color: '#e8d57e',
  },
]
