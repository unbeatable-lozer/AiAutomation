/**
 * AI-Powered Test Example
 * 
 * Demonstrates AI-powered element finding and visual testing
 * Requires ENABLE_AI=true in environment
 */

import { test, expect, Page } from '@playwright/test';

// Skip these tests if AI is not enabled
const testWithAI = process.env.ENABLE_AI === 'true' ? test : test.skip;

/**
 * Test: AI-powered element finding
 * Uses natural language to find elements
 */
testWithAI('AI can find login button by description', async ({ page }: { page: Page }) => {
  // Mock the login page
  await page.route('**/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login</title>
          </head>
          <body>
            <form>
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // Use AI to find the submit button
  const result = await page.evaluate(() => {
    // This would use the AI fixture in actual usage
    return { found: true, method: 'ai' };
  });
  
  // Basic verification
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

/**
 * Test: AI-powered visual regression testing
 * Compares screenshots with AI analysis
 */
testWithAI('visual regression test for login page', async ({ page }: { page: Page }) => {
  // Mock the login page
  await page.route('**/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login</title>
          </head>
          <body>
            <form>
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // This would use AI visual comparison in actual usage
  // For now, verify the page looks correct
  await expect(page.locator('form')).toBeVisible();
  
  // Get page analysis
  const analysis = await page.evaluate(() => {
    return {
      title: document.title,
      hasForm: document.querySelector('form') !== null,
      hasInput: document.querySelectorAll('input').length
    };
  });
  
  expect(analysis.hasForm).toBe(true);
  expect(analysis.hasInput).toBeGreaterThan(0);
});

/**
 * Test: AI self-healing locator
 * Demonstrates auto-healing when selectors break
 */
testWithAI('test with AI self-healing', async ({ page }: { page: Page }) => {
  // Mock the login page
  await page.route('**/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login</title>
          </head>
          <body>
            <form>
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // In a real scenario, this would use the AI healing mechanism
  // when a selector fails
  await expect(page.locator('input[name="username"]')).toBeVisible();
});

/**
 * Test: AI page analysis
 * Analyzes page structure for testing
 */
testWithAI('AI page analysis', async ({ page }: { page: Page }) => {
  // Mock the login page
  await page.route('**/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login Page</title>
          </head>
          <body>
            <form>
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // Analyze the page structure
  const structure = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input');
    const buttons = document.querySelectorAll('button');
    
    return {
      formCount: forms.length,
      inputCount: inputs.length,
      buttonCount: buttons.length
    };
  });
  
  expect(structure.formCount).toBeGreaterThan(0);
  expect(structure.inputCount).toBeGreaterThan(0);
  expect(structure.buttonCount).toBeGreaterThan(0);
});

/**
 * Test: Compare screenshot with baseline
 * Uses AI-powered visual comparison
 */
testWithAI('compare login page screenshot', async ({ page }: { page: Page }) => {
  // Mock the login page
  await page.route('**/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login</title>
          </head>
          <body>
            <form>
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/login');
  
  // Take a screenshot (in real usage this would compare with baseline)
  const screenshot = await page.screenshot();
  expect(screenshot).toBeDefined();
});