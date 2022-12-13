import { test } from '@playwright/test'

test('login', async ({ page }) => {
  await page.goto('http://localhost:3000/')

  await page.getByLabel(/email/i).type(process.env.TEST_USER)
  await page.getByLabel(/password/i).type(process.env.TEST_PASSWORD)
  await page.getByRole('button', { name: /login/i }).click()

  await page.waitForSelector('text=Monday')
})
