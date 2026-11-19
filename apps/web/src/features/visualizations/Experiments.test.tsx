import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Experiment } from './Experiments'

afterEach(cleanup)

describe('Hands-on experiments', () => {
  it('shows that an index key can preserve an editing draft on the wrong clip', () => {
    render(<Experiment slug="lists-and-keys" />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Row key' }), {
      target: { value: 'index' },
    })
    expect(screen.getByText(/inherits the draft you were editing for Hat/)).toBeTruthy()
    const after = screen.getByRole('img', { name: 'Clip tree (after)' })
    expect(after.querySelector('desc')?.textContent).toContain('Kick, Active, draft: editing')
  })

  it('retains cached clips on a failed background refetch', () => {
    render(<Experiment slug="fetching-and-caching" />)
    const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
    press('Open collection')
    press('Resolve request')
    press('Open collection')
    expect(screen.getByText(/reads fresh clips from the cache/)).toBeTruthy()
    press('Mark cache stale')
    press('Open collection')
    press('Fail request')
    expect(screen.getByRole('img').querySelector('desc')?.textContent).toContain(
      'show cached clips',
    )
    expect(screen.getByText(/keep the cached clips on screen/)).toBeTruthy()
  })

  it('closes the previous station on a change and cleans up the current station on unmount', () => {
    render(<Experiment slug="effect-lifecycle" />)
    fireEvent.click(screen.getByRole('button', { name: 'Change station' }))
    expect(screen.getByRole('img').querySelector('desc')?.textContent).toContain('close Jazz')
    expect(screen.getByRole('img').querySelector('desc')?.textContent).toContain('open Folk')
    fireEvent.click(screen.getByRole('button', { name: 'Unmount player' }))
    expect(screen.getByRole('img').querySelector('desc')?.textContent).toContain('close Folk')
    expect(screen.getByRole('img').querySelector('desc')?.textContent).not.toContain('open Folk')
  })

  it('skips an unchanged sample reference only in the optimized model', () => {
    render(<Experiment slug="memoization" />)
    const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
    press('Change theme')
    expect(screen.getByText('1 render call')).toBeTruthy()
    press('Memo off')
    press('Change theme')
    expect(screen.getByText('0 render calls')).toBeTruthy()
    press('New samples')
    expect(screen.getByText('1 render call')).toBeTruthy()
  })
})
