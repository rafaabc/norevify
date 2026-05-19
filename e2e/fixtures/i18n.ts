import { Page, expect } from '@playwright/test';

export async function setLanguage(page: Page, lang: string) {
  await page.evaluate((l) => localStorage.setItem('i18nextLng', l), lang);
  await page.reload();
}

export async function switchToLanguage(page: Page, lang: string) {
  await page.goto('/settings');
  await page.locator('#settings-language').selectOption(lang);
  const langForm = page.locator('form', { has: page.locator('#settings-language') });
  await langForm.getByRole('button', { name: /Salvar|Save/i }).click();
}

export async function expectEnglishNav(page: Page) {
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Expenses' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();
}

export async function expectPtBrNav(page: Page) {
  await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Despesas' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resumo' })).toBeVisible();
}
