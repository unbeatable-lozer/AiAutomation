import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  // Test directory
  testDir: './src/tests',
  
  // Test matching patterns
  testMatch: '**/*.test.ts',
  
  // Timeout settings
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // Fully parallel execution
  fullyParallel: true,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Worker processes
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  // Global teardown
  globalTeardown: require.resolve('./src/framework/testrail/global-teardown'),
  
  // Trace settings
  use: {
    // Base URL from environment
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect traces on failure
    trace: 'on-first-retry',
    
    // Collect screenshots on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'on-first-retry',
    
    // Locale settings
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'America/New_York',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
    
    // Custom context options
    contextOptions: {
      reducedMotion: 'reduce'
    }
  },
  
  // Projects configuration
  projects: [
    // Chromium browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Firefox browser
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    // WebKit (Safari)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // AI-powered tests (natural-language element finding and visual testing).
    // Headless by default; run with HEADED=true to watch the browser.
    {
      name: 'ai',
      use: { 
        ...devices['Desktop Chrome'],
        headless: process.env.HEADED !== 'true'
      },
      testMatch: '**/ai-*.test.ts'
    }
  ],
  
  // Output directory for test artifacts
  outputDir: 'test-results',
  
  // Local dev server
  webServer: process.env.WEB_SERVER_URL ? {
    command: `npx serve ${process.env.WEB_SERVER_URL}`,
    port: Number(process.env.PORT) || 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  } : undefined
});