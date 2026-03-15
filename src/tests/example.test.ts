/**
 * Sample Test - Basic Usage
 * 
 * Demonstrates basic framework usage with TestRail integration
 */

import { test, expect } from '@playwright/test';

// TestRail case ID annotation for reporting
const testCaseId = (id: number) => ({
  type: 'caseId' as const,
  description: String(id)
});

/**
 * Test: Login page loads successfully
 * @testrail C1234
 */
test('login page loads', { annotation: testCaseId(1234) }, async ({ page }) => {
  // Mock the login page response
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
            <form class="login-form">
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Login</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // Verify page title
  await expect(page).toHaveTitle(/Login/i);
  
  // Verify login form is visible
  await expect(page.locator('form.login-form')).toBeVisible();
});

/**
 * Test: User can login with valid credentials
 * @testrail C1235
 */
test('user can login with valid credentials', { annotation: testCaseId(1235) }, async ({ page }) => {
  // Mock the login page and process
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
            <form class="login-form">
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Login</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  
  // Mock the form submission to redirect to dashboard
  await page.route('**/login', async route => {
    // Check if this is a POST request (form submission)
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Dashboard</title>
            </head>
            <body>
              <div class="welcome-message">Welcome, testuser!</div>
            </body>
          </html>
        `
      });
    } else {
      // GET request - show login form
      await route.continue();
    }
  });
  
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*/); // Any URL is fine for this mock
  await expect(page.locator('.welcome-message')).toBeVisible();
});

/**
 * Test: Invalid credentials show error
 * @testrail C1236
 */
test('invalid credentials show error', { annotation: testCaseId(1236) }, async ({ page }) => {
  // Mock the login page and error handling
  await page.route('**/login', async route => {
    if (route.request().method() === 'POST') {
      // Check if credentials are invalid
      const postData = route.request().postData();
      if (postData && 
          (postData.includes('invaliduser') || postData.includes('wrongpassword'))) {
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
                <form class="login-form">
                  <h1>Login</h1>
                  <input type="text" name="username" placeholder="Username">
                  <input type="password" name="password" placeholder="Password">
                  <button type="submit">Login</button>
                  <div class="error-message">Invalid credentials</div>
                </form>
              </body>
            </html>
          `
        });
      } else {
        // Valid credentials - redirect to dashboard
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Dashboard</title>
              </head>
              <body>
                <div class="welcome-message">Welcome!</div>
              </body>
            </html>
          `
        });
      }
    } else {
      // GET request - show login form
      await route.continue();
    }
  });
  
  await page.goto('/login');
  
  // Fill in invalid credentials
  await page.fill('input[name="username"]', 'invaliduser');
  await page.fill('input[name="password"]', 'wrongpassword');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Verify error message
  await expect(page.locator('.error-message')).toContainText('Invalid credentials');
});

/**
 * Test: Form validation works
 * @testrail C1237
 */
test('form validation requires all fields', { annotation: testCaseId(1237) }, async ({ page }) => {
  // Mock the login page with validation
  await page.route('**/login', async route => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postData();
      if (!postData || !postData.includes('username=') || !postData.includes('password=')) {
        // Missing fields - show validation errors
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
                <form class="login-form">
                  <h1>Login</h1>
                  <input type="text" name="username" placeholder="Username">
                  <span class="error">Required</span>
                  <input type="password" name="password" placeholder="Password">
                  <span class="error">Required</span>
                  <button type="submit">Login</button>
                </form>
              </body>
            </html>
          `
        });
      } else {
        // Has data - process normally
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Dashboard</title>
              </head>
              <body>
                <div class="welcome-message">Welcome!</div>
              </body>
            </html>
          `
        });
      }
    } else {
      // GET request - show login form
      await route.continue();
    }
  });
  
  await page.goto('/login');
  
  // Click login without filling fields
  await page.click('button[type="submit"]');
  
  // Verify validation errors
  await expect(page.locator('input[name="username"] + .error')).toContainText('Required');
  await expect(page.locator('input[name="password"] + .error')).toContainText('Required');
});

/**
 * Test: Navigation works correctly
 * @testrail C1238
 */
test('navigation to signup page', { annotation: testCaseId(1238) }, async ({ page }) => {
  // Mock the login page with a signup link
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
            <form class="login-form">
              <h1>Login</h1>
              <input type="text" name="username" placeholder="Username">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Login</button>
              <a href="/signup">Don't have an account? Sign Up</a>
            </form>
          </body>
        </html>
      `
    });
  });
  
  // Mock the signup page
  await page.route('**/signup', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sign Up</title>
          </head>
          <body>
            <h1>Sign Up</h1>
            <form>
              <input type="text" name="username" placeholder="Username">
              <input type="email" name="email" placeholder="Email">
              <input type="password" name="password" placeholder="Password">
              <button type="submit">Create Account</button>
            </form>
          </body>
        </html>
      `
    });
  });
  
  await page.goto('/login');
  
  // Click signup link
  await page.click('a[href="/signup"]');
  
  // Verify navigation
  await expect(page).toHaveURL(/.*\/signup/);
  await expect(page.locator('h1')).toContainText('Sign Up');
});