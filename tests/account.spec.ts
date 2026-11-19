import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

function savedLesson(page: Page) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Bookmarks', exact: true }) })
    .getByRole('link', { name: 'How React renders' })
}

test('carries guest work into an account and restores it on another device', async ({
  page,
  browser,
  baseURL,
}) => {
  const email = `learner-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.goto('/lessons/how-react-renders')
  await page.getByRole('button', { name: 'Bookmark lesson' }).click()
  await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click()
  await page.getByRole('main').getByRole('link', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/progress$/)
  await expect(savedLesson(page)).toBeVisible()

  const otherDevice = await browser.newContext({ baseURL, viewport: { width: 320, height: 720 } })
  try {
    const phone = await otherDevice.newPage()
    await phone.goto('/progress')
    await expect(savedLesson(phone)).toHaveCount(0)
    await phone.getByRole('button', { name: 'Open navigation' }).click()
    await phone
      .getByRole('navigation', { name: 'Mobile' })
      .getByRole('link', { name: 'Sign in' })
      .click()
    await phone.getByLabel('Email address', { exact: true }).fill(email)
    await phone.getByLabel('Password', { exact: true }).fill('a different passphrase')
    await phone.getByRole('button', { name: 'Sign in' }).click()
    await expect(phone.getByRole('alert')).toBeVisible()
    await expect(phone.getByLabel('Email address', { exact: true })).toHaveValue(email)
    await phone.getByLabel('Password', { exact: true }).fill(password)
    await phone.getByRole('button', { name: 'Sign in' }).click()
    await expect(savedLesson(phone)).toBeVisible()
    await phone.reload()
    await expect(savedLesson(phone)).toBeVisible()

    const openTab = await page.context().newPage()
    await openTab.goto('/progress')
    await expect(savedLesson(openTab)).toBeVisible()
    await page.getByRole('banner').getByRole('link', { name: 'Account' }).click()
    await expect(page.getByText(email, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(savedLesson(openTab)).toHaveCount(0)
    await page.goto('/progress')
    await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible()
    await expect(savedLesson(page)).toHaveCount(0)

    await phone.reload()
    await expect(savedLesson(phone)).toBeVisible()
  } finally {
    await otherDevice.close()
  }
})
