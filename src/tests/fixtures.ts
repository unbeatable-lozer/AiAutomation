/**
 * Custom Test Fixtures
 * 
 * Extended Playwright fixtures with AI and TestRail capabilities
 */

import { test as base, Page, BrowserContext } from '@playwright/test';

/**
 * Custom page fixture with AI helpers
 */
class CustomPage {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  /**
   * Find element using AI
   */
  async aiFind(description: string) {
    // This would integrate with AI Element Finder
    // For now, return a basic locator
    return this.page.locator(description);
  }

  /**
   * Take screenshot for visual testing
   */
  async screenshot(name: string) {
    return await this.page.screenshot();
  }

  /**
   * Get page title
   */
  async title(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Navigate to URL
   */
  goto(url: string) {
    return this.page.goto(url);
  }

  /**
   * Click element
   */
  click(selector: string) {
    return this.page.click(selector);
  }

  /**
   * Fill input
   */
  fill(selector: string, value: string) {
    return this.page.fill(selector, value);
  }

  /**
   * Get locator
   */
  locator(selector: string) {
    return this.page.locator(selector);
  }
}

/**
 * Custom test fixture type
 */
export interface TestFixtures {
  customPage: CustomPage;
}

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  customPage: async ({ page, context }, use) => {
    const customPage = new CustomPage(page, context);
    await use(customPage);
  }
});

export const { expect } = base;

export default { test, expect };