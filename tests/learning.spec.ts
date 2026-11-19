import { expect, test as base, type Page } from '@playwright/test'
import type { Lesson, LessonSummary } from '../packages/shared/src/contracts/catalog'

const test = base.extend<{ errors: void }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await use()
      expect(errors, 'Browser console and unhandled errors').toEqual([])
    },
    { auto: true },
  ],
})

async function openExperiment(page: Page, slug: string) {
  await page.goto('/lessons/' + slug)
  await page.getByRole('button', { name: 'Experiment', exact: true }).click()
}

test('rotates the homepage headline and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const heading = page.getByRole('heading', { level: 1, name: 'React, under the hood.' })
  const lines = heading.locator('.headline-line')
  await expect(lines).toHaveText(['React, under', 'the hood.'])
  await expect(lines.last()).toHaveCSS('font-style', 'normal')
  await expect(lines).toHaveText(['Trace a', 'state update.'], { timeout: 10_000 })
  await page.getByRole('button', { name: 'Pause headline animation' }).click()
  await expect(heading.locator('[data-caret="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Resume headline animation' }).click()
  await expect(heading.locator('[data-caret="true"]')).toHaveCount(1)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(lines).toHaveText(['React, under', 'the hood.'])
  await expect(heading.locator('[data-caret="true"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /headline animation/ })).toHaveCount(0)
})

test('learn, resume, save, finish the check and revisit from the dashboard', async ({ page }) => {
  const slug = 'how-react-renders'
  await page.goto('/')
  await page.getByRole('link', { name: 'Start learning' }).click()
  const lesson: Lesson = await (await page.request.get('/api/lessons/' + slug)).json()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title)
  await expect(page).toHaveTitle(lesson.title + ' · React, Rendered')
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
  const nextWrite = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/progress/' + slug) &&
      response.request().method() === 'PUT' &&
      response.request().postDataJSON().step === 1 &&
      response.ok(),
  )
  await page.keyboard.press('ArrowRight')
  await nextWrite
  await expect(page.getByRole('heading', { name: lesson.steps[1].title })).toBeVisible()
  await page.getByRole('button', { name: 'Bookmark lesson' }).click()
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload()
  await expect(page.getByRole('heading', { name: lesson.steps[1].title })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('heading', { name: lesson.steps[0].title })).toBeVisible()
  for (const step of lesson.steps.slice(1)) {
    await page.getByRole('button', { name: 'Next step' }).click()
    await expect(page.getByRole('heading', { name: step.title })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Knowledge check' }).click()
  const quiz = page.getByRole('region', { name: lesson.quiz.question })
  const wrong = (lesson.quiz.answer + 1) % lesson.quiz.options.length
  await quiz.getByRole('button').filter({ hasText: lesson.quiz.options[wrong] }).click()
  await expect(quiz.getByRole('status')).toContainText('try again')
  await quiz
    .getByRole('button')
    .filter({ hasText: lesson.quiz.options[lesson.quiz.answer] })
    .click()
  await quiz.getByRole('button', { name: 'Complete lesson' }).click()
  await expect(quiz.getByRole('button', { name: 'Lesson completed' })).toBeDisabled()
  await page
    .getByRole('navigation', { name: 'Main', exact: true })
    .getByRole('link', { name: 'My progress' })
    .click()
  await page.reload()
  await expect(
    page.getByRole('main').getByRole('link').filter({ hasText: lesson.title }).first(),
  ).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Overall completion' })).toHaveAttribute(
    'value',
    '4',
  )
  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Bookmarks', exact: true }) })
      .getByRole('link', { name: lesson.title }),
  ).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Main', exact: true })
    .getByRole('link', { name: 'Curriculum' })
    .click()
  await page.getByRole('combobox', { name: 'Subject' }).selectOption('fundamentals')
  await page.getByRole('combobox', { name: 'Difficulty' }).selectOption('Beginner')
  await page.getByRole('combobox', { name: 'Completion status' }).selectOption('complete')
  const match = page.locator('.catalog-list').getByRole('link')
  await expect(match).toHaveCount(1)
  await expect(match).toHaveAccessibleName(lesson.title + ' Complete')
  const progress = await (await page.request.get('/api/progress')).json()
  expect(progress).toEqual([
    expect.objectContaining({
      lessonId: slug,
      completed: true,
      visitedSteps: lesson.steps.map((_, index) => index),
    }),
  ])
  expect(await (await page.request.get('/api/bookmarks')).json()).toEqual([slug])
})

test('finds a lesson with the command palette using only the keyboard', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog')
  const input = dialog.getByRole('combobox', { name: 'Search lessons' })
  await expect(input).toBeFocused()
  await input.fill('lists-and-keys')
  await expect(dialog.locator('.matches button')).toHaveCount(1)
  await input.press('Enter')
  await expect(page).toHaveURL(/\/lessons\/lists-and-keys$/)
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('compares stable row identities and inserted children', async ({ page }) => {
  await openExperiment(page, 'lists-and-keys')
  await page.getByRole('button', { name: 'Replace', exact: true }).click()
  await expect(page.getByText('Snare unmounts.', { exact: false })).toBeVisible()
  await page.getByLabel('Row key').selectOption('index')
  await expect(
    page.getByText('The second row keeps Snare’s local state', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Reset experiment' }).click()
  await expect(page.getByLabel('Row key')).toHaveValue('id')
  await openExperiment(page, 'component-composition')
  await page.getByRole('button', { name: 'Add caption' }).click()
  await expect(page.getByText('Tape loop', { exact: true })).toBeVisible()
})

test('changes parent state and observes cleanup before a new setup', async ({ page }) => {
  await openExperiment(page, 'lifting-state-up')
  await page.getByRole('button', { name: 'Solo Bass' }).click()
  await expect(
    page.getByText('Updating soloId to Bass queues a Mixer render.', {
      exact: false,
    }),
  ).toBeVisible()
  await openExperiment(page, 'effect-lifecycle')
  await page.getByRole('button', { name: 'Change station' }).click()
  await expect(
    page.getByText('Cleanup closes the Jazz stream before setup opens Folk.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Unmount player' }).click()
  await expect(page.getByRole('button', { name: 'Render again' })).toBeDisabled()
})

test('compares memoized updates and cached background requests', async ({ page }) => {
  await openExperiment(page, 'memoization')
  await page.getByRole('button', { name: 'Memo off' }).click()
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await expect(page.getByText('memo skips this render.', { exact: false })).toBeVisible()
  await openExperiment(page, 'fetching-and-caching')
  await page.getByRole('button', { name: 'Open collection' }).click()
  await page.getByRole('button', { name: 'Resolve request' }).click()
  await page.getByRole('button', { name: 'Open collection' }).click()
  await expect(page.getByText('reads fresh clips from the cache', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Mark cache stale' }).click()
  await page.getByRole('button', { name: 'Open collection' }).click()
  await page.getByRole('button', { name: 'Fail request' }).click()
  await expect(
    page.getByText('The list can show the error and keep the cached clips on screen.', {
      exact: false,
    }),
  ).toBeVisible()
})

for (const width of [320, 390, 820, 1440]) {
  test(`the four experiences fit a ${width}px viewport and preserve the theme`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Use dark theme' }).click()
    for (const path of ['/', '/curriculum', '/progress', '/lessons/how-react-renders']) {
      await page.goto(path)
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
    }
    await expect(page.getByRole('button', { name: 'Pause motion' })).toHaveCount(0)
    if (width === 390) {
      await page.getByRole('button', { name: 'Show contents' }).click()
      const outline = page.getByRole('navigation', { name: 'Lesson navigation' })
      await outline.getByRole('searchbox').fill('keys')
      await outline.getByRole('link').last().click()
      await expect(page).toHaveURL(/\/lessons\/lists-and-keys$/)
    }
  })
}

test('opens navigation and searches the curriculum on a 320px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/progress')
  const header = page.getByRole('banner')
  await header.getByRole('button', { name: 'Open navigation' }).click()
  const menu = header.getByRole('navigation', { name: 'Mobile' })
  await menu.getByRole('link', { name: 'Curriculum' }).click()
  await expect(menu).not.toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('curriculum')
  const subject = page.getByRole('combobox', { name: 'Subject' })
  await subject.selectOption('production')
  await expect(
    page.getByRole('main').getByRole('link', { name: /Forms and validation/ }),
  ).toBeVisible()

  await header.getByRole('button', { name: 'Search lessons' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox').fill('lists-and-keys')
  const result = dialog.getByRole('option')
  await expect(result).toHaveCount(1)
  const bounds = await dialog.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  await result.click()
  await expect(page).toHaveURL(/\/lessons\/lists-and-keys$/)

  const fonts = await page
    .getByLabel('TypeScript example')
    .locator('code')
    .evaluate(async (code) => {
      await document.fonts.ready
      const firstFamily = (element: Element) =>
        getComputedStyle(element).fontFamily.split(',')[0].trim().replace(/["']/g, '')
      return {
        heading: firstFamily(document.querySelector('main h1')!),
        code: firstFamily(code),
        loaded: [...document.fonts]
          .filter((face) => face.status === 'loaded')
          .map((face) => face.family.replace(/["']/g, '')),
      }
    })
  expect(fonts.heading).toBe('Geist')
  expect(fonts.code).toBe('Geist Mono')
  expect(fonts.loaded).toEqual(expect.arrayContaining(['Geist', 'Geist Mono']))
})

test('every published lesson changes its visible SVG at each step', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const catalog: LessonSummary[] = await (await page.request.get('/api/lessons')).json()
  expect(catalog).toHaveLength(24)
  for (const summary of catalog) {
    await test.step(summary.title, async () => {
      await page.goto('/lessons/' + summary.slug)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(summary.title)
      const diagram = page.locator('.rr-canvas svg[role="img"]')
      await expect(diagram).toBeVisible()
      const visibleScene = () =>
        diagram.evaluate((svg) => {
          const copy = svg.cloneNode(true) as SVGElement
          copy.querySelectorAll('desc,title,defs').forEach((node) => node.remove())
          return copy.innerHTML
        })
      for (let index = 1; index < summary.stepCount; index++) {
        const before = await visibleScene()
        await page.getByRole('button', { name: 'Next step' }).click()
        await expect.poll(visibleScene).not.toBe(before)
        await expect(page.getByLabel('TypeScript example')).not.toBeEmpty()
      }
      await expect(page.getByRole('button', { name: 'Knowledge check' })).toBeVisible()
      const steps = page.getByRole('group', { name: 'Lesson steps' })
      await expect(steps.getByRole('button')).toHaveCount(summary.stepCount)
    })
  }
})
