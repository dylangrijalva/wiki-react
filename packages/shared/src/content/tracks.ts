import type { Track } from '../types.js'

export const tracks: Track[] = [
  {
    id: 'fundamentals',
    title: 'React Fundamentals',
    description: 'Follow JSX from a component function to the pixels on screen.',
    difficulty: 'Beginner',
    color: '#af9aef',
  },
  {
    id: 'state',
    title: 'State Management',
    description: 'Trace an update through a tree and find the right home for state.',
    difficulty: 'Beginner',
    color: '#a4d6ae',
  },
  {
    id: 'effects',
    title: 'Effects and Data',
    description: 'Connect to the outside world, clean up subscriptions, and reuse cached data.',
    difficulty: 'Intermediate',
    color: '#91bbeb',
  },
  {
    id: 'performance',
    title: 'React Performance',
    description: 'Track rendering work and choose what to defer, reuse, or skip.',
    difficulty: 'Intermediate',
    color: '#f5bb83',
  },
  {
    id: 'architecture',
    title: 'Scalable Architecture',
    description: 'Design components and feature boundaries that can change independently.',
    difficulty: 'Advanced',
    color: '#e9a7c0',
  },
  {
    id: 'production',
    title: 'Production Best Practices',
    description:
      'Build interfaces that hold up through keyboard use, bad input, and failed requests.',
    difficulty: 'Advanced',
    color: '#e8d57e',
  },
]
